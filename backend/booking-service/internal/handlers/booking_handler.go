package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"booking-service/internal/auth"
	"booking-service/internal/models"
	"booking-service/internal/repository"
)

type BookingHandler struct {
	repo *repository.BookingRepository
}

func NewBookingHandler(repo *repository.BookingRepository) *BookingHandler {
	return &BookingHandler{repo: repo}
}

// List handles GET /bookings?date=&courtId=
func (h *BookingHandler) List(w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	courtID := r.URL.Query().Get("courtId")

	bookings, err := h.repo.List(r.Context(), date, courtID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list bookings")
		return
	}

	writeJSON(w, http.StatusOK, bookings)
}

type createBookingRequest struct {
	CourtID    string  `json:"courtId"`
	CourtName  string  `json:"courtName"`
	PlayerName string  `json:"playerName"`
	Date       string  `json:"date"`
	StartTime  string  `json:"startTime"`
	EndTime    string  `json:"endTime"`
	Price      float64 `json:"price"`
}

// Create handles POST /bookings. It rejects the request with 409 Conflict
// if the requested slot overlaps an existing PENDING/CONFIRMED booking.
func (h *BookingHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.CourtID == "" || req.Date == "" || req.StartTime == "" || req.EndTime == "" {
		writeError(w, http.StatusBadRequest, "courtId, date, startTime and endTime are required")
		return
	}
	if req.StartTime >= req.EndTime {
		writeError(w, http.StatusBadRequest, "startTime must be before endTime")
		return
	}

	// Set by auth.RequirePlayer; fall back to the raw field if the route is not guarded.
	playerName := req.PlayerName
	if player, ok := auth.PlayerFromContext(r.Context()); ok {
		playerName = player.FullName()
	}

	booking := models.Booking{
		ID:         uuid.NewString(),
		CourtID:    req.CourtID,
		CourtName:  req.CourtName,
		PlayerName: playerName,
		Date:       req.Date,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
		Status:     models.StatusPending,
		Price:      req.Price,
	}

	created, err := h.repo.Create(r.Context(), booking)
	if errors.Is(err, repository.ErrOverlappingBooking) {
		writeError(w, http.StatusConflict, err.Error())
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create booking")
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

type updateStatusRequest struct {
	Status models.BookingStatus `json:"status"`
}

// UpdateStatus handles PATCH /bookings/{id}
func (h *BookingHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req updateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	switch req.Status {
	case models.StatusPending, models.StatusConfirmed, models.StatusCancelled:
	default:
		writeError(w, http.StatusBadRequest, "status must be PENDING, CONFIRMED or CANCELLED")
		return
	}

	updated, err := h.repo.UpdateStatus(r.Context(), id, req.Status)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "booking not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update booking")
		return
	}

	writeJSON(w, http.StatusOK, updated)
}
