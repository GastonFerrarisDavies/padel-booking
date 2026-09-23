package router

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"

	"court-service/internal/handlers"
)

func New(db *gorm.DB) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	courtHandler := handlers.NewCourtHandler(db)
	complexHandler := handlers.NewComplexHandler(db)

	r.Route("/courts", func(r chi.Router) {
		r.Get("/", courtHandler.List)
		r.Get("/availability", courtHandler.Availability)
		r.Post("/", courtHandler.Create)
		r.Get("/{id}", courtHandler.Get)
		r.Put("/{id}", courtHandler.Update)
		r.Delete("/{id}", courtHandler.Delete)
	})

	r.Route("/complexes", func(r chi.Router) {
		r.Get("/", complexHandler.List)
		r.Post("/", complexHandler.Create)
		r.Get("/{id}", complexHandler.Get)
		r.Put("/{id}/schedule", complexHandler.UpsertSchedule)
	})

	return r
}
