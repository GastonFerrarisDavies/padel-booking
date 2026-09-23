package main

import (
	"log"
	"net/http"

	"court-service/internal/config"
	"court-service/internal/db"
	"court-service/internal/router"
)

func main() {
	cfg := config.Load()

	conn := db.Connect(cfg)
	handler := router.New(conn)

	log.Printf("court-service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, handler); err != nil {
		log.Fatalf("court-service: server error: %v", err)
	}
}
