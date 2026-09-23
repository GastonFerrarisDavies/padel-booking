package models

// BookingStatus mirrors the values the frontend expects for a Booking.
type BookingStatus string

const (
	StatusPending   BookingStatus = "PENDING"
	StatusConfirmed BookingStatus = "CONFIRMED"
	StatusCancelled BookingStatus = "CANCELLED"
)

// Booking is a reservation of a court owned by court-service. CourtID and
// CourtName are stored as a denormalized snapshot: booking-service does not
// join across databases (database-per-service pattern).
type Booking struct {
	ID         string        `json:"id"`
	CourtID    string        `json:"courtId"`
	CourtName  string        `json:"courtName"`
	PlayerName string        `json:"playerName"`
	Date       string        `json:"date"`      // "YYYY-MM-DD"
	StartTime  string        `json:"startTime"` // "HH:MM:SS" or "HH:MM"
	EndTime    string        `json:"endTime"`
	Status     BookingStatus `json:"status"`
	Price      float64       `json:"price"`
	CreatedAt  string        `json:"createdAt,omitempty"`
}
