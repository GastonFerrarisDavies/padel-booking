package db

import (
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"court-service/internal/config"
	"court-service/internal/models"
)

// Connect opens a MySQL connection pool and auto-migrates this service's
// own schema. Each microservice owns and migrates only its own database.
func Connect(cfg config.Config) *gorm.DB {
	var (
		db  *gorm.DB
		err error
	)

	for attempt := 1; attempt <= 10; attempt++ {
		db, err = gorm.Open(mysql.Open(cfg.DSN()), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		})
		if err == nil {
			break
		}
		log.Printf("court-service: waiting for database (attempt %d/10): %v", attempt, err)
		time.Sleep(3 * time.Second)
	}

	if err != nil {
		log.Fatalf("court-service: could not connect to database: %v", err)
	}

	if err := db.AutoMigrate(
		&models.SportComplex{},
		&models.Court{},
		&models.OpeningSchedule{},
	); err != nil {
		log.Fatalf("court-service: auto-migration failed: %v", err)
	}

	return db
}
