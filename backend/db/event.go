package db

import (
	"time"
)

type StakingEvent struct {
	ID          uint   `gorm:"primaryKey"`
	EventName   string `gorm:"size:64;index"`
	UserAddress string `gorm:"size:64;index"`
	Amount      string `gorm:"size:128"`
	TxHash      string `gorm:"size:128;index"`
	BlockNumber uint64
	Timestamp   time.Time
}

type UserStake struct {
	ID          uint   `gorm:"primaryKey"`
	UserAddress string `gorm:"size:64;index"`
	Balance     string `gorm:"size:128"`
	Earned      string `gorm:"size:128"`
	UpdatedAt   time.Time
}
