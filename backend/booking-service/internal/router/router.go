package router

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"booking-service/internal/auth"
	"booking-service/internal/handlers"
	"booking-service/internal/repository"
)

// New wires the routes. GETs are public; creating a booking requires the
// player's name and surname; changing its status requires an OWNER/ADMIN token.
func New(db *sql.DB, jwtSecret string) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health-check", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	bookingRepo := repository.NewBookingRepository(db)
	bookingHandler := handlers.NewBookingHandler(bookingRepo)
	adminOnly := auth.RequireRole([]byte(jwtSecret), "OWNER", "ADMIN")

	r.Route("/bookings", func(r chi.Router) {
		r.Get("/", bookingHandler.List)
		r.Get("/stats", bookingHandler.Stats)

		r.With(auth.RequirePlayer).Post("/", bookingHandler.Create)
		r.With(adminOnly).Patch("/{id}", bookingHandler.UpdateStatus)
	})

	return r
}
