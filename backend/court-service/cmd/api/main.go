package main

import (
	"log"
	"net/http"

	"court-service/internal/bookings"
	"court-service/internal/config"
	"court-service/internal/db"
	"court-service/internal/router"
)

func main() {
	cfg := config.Load()

	conn := db.Connect(cfg)
	if cfg.JWTSecret == "" {
		log.Print("court-service: JWT_SECRET not set, protected routes will reject every request")
	}
	handler := router.New(conn, bookings.NewClient(cfg.BookingServiceURL), cfg.JWTSecret)

	log.Printf("court-service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, handler); err != nil {
		log.Fatalf("court-service: server error: %v", err)
	}
}
