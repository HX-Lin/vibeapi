package model

import (
	"errors"
	"fmt"

	"github.com/QuantumNous/new-api/common"
)

// UserQuotaRank 用户用量排行
type UserQuotaRank struct {
	UserId   int    `json:"user_id"`
	Username string `json:"username"`
	Quota    int64  `json:"quota"`
	Count    int64  `json:"count"`
}

// ModelQuotaStat 模型用量占比
type ModelQuotaStat struct {
	ModelName string `json:"model_name"`
	Quota     int64  `json:"quota"`
	Count     int64  `json:"count"`
}

// TokenQuotaStat 令牌用量占比
type TokenQuotaStat struct {
	TokenName string `json:"token_name"`
	Quota     int64  `json:"quota"`
	Count     int64  `json:"count"`
}

// GroupQuotaStat 分组用量占比
type GroupQuotaStat struct {
	Group string `json:"group"`
	Quota int64  `json:"quota"`
	Count int64  `json:"count"`
}

// DailyQuotaStat 每日用量分布
type DailyQuotaStat struct {
	Day   string `json:"day"`
	Quota int64  `json:"quota"`
	Count int64  `json:"count"`
}

// GetUserQuotaRank 获取用户用量排行（按时间段）
func GetUserQuotaRank(startTimestamp, endTimestamp int64, limit int) ([]UserQuotaRank, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	var results []UserQuotaRank
	tx := LOG_DB.Table("logs").
		Select("user_id, username, sum(quota) as quota, count(*) as count").
		Where("type = ?", LogTypeConsume)
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	err := tx.Group("user_id, username").Order("quota desc").Limit(limit).Find(&results).Error
	if err != nil {
		common.SysError("failed to get user quota rank: " + err.Error())
		return nil, errors.New("查询用户用量排行失败")
	}
	return results, nil
}

// GetModelQuotaStat 获取模型用量占比（按时间段）
func GetModelQuotaStat(startTimestamp, endTimestamp int64) ([]ModelQuotaStat, error) {
	var results []ModelQuotaStat
	tx := LOG_DB.Table("logs").
		Select("model_name, sum(quota) as quota, count(*) as count").
		Where("type = ?", LogTypeConsume)
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	err := tx.Group("model_name").Order("quota desc").Find(&results).Error
	if err != nil {
		common.SysError("failed to get model quota stat: " + err.Error())
		return nil, errors.New("查询模型用量占比失败")
	}
	return results, nil
}

// GetTokenQuotaStat 获取令牌用量占比（按时间段）
func GetTokenQuotaStat(startTimestamp, endTimestamp int64) ([]TokenQuotaStat, error) {
	var results []TokenQuotaStat
	tx := LOG_DB.Table("logs").
		Select("token_name, sum(quota) as quota, count(*) as count").
		Where("type = ?", LogTypeConsume)
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	err := tx.Group("token_name").Order("quota desc").Find(&results).Error
	if err != nil {
		common.SysError("failed to get token quota stat: " + err.Error())
		return nil, errors.New("查询令牌用量占比失败")
	}
	return results, nil
}

// GetGroupQuotaStat 获取分组用量占比（按时间段）
func GetGroupQuotaStat(startTimestamp, endTimestamp int64) ([]GroupQuotaStat, error) {
	var results []GroupQuotaStat
	tx := LOG_DB.Table("logs").
		Select(fmt.Sprintf("%s, sum(quota) as quota, count(*) as count", logGroupCol)).
		Where("type = ?", LogTypeConsume)
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	err := tx.Group(logGroupCol).Order("quota desc").Find(&results).Error
	if err != nil {
		common.SysError("failed to get group quota stat: " + err.Error())
		return nil, errors.New("查询分组用量占比失败")
	}
	return results, nil
}

// GetDailyQuotaStat 获取每日用量分布（按时间段）
func GetDailyQuotaStat(startTimestamp, endTimestamp int64) ([]DailyQuotaStat, error) {
	var results []DailyQuotaStat

	// 按天分组：created_at / 86400 得到天数
	var dayExpr string
	if common.UsingPostgreSQL {
		dayExpr = "to_char(to_timestamp(created_at), 'YYYY-MM-DD')"
	} else {
		// MySQL and SQLite
		dayExpr = "date(created_at, 'unixepoch')"
		if common.UsingMySQL {
			dayExpr = "date(from_unixtime(created_at))"
		}
	}

	tx := LOG_DB.Table("logs").
		Select(fmt.Sprintf("%s as day, sum(quota) as quota, count(*) as count", dayExpr)).
		Where("type = ?", LogTypeConsume)
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	err := tx.Group("day").Order("day asc").Find(&results).Error
	if err != nil {
		common.SysError("failed to get daily quota stat: " + err.Error())
		return nil, errors.New("查询每日用量分布失败")
	}
	return results, nil
}
