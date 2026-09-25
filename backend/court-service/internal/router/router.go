package router

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"

	"court-service/internal/auth"
	"court-service/internal/bookings"
	"court-service/internal/handlers"
)

// New wires the routes. GETs are public; every write requires an OWNER/ADMIN token.
func New(db *gorm.DB, bookingsClient *bookings.Client, jwtSecret string) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health-check", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	courtHandler := handlers.NewCourtHandler(db)
	complexHandler := handlers.NewComplexHandler(db)
	availabilityHandler := handlers.NewAvailabilityHandler(db, bookingsClient)
	adminOnly := auth.RequireRole([]byte(jwtSecret), "OWNER", "ADMIN")

	r.Route("/courts", func(r chi.Router) {
		r.Get("/", courtHandler.List)
		r.Get("/availability", availabilityHandler.Availability)
		r.Get("/occupancy", availabilityHandler.Occupancy)
		r.Get("/{id}", courtHandler.Get)

		r.With(adminOnly).Post("/", courtHandler.Create)
		r.With(adminOnly).Put("/{id}", courtHandler.Update)
		r.With(adminOnly).Delete("/{id}", courtHandler.Delete)
	})

	r.Route("/complexes", func(r chi.Router) {
		r.Get("/", complexHandler.List)
		r.Get("/{id}", complexHandler.Get)

		r.With(adminOnly).Post("/", complexHandler.Create)
		r.With(adminOnly).Put("/{id}/schedule", complexHandler.UpsertSchedule)
	})

	return r
}
