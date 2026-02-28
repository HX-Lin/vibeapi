package controller

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/vibeapi_setting"
	"github.com/gin-gonic/gin"
)

func VibeAPIStatus(c *gin.Context) {
	if !vibeapi_setting.UpstreamEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"enabled":   false,
				"connected": false,
				"message":   "VibeAPI upstream is not enabled",
			},
		})
		return
	}

	if vibeapi_setting.UpstreamURL == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"enabled":   true,
				"connected": false,
				"message":   "Upstream URL is not configured",
			},
		})
		return
	}

	// Health check: try to reach upstream
	client := service.GetHttpClient()
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	healthURL := strings.TrimRight(vibeapi_setting.UpstreamURL, "/") + "/api/v1/proxy/status"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, healthURL, nil)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"enabled":   true,
				"connected": false,
				"message":   "Failed to create health check request",
			},
		})
		common.SysLog("VibeAPI health check request creation failed: " + err.Error())
		return
	}

	if vibeapi_setting.UpstreamAPIKey != "" {
		req.Header.Set("Authorization", "Bearer "+vibeapi_setting.UpstreamAPIKey)
	}

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"enabled":   true,
				"connected": false,
				"message":   "Connection failed",
			},
		})
		common.SysLog("VibeAPI upstream connection failed: " + err.Error())
		return
	}
	defer resp.Body.Close()

	connected := resp.StatusCode >= 200 && resp.StatusCode < 300
	message := "Connected"
	if !connected {
		message = "Upstream returned status " + http.StatusText(resp.StatusCode)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"enabled":      true,
			"connected":    connected,
			"status_code":  resp.StatusCode,
			"upstream_url": vibeapi_setting.UpstreamURL,
			"message":      message,
		},
	})
}

func VibeAPIProxy(c *gin.Context) {
	if !vibeapi_setting.UpstreamEnabled {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false,
			"message": "VibeAPI upstream is not enabled",
		})
		return
	}

	if vibeapi_setting.UpstreamURL == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false,
			"message": "Upstream URL is not configured",
		})
		return
	}

	rawPath := c.Param("path")
	// 路径安全校验：清理路径穿越
	cleanPath := path.Clean(rawPath)
	if !strings.HasPrefix(cleanPath, "/") {
		cleanPath = "/" + cleanPath
	}

	targetURL := strings.TrimRight(vibeapi_setting.UpstreamURL, "/") + "/api/v1" + cleanPath

	// Append query string
	if c.Request.URL.RawQuery != "" {
		targetURL += "?" + c.Request.URL.RawQuery
	}

	client := service.GetHttpClient()
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, c.Request.Method, targetURL, c.Request.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create upstream request",
		})
		common.SysLog("VibeAPI proxy request creation failed: " + err.Error())
		return
	}

	// Copy relevant headers
	if ct := c.GetHeader("Content-Type"); ct != "" {
		req.Header.Set("Content-Type", ct)
	}
	if accept := c.GetHeader("Accept"); accept != "" {
		req.Header.Set("Accept", accept)
	}
	if vibeapi_setting.UpstreamAPIKey != "" {
		req.Header.Set("Authorization", "Bearer "+vibeapi_setting.UpstreamAPIKey)
	}

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"success": false,
			"message": "Upstream request failed",
		})
		common.SysLog("VibeAPI upstream request failed: " + err.Error())
		return
	}
	defer resp.Body.Close()

	// Forward response headers
	for key, values := range resp.Header {
		for _, value := range values {
			c.Writer.Header().Add(key, value)
		}
	}

	c.Writer.WriteHeader(resp.StatusCode)
	io.Copy(c.Writer, resp.Body)
}

// VibeAPIProvisionUser provisions or re-provisions an upstream token for a single user.
func VibeAPIProvisionUser(c *gin.Context) {
	userIdStr := c.Param("userId")
	userId, err := strconv.Atoi(userIdStr)
	if err != nil || userId <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid user ID",
		})
		return
	}

	if !vibeapi_setting.UpstreamEnabled || vibeapi_setting.UpstreamURL == "" || vibeapi_setting.UpstreamAPIKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Upstream is not configured",
		})
		return
	}

	user, err := model.GetUserById(userId, false)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": fmt.Sprintf("User %d not found", userId),
		})
		return
	}

	token, err := service.GetOrProvisionUpstreamToken(user.Id, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to provision token: " + err.Error(),
		})
		common.SysError(fmt.Sprintf("provision upstream token for user %d failed: %s", userId, err.Error()))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Token provisioned successfully",
		"data": gin.H{
			"user_id":  userId,
			"username": user.Username,
			"has_token": token != "",
		},
	})
}

// VibeAPIProvisionAll batch-provisions upstream tokens for all users that don't have one.
func VibeAPIProvisionAll(c *gin.Context) {
	if !vibeapi_setting.UpstreamEnabled || vibeapi_setting.UpstreamURL == "" || vibeapi_setting.UpstreamAPIKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Upstream is not configured",
		})
		return
	}

	service.ProvisionAllUsersAsync()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Batch provisioning started in background",
	})
}

// VibeAPIUserUsage returns all users with their upstream token status and vibeapi billing data.
func VibeAPIUserUsage(c *gin.Context) {
	users, err := model.GetAllUsersBasicInfo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch users: " + err.Error(),
		})
		return
	}

	type userUsageItem struct {
		Id              int    `json:"id"`
		Username        string `json:"username"`
		DisplayName     string `json:"display_name"`
		Email           string `json:"email"`
		Group           string `json:"group"`
		Status          int    `json:"status"`
		Quota           int    `json:"quota"`
		UsedQuota       int    `json:"used_quota"`
		RequestCount    int    `json:"request_count"`
		HasUpstreamToken bool  `json:"has_upstream_token"`
	}

	result := make([]userUsageItem, 0, len(users))
	for _, u := range users {
		setting := u.GetSetting()
		result = append(result, userUsageItem{
			Id:               u.Id,
			Username:         u.Username,
			DisplayName:      u.DisplayName,
			Email:            u.Email,
			Group:            u.Group,
			Status:           u.Status,
			Quota:            u.Quota,
			UsedQuota:        u.UsedQuota,
			RequestCount:     u.RequestCount,
			HasUpstreamToken: setting.UpstreamToken != "",
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}
