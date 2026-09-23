package router

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"booking-service/internal/handlers"
	"booking-service/internal/repository"
)

func New(db *sql.DB) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	bookingRepo := repository.NewBookingRepository(db)
	bookingHandler := handlers.NewBookingHandler(bookingRepo)

	r.Route("/bookings", func(r chi.Router) {
		r.Get("/", bookingHandler.List)
		r.Post("/", bookingHandler.Create)
		r.Patch("/{id}", bookingHandler.UpdateStatus)
	})

	return r
}
