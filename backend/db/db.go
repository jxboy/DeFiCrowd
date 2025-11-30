package db

import (
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"log"
)

var DB *gorm.DB

func InitDB() {
	dsn := "root:123456@tcp(127.0.0.1:3306)/deficrowd?charset=utf8mb4&parseTime=True&loc=Local"
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{SkipDefaultTransaction: true, PrepareStmt: true})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 创建表
	err = DB.AutoMigrate(&StakingEvent{}, &UserStake{})
	if err != nil {
		log.Fatal("AutoMigrate failed:", err)
	}

	log.Println("Database initialized successfully.")
}
