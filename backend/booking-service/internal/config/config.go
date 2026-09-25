package config

import (
	"fmt"
	"os"
)

// Config holds runtime configuration sourced strictly from environment
// variables, as injected by the Kubernetes Deployment.
type Config struct {
	Port       string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	// JWTSecret verifies tokens issued by user-service. Empty => protected routes always 401.
	JWTSecret string
}

func Load() Config {
	return Config{
		Port:       getEnv("PORT", "8081"),
		DBHost:     getEnv("DB_HOST", "127.0.0.1"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "booking_service_db"),
		JWTSecret:  getEnv("JWT_SECRET", ""),
	}
}

// DSN builds a go-sql-driver/mysql data source name from the loaded config.
func (c Config) DSN() string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName,
	)
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}
