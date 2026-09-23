package main

import (
	"log"
	"net/http"

	"booking-service/internal/config"
	"booking-service/internal/db"
	"booking-service/internal/router"
)

func main() {
	cfg := config.Load()

	conn := db.Connect(cfg)
	defer conn.Close()

	handler := router.New(conn)

	log.Printf("booking-service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, handler); err != nil {
		log.Fatalf("booking-service: server error: %v", err)
	}
}
