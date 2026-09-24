package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"court-service/internal/models"
)

type CourtHandler struct {
	db *gorm.DB
}

func NewCourtHandler(db *gorm.DB) *CourtHandler {
	return &CourtHandler{db: db}
}

// List handles GET /courts?status=&surface=&sportComplexId=
func (h *CourtHandler) List(w http.ResponseWriter, r *http.Request) {
	query := h.db.Model(&models.Court{})

	if status := r.URL.Query().Get("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if surface := r.URL.Query().Get("surface"); surface != "" {
		query = query.Where("surface = ?", surface)
	}
	if complexID := r.URL.Query().Get("sportComplexId"); complexID != "" {
		query = query.Where("sport_complex_id = ?", complexID)
	}

	var courts []models.Court
	if err := query.Find(&courts).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list courts")
		return
	}

	writeJSON(w, http.StatusOK, courts)
}

// Get handles GET /courts/{id}
func (h *CourtHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var court models.Court
	if err := h.db.First(&court, id).Error; err != nil {
		writeError(w, http.StatusNotFound, "court not found")
		return
	}

	writeJSON(w, http.StatusOK, court)
}

// Create handles POST /courts
func (h *CourtHandler) Create(w http.ResponseWriter, r *http.Request) {
	var court models.Court
	if err := json.NewDecoder(r.Body).Decode(&court); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if court.Status == "" {
		court.Status = models.CourtStatusAvailable
	}

	if err := h.db.Create(&court).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create court")
		return
	}

	writeJSON(w, http.StatusCreated, court)
}

// Update handles PUT /courts/{id}
func (h *CourtHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var court models.Court
	if err := h.db.First(&court, id).Error; err != nil {
		writeError(w, http.StatusNotFound, "court not found")
		return
	}

	var payload models.Court
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	payload.ID = court.ID

	if err := h.db.Model(&court).Updates(payload).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update court")
		return
	}

	writeJSON(w, http.StatusOK, court)
}

// Delete handles DELETE /courts/{id}
func (h *CourtHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.db.Delete(&models.Court{}, id).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete court")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
