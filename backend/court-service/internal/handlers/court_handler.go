package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

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

// Availability handles GET /courts/availability?date=&surface=
// It resolves each matching court's complex opening hours for the
// requested weekday. Overlap against existing bookings is the
// responsibility of booking-service, which owns that data.
func (h *CourtHandler) Availability(w http.ResponseWriter, r *http.Request) {
	dateParam := r.URL.Query().Get("date")
	weekday, err := parseWeekday(dateParam)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid or missing date (expected YYYY-MM-DD)")
		return
	}

	query := h.db.Model(&models.Court{}).Where("status = ?", models.CourtStatusAvailable)
	if surface := r.URL.Query().Get("surface"); surface != "" {
		query = query.Where("surface = ?", surface)
	}

	var courts []models.Court
	if err := query.Find(&courts).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list courts")
		return
	}

	type availableCourt struct {
		models.Court
		OpenTime  string `json:"openTime,omitempty"`
		CloseTime string `json:"closeTime,omitempty"`
	}

	result := make([]availableCourt, 0, len(courts))
	for _, court := range courts {
		var schedule models.OpeningSchedule
		err := h.db.Where("sport_complex_id = ? AND weekday = ?", court.SportComplexID, weekday).
			First(&schedule).Error
		if err != nil {
			continue // no opening hours registered for this weekday
		}
		result = append(result, availableCourt{
			Court:     court,
			OpenTime:  schedule.OpenTime,
			CloseTime: schedule.CloseTime,
		})
	}

	writeJSON(w, http.StatusOK, result)
}

func parseWeekday(date string) (int, error) {
	if date == "" {
		return 0, errors.New("date is required")
	}
	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		return 0, err
	}
	return int(t.Weekday()), nil
}
