package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"court-service/internal/models"
)

type ComplexHandler struct {
	db *gorm.DB
}

func NewComplexHandler(db *gorm.DB) *ComplexHandler {
	return &ComplexHandler{db: db}
}

// List handles GET /complexes
func (h *ComplexHandler) List(w http.ResponseWriter, r *http.Request) {
	var complexes []models.SportComplex
	if err := h.db.Preload("Courts").Preload("Schedules").Find(&complexes).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list complexes")
		return
	}
	writeJSON(w, http.StatusOK, complexes)
}

// Get handles GET /complexes/{id}
func (h *ComplexHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var complex models.SportComplex
	if err := h.db.Preload("Courts").Preload("Schedules").First(&complex, id).Error; err != nil {
		writeError(w, http.StatusNotFound, "complex not found")
		return
	}
	writeJSON(w, http.StatusOK, complex)
}

// Create handles POST /complexes
func (h *ComplexHandler) Create(w http.ResponseWriter, r *http.Request) {
	var complex models.SportComplex
	if err := json.NewDecoder(r.Body).Decode(&complex); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.db.Create(&complex).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create complex")
		return
	}

	writeJSON(w, http.StatusCreated, complex)
}

// UpsertSchedule handles PUT /complexes/{id}/schedule
func (h *ComplexHandler) UpsertSchedule(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var complex models.SportComplex
	if err := h.db.First(&complex, id).Error; err != nil {
		writeError(w, http.StatusNotFound, "complex not found")
		return
	}

	var schedules []models.OpeningSchedule
	if err := json.NewDecoder(r.Body).Decode(&schedules); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("sport_complex_id = ?", complex.ID).Delete(&models.OpeningSchedule{}).Error; err != nil {
			return err
		}
		for i := range schedules {
			schedules[i].ID = 0
			schedules[i].SportComplexID = complex.ID
		}
		if len(schedules) > 0 {
			return tx.Create(&schedules).Error
		}
		return nil
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update schedule")
		return
	}

	writeJSON(w, http.StatusOK, schedules)
}
