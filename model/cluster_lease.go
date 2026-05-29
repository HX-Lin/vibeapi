package model

import (
	"time"

	"gorm.io/gorm/clause"
)

type ClusterLease struct {
	Name      string `gorm:"primaryKey;size:64" json:"name"`
	Owner     string `gorm:"size:255;index" json:"owner"`
	ExpiresAt int64  `gorm:"index" json:"expires_at"`
	UpdatedAt int64  `json:"updated_at"`
}

func EnsureClusterLease(name string) error {
	now := time.Now().Unix()
	lease := ClusterLease{
		Name:      name,
		Owner:     "",
		ExpiresAt: 0,
		UpdatedAt: now,
	}
	return DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&lease).Error
}

func AcquireClusterLease(name string, owner string, ttl time.Duration) (bool, error) {
	if err := EnsureClusterLease(name); err != nil {
		return false, err
	}
	now := time.Now().Unix()
	expiresAt := now + int64(ttl/time.Second)
	res := DB.Model(&ClusterLease{}).
		Where("name = ? AND (owner = ? OR expires_at < ?)", name, owner, now).
		Updates(map[string]any{
			"owner":      owner,
			"expires_at": expiresAt,
			"updated_at": now,
		})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func ReleaseClusterLease(name string, owner string) error {
	now := time.Now().Unix()
	return DB.Model(&ClusterLease{}).
		Where("name = ? AND owner = ?", name, owner).
		Updates(map[string]any{
			"owner":      "",
			"expires_at": int64(0),
			"updated_at": now,
		}).Error
}
