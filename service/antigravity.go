package service

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/vibeapi_setting"

	"github.com/bytedance/gopkg/util/gopool"
)

type upstreamTokenResponse struct {
	Token string `json:"token"`
	Id    string `json:"id"`
}

func upstreamConfigured() bool {
	return vibeapi_setting.UpstreamEnabled && vibeapi_setting.UpstreamURL != "" && vibeapi_setting.UpstreamAPIKey != ""
}

// CreateUpstreamToken calls the antigravity-manager API to create a per-user token.
func CreateUpstreamToken(username string, userId int) (token, tokenId string, err error) {
	if !upstreamConfigured() {
		return "", "", fmt.Errorf("upstream is not configured")
	}

	reqBody := map[string]interface{}{
		"username": username,
		"user_id":  userId,
	}
	bodyBytes, err := common.Marshal(reqBody)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal request: %w", err)
	}

	url := strings.TrimRight(vibeapi_setting.UpstreamURL, "/") + "/api/user-tokens"
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-admin-token", vibeapi_setting.UpstreamAPIKey)

	client := GetHttpClient()
	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("upstream request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", "", fmt.Errorf("upstream returned status %d", resp.StatusCode)
	}

	var result upstreamTokenResponse
	err = common.DecodeJson(resp.Body, &result)
	if err != nil {
		return "", "", fmt.Errorf("failed to decode response: %w", err)
	}

	return result.Token, result.Id, nil
}

// DeleteUpstreamToken calls the antigravity-manager API to delete a user token.
func DeleteUpstreamToken(tokenId string) error {
	if !upstreamConfigured() {
		return fmt.Errorf("upstream is not configured")
	}

	url := strings.TrimRight(vibeapi_setting.UpstreamURL, "/") + "/api/user-tokens/" + tokenId
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("x-admin-token", vibeapi_setting.UpstreamAPIKey)

	client := GetHttpClient()
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("upstream request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("upstream returned status %d", resp.StatusCode)
	}

	return nil
}

// ProvisionUpstreamTokenForUser creates an upstream token and saves it to the user's settings.
// Safe to call from goroutines — logs errors instead of returning them.
func ProvisionUpstreamTokenForUser(userId int, username string) {
	if !upstreamConfigured() {
		return
	}

	token, tokenId, err := CreateUpstreamToken(username, userId)
	if err != nil {
		common.SysError(fmt.Sprintf("failed to provision upstream token for user %d (%s): %s", userId, username, err.Error()))
		return
	}

	err = SaveUpstreamTokenToUser(userId, token, tokenId)
	if err != nil {
		common.SysError(fmt.Sprintf("failed to save upstream token for user %d: %s", userId, err.Error()))
	}
}

// GetOrProvisionUpstreamToken returns the user's existing upstream token, or creates one synchronously.
func GetOrProvisionUpstreamToken(userId int, username string) (string, error) {
	if !upstreamConfigured() {
		return "", nil
	}

	user, err := model.GetUserById(userId, false)
	if err != nil {
		return "", fmt.Errorf("failed to get user: %w", err)
	}
	setting := user.GetSetting()
	if setting.UpstreamToken != "" {
		return setting.UpstreamToken, nil
	}

	token, tokenId, err := CreateUpstreamToken(username, userId)
	if err != nil {
		return "", fmt.Errorf("failed to create upstream token: %w", err)
	}

	err = SaveUpstreamTokenToUser(userId, token, tokenId)
	if err != nil {
		// Still return the token even if save failed — it'll be retried next request
		common.SysError(fmt.Sprintf("failed to save upstream token for user %d: %s", userId, err.Error()))
	}

	return token, nil
}

// SaveUpstreamTokenToUser persists the upstream token into the user's Setting JSON.
func SaveUpstreamTokenToUser(userId int, token, tokenId string) error {
	user, err := model.GetUserById(userId, false)
	if err != nil {
		return err
	}
	setting := user.GetSetting()
	setting.UpstreamToken = token
	setting.UpstreamTokenId = tokenId
	user.SetSetting(setting)
	return model.UpdateUserSettingField(userId, user.Setting)
}

// ProvisionAllUsersAsync starts batch provisioning of upstream tokens for all users
// that don't have one yet. Runs in the background.
func ProvisionAllUsersAsync() {
	gopool.Go(func() {
		maxId := model.GetMaxUserId()
		provisioned := 0
		failed := 0
		for id := 1; id <= maxId; id++ {
			user, err := model.GetUserById(id, false)
			if err != nil {
				continue
			}
			setting := user.GetSetting()
			if setting.UpstreamToken != "" {
				continue
			}
			_, err = GetOrProvisionUpstreamToken(user.Id, user.Username)
			if err != nil {
				failed++
				common.SysError(fmt.Sprintf("batch provision: failed for user %d: %s", user.Id, err.Error()))
				continue
			}
			provisioned++
		}
		common.SysLog(fmt.Sprintf("batch upstream token provisioning complete: %d provisioned, %d failed", provisioned, failed))
	})
}

func init() {
	model.OnUserCreated = ProvisionUpstreamTokenForUser
}
