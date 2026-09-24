package handlers

import (
	"math"
	"net/http"
	"time"
)

// statsWindowDays is the KPI period; revenueByDay spans two windows so the
// chart shows the current and the previous period.
const statsWindowDays = 7

type dayRevenue struct {
	Date  string  `json:"date"`
	Value float64 `json:"value"`
}

type statsResponse struct {
	Revenue       float64      `json:"revenue"`
	RevenueDelta  float64      `json:"revenueDelta"`
	Bookings      int          `json:"bookings"`
	BookingsDelta float64      `json:"bookingsDelta"`
	RevenueByDay  []dayRevenue `json:"revenueByDay"`
}

// Stats handles GET /bookings/stats?date=YYYY-MM-DD. `date` is the client's
// "today" and the last day of the window: revenue and bookings cover the 7
// days up to it, deltas (%) compare against the 7 days before, and
// revenueByDay lists all 14 days. Cancelled bookings are excluded.
func (h *BookingHandler) Stats(w http.ResponseWriter, r *http.Request) {
	end, err := time.Parse("2006-01-02", r.URL.Query().Get("date"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid or missing date (expected YYYY-MM-DD)")
		return
	}
	start := end.AddDate(0, 0, -(2*statsWindowDays - 1))

	totals, err := h.repo.DailyTotals(r.Context(), start.Format("2006-01-02"), end.Format("2006-01-02"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to compute booking stats")
		return
	}

	resp := statsResponse{RevenueByDay: make([]dayRevenue, 0, 2*statsWindowDays)}
	var prevRevenue float64
	var prevBookings int
	for i := 0; i < 2*statsWindowDays; i++ {
		day := start.AddDate(0, 0, i).Format("2006-01-02")
		t := totals[day]
		resp.RevenueByDay = append(resp.RevenueByDay, dayRevenue{Date: day, Value: t.Revenue})
		if i < statsWindowDays {
			prevRevenue += t.Revenue
			prevBookings += t.Bookings
		} else {
			resp.Revenue += t.Revenue
			resp.Bookings += t.Bookings
		}
	}
	resp.Revenue = math.Round(resp.Revenue*100) / 100
	resp.RevenueDelta = percentDelta(resp.Revenue, prevRevenue)
	resp.BookingsDelta = percentDelta(float64(resp.Bookings), float64(prevBookings))

	writeJSON(w, http.StatusOK, resp)
}

// percentDelta is the % change from previous to current, rounded to one
// decimal. Without a baseline (previous == 0) there is no meaningful change: 0.
func percentDelta(current, previous float64) float64 {
	if previous == 0 {
		return 0
	}
	return math.Round((current-previous)/previous*1000) / 10
}
