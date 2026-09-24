package handlers

import (
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"court-service/internal/bookings"
	"court-service/internal/models"
)

const (
	defaultDurationMin = 90
	maxDurationMin     = 240
	// Slots start every slotStepMin minutes (08:00, 08:30, 09:00...).
	slotStepMin = 30
)

// Slot matches the frontend's `Slot` typedef (entity/court.js).
type Slot struct {
	Start string  `json:"start"` // "HH:MM"
	End   string  `json:"end"`
	Price float64 `json:"price"`
}

type availableCourt struct {
	models.Court
	AvailableSlots []Slot `json:"availableSlots"`
}

type AvailabilityHandler struct {
	db       *gorm.DB
	bookings *bookings.Client
}

func NewAvailabilityHandler(db *gorm.DB, bookingsClient *bookings.Client) *AvailabilityHandler {
	return &AvailabilityHandler{db: db, bookings: bookingsClient}
}

// Availability handles GET /courts/availability?date=&time=&duration=&surface=
//   - date (required, YYYY-MM-DD): the complex's opening hours for that weekday bound the slots.
//   - duration (minutes, default 90): length of each slot; price is prorated from pricePerHour.
//   - time (optional, HH:MM): only slots starting at or after this time.
//   - surface (optional).
//
// Slots overlapping a non-cancelled booking are discarded. Courts with no
// free slot are omitted, so every returned court has availableSlots[0].
func (h *AvailabilityHandler) Availability(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	date, err := time.Parse("2006-01-02", q.Get("date"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid or missing date (expected YYYY-MM-DD)")
		return
	}

	duration := defaultDurationMin
	if raw := q.Get("duration"); raw != "" {
		duration, err = strconv.Atoi(raw)
		if err != nil || duration <= 0 || duration > maxDurationMin || duration%slotStepMin != 0 {
			writeError(w, http.StatusBadRequest,
				fmt.Sprintf("duration must be a multiple of %d between %d and %d minutes", slotStepMin, slotStepMin, maxDurationMin))
			return
		}
	}

	from := 0
	if raw := q.Get("time"); raw != "" {
		if from, err = parseClock(raw); err != nil {
			writeError(w, http.StatusBadRequest, "invalid time (expected HH:MM)")
			return
		}
	}

	query := h.db.Model(&models.Court{}).Where("status = ?", models.CourtStatusAvailable)
	if surface := q.Get("surface"); surface != "" {
		query = query.Where("surface = ?", surface)
	}
	var courts []models.Court
	if err := query.Find(&courts).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list courts")
		return
	}

	schedules, err := h.schedulesByComplex(courts, int(date.Weekday()))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load opening schedules")
		return
	}

	// Fail open: if booking-service is down we still show slots; its 409 on
	// POST /bookings keeps double bookings impossible.
	booked, err := h.bookings.ActiveByCourt(r.Context(), date.Format("2006-01-02"))
	if err != nil {
		log.Printf("court-service: availability without booking data: %v", err)
	}

	result := make([]availableCourt, 0, len(courts))
	for _, court := range courts {
		schedule, ok := schedules[court.SportComplexID]
		if !ok {
			continue // complex closed (no opening hours) that weekday
		}
		slots := buildSlots(schedule, court.PricePerHour, duration, from, booked[strconv.FormatUint(uint64(court.ID), 10)])
		if len(slots) == 0 {
			continue
		}
		result = append(result, availableCourt{Court: court, AvailableSlots: slots})
	}

	writeJSON(w, http.StatusOK, result)
}

func (h *AvailabilityHandler) schedulesByComplex(courts []models.Court, weekday int) (map[uint]models.OpeningSchedule, error) {
	byComplex := make(map[uint]models.OpeningSchedule)
	if len(courts) == 0 {
		return byComplex, nil
	}

	ids := make([]uint, 0, len(courts))
	for _, c := range courts {
		ids = append(ids, c.SportComplexID)
	}

	var schedules []models.OpeningSchedule
	if err := h.db.Where("sport_complex_id IN ? AND weekday = ?", ids, weekday).Find(&schedules).Error; err != nil {
		return nil, err
	}
	for _, s := range schedules {
		byComplex[s.SportComplexID] = s
	}
	return byComplex, nil
}

// buildSlots lists every [start, start+duration) inside opening hours, starting
// at or after `from`, that does not overlap an existing booking.
func buildSlots(schedule models.OpeningSchedule, pricePerHour float64, duration, from int, booked []bookings.Booking) []Slot {
	open, errOpen := parseClock(schedule.OpenTime)
	closeAt, errClose := parseClock(schedule.CloseTime)
	if errOpen != nil || errClose != nil {
		log.Printf("court-service: invalid schedule %d (%q-%q)", schedule.ID, schedule.OpenTime, schedule.CloseTime)
		return nil
	}

	type interval struct{ start, end int }
	busy := make([]interval, 0, len(booked))
	for _, b := range booked {
		s, errS := parseClock(b.StartTime)
		e, errE := parseClock(b.EndTime)
		if errS == nil && errE == nil {
			busy = append(busy, interval{s, e})
		}
	}

	price := math.Round(pricePerHour*float64(duration)/60*100) / 100

	// First slot aligned to the step grid, never before opening time.
	start := open
	if from > start {
		start = open + ((from-open+slotStepMin-1)/slotStepMin)*slotStepMin
	}

	slots := []Slot{}
	for ; start+duration <= closeAt; start += slotStepMin {
		end := start + duration
		free := true
		for _, b := range busy {
			if start < b.end && b.start < end {
				free = false
				break
			}
		}
		if free {
			slots = append(slots, Slot{Start: formatClock(start), End: formatClock(end), Price: price})
		}
	}
	return slots
}

// parseClock converts "HH:MM" or "HH:MM:SS" into minutes since midnight.
func parseClock(value string) (int, error) {
	parts := strings.Split(value, ":")
	if len(parts) < 2 || len(parts) > 3 {
		return 0, fmt.Errorf("invalid clock %q", value)
	}
	hours, errH := strconv.Atoi(parts[0])
	minutes, errM := strconv.Atoi(parts[1])
	if errH != nil || errM != nil || hours < 0 || hours > 24 || minutes < 0 || minutes > 59 || (hours == 24 && minutes != 0) {
		return 0, fmt.Errorf("invalid clock %q", value)
	}
	return hours*60 + minutes, nil
}

func formatClock(minutes int) string {
	return fmt.Sprintf("%02d:%02d", minutes/60, minutes%60)
}
