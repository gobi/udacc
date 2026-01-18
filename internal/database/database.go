package database

import (
	"log"

	"github.com/udacc/uda-cycling-club/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) (*gorm.DB, error) {
	var logLevel logger.LogLevel
	if cfg.Env == "development" {
		logLevel = logger.Info
	} else {
		logLevel = logger.Silent
	}

	db, err := gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, err
	}

	DB = db
	log.Println("Database connected successfully")
	return db, nil
}

func Migrate(db *gorm.DB, models ...interface{}) error {
	return db.AutoMigrate(models...)
}
