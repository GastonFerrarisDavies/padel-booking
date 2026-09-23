package db

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"

	"booking-service/internal/config"
)

const schema = `
CREATE TABLE IF NOT EXISTS bookings (
	id VARCHAR(36) PRIMARY KEY,
	court_id VARCHAR(36) NOT NULL,
	court_name VARCHAR(150) NOT NULL,
	player_name VARCHAR(150) NOT NULL,
	date DATE NOT NULL,
	start_time TIME NOT NULL,
	end_time TIME NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
	price DECIMAL(10,2) NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	INDEX idx_court_date (court_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`

// Connect opens a MySQL connection pool and ensures this service's own
// schema exists. Each microservice owns and migrates only its own database.
func Connect(cfg config.Config) *sql.DB {
	var (
		conn *sql.DB
		err  error
	)

	for attempt := 1; attempt <= 10; attempt++ {
		conn, err = sql.Open("mysql", cfg.DSN())
		if err == nil {
			err = conn.Ping()
		}
		if err == nil {
			break
		}
		log.Printf("booking-service: waiting for database (attempt %d/10): %v", attempt, err)
		time.Sleep(3 * time.Second)
	}

	if err != nil {
		log.Fatalf("booking-service: could not connect to database: %v", err)
	}

	if _, err := conn.Exec(schema); err != nil {
		log.Fatalf("booking-service: schema migration failed: %v", err)
	}

	return conn
}
