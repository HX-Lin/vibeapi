package model

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

// ErrSubscriptionRedeemFailed is returned when subscription redemption fails due to database error
var ErrSubscriptionRedeemFailed = errors.New("subscription_redeem.failed")

type SubscriptionRedemption struct {
	Id           int            `json:"id"`
	UserId       int            `json:"user_id"`
	Key          string         `json:"key" gorm:"type:char(32);uniqueIndex"`
	Status       int            `json:"status" gorm:"default:1"`
	Name         string         `json:"name" gorm:"index"`
	PlanId       int            `json:"plan_id" gorm:"index"`
	CreatedTime  int64          `json:"created_time" gorm:"bigint"`
	RedeemedTime int64          `json:"redeemed_time" gorm:"bigint"`
	Count        int            `json:"count" gorm:"-:all"` // only for api request
	UsedUserId   int            `json:"used_user_id"`
	DeletedAt    gorm.DeletedAt `gorm:"index"`
	ExpiredTime  int64          `json:"expired_time" gorm:"bigint"`
}

func GetAllSubscriptionRedemptions(startIdx int, num int) (redemptions []*SubscriptionRedemption, total int64, err error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return nil, 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	err = tx.Model(&SubscriptionRedemption{}).Count(&total).Error
	if err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	err = tx.Order("id desc").Limit(num).Offset(startIdx).Find(&redemptions).Error
	if err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = tx.Commit().Error; err != nil {
		return nil, 0, err
	}

	return redemptions, total, nil
}

func SearchSubscriptionRedemptions(keyword string, startIdx int, num int) (redemptions []*SubscriptionRedemption, total int64, err error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return nil, 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	query := tx.Model(&SubscriptionRedemption{})

	if id, err := strconv.Atoi(keyword); err == nil {
		query = query.Where("id = ? OR name LIKE ?", id, keyword+"%")
	} else {
		query = query.Where("name LIKE ?", keyword+"%")
	}

	err = query.Count(&total).Error
	if err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	err = query.Order("id desc").Limit(num).Offset(startIdx).Find(&redemptions).Error
	if err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = tx.Commit().Error; err != nil {
		return nil, 0, err
	}

	return redemptions, total, nil
}

func GetSubscriptionRedemptionById(id int) (*SubscriptionRedemption, error) {
	if id == 0 {
		return nil, errors.New("id 为空！")
	}
	redemption := SubscriptionRedemption{Id: id}
	err := DB.First(&redemption, "id = ?", id).Error
	return &redemption, err
}

func RedeemSubscription(key string, userId int) (planTitle string, err error) {
	if key == "" {
		return "", errors.New("未提供订阅兑换码")
	}
	if userId == 0 {
		return "", errors.New("无效的 user id")
	}
	redemption := &SubscriptionRedemption{}

	keyCol := "`key`"
	if common.UsingPostgreSQL {
		keyCol = `"key"`
	}
	common.RandomSleep()

	var logPlanTitle string
	err = DB.Transaction(func(tx *gorm.DB) error {
		err := tx.Set("gorm:query_option", "FOR UPDATE").Where(keyCol+" = ?", key).First(redemption).Error
		if err != nil {
			return errors.New("无效的订阅兑换码")
		}
		if redemption.Status != common.RedemptionCodeStatusEnabled {
			return errors.New("该订阅兑换码已被使用")
		}
		if redemption.ExpiredTime != 0 && redemption.ExpiredTime < common.GetTimestamp() {
			return errors.New("该订阅兑换码已过期")
		}

		plan, err := getSubscriptionPlanByIdTx(tx, redemption.PlanId)
		if err != nil {
			return errors.New("关联的订阅套餐不存在")
		}
		if !plan.Enabled {
			return errors.New("关联的订阅套餐已禁用")
		}
		logPlanTitle = plan.Title

		_, err = CreateUserSubscriptionFromPlanTx(tx, userId, plan, "redemption")
		if err != nil {
			return err
		}

		redemption.RedeemedTime = common.GetTimestamp()
		redemption.Status = common.RedemptionCodeStatusUsed
		redemption.UsedUserId = userId
		return tx.Save(redemption).Error
	})
	if err != nil {
		if !errors.Is(err, ErrSubscriptionRedeemFailed) {
			common.SysError("subscription redemption failed: " + err.Error())
		}
		return "", err
	}

	if strings.TrimSpace(logPlanTitle) != "" {
		RecordLog(userId, LogTypeTopup, fmt.Sprintf("通过订阅兑换码兑换订阅套餐「%s」，兑换码ID %d", logPlanTitle, redemption.Id))
	}

	// Update user group cache if plan has upgrade_group
	plan, _ := GetSubscriptionPlanById(redemption.PlanId)
	if plan != nil && strings.TrimSpace(plan.UpgradeGroup) != "" {
		_ = UpdateUserGroupCache(userId, plan.UpgradeGroup)
	}

	return logPlanTitle, nil
}

func (r *SubscriptionRedemption) Insert() error {
	return DB.Create(r).Error
}

func (r *SubscriptionRedemption) Update() error {
	return DB.Model(r).Select("name", "status", "plan_id", "redeemed_time", "expired_time").Updates(r).Error
}

func (r *SubscriptionRedemption) Delete() error {
	return DB.Delete(r).Error
}

func DeleteSubscriptionRedemptionById(id int) error {
	if id == 0 {
		return errors.New("id 为空！")
	}
	redemption := SubscriptionRedemption{Id: id}
	err := DB.Where(redemption).First(&redemption).Error
	if err != nil {
		return err
	}
	return redemption.Delete()
}

func DeleteInvalidSubscriptionRedemptions() (int64, error) {
	now := common.GetTimestamp()
	result := DB.Where("status IN ? OR (status = ? AND expired_time != 0 AND expired_time < ?)",
		[]int{common.RedemptionCodeStatusUsed, common.RedemptionCodeStatusDisabled},
		common.RedemptionCodeStatusEnabled, now).Delete(&SubscriptionRedemption{})
	return result.RowsAffected, result.Error
}
