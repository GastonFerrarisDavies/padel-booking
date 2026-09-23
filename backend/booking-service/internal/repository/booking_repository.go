package repository

import (
	"context"
	"database/sql"
	"errors"

	"booking-service/internal/models"
)

// ErrOverlappingBooking is returned when a new booking would overlap an
// existing PENDING or CONFIRMED booking on the same court and date.
var ErrOverlappingBooking = errors.New("booking overlaps an existing reservation for this court")

// ErrNotFound is returned when a booking id does not exist.
var ErrNotFound = errors.New("booking not found")

type BookingRepository struct {
	db *sql.DB
}

func NewBookingRepository(db *sql.DB) *BookingRepository {
	return &BookingRepository{db: db}
}

func (r *BookingRepository) List(ctx context.Context, date, courtID string) ([]models.Booking, error) {
	query := `SELECT id, court_id, court_name, player_name, date, start_time, end_time, status, price, created_at
	          FROM bookings WHERE 1 = 1`
	args := []any{}

	if date != "" {
		query += " AND date = ?"
		args = append(args, date)
	}
	if courtID != "" {
		query += " AND court_id = ?"
		args = append(args, courtID)
	}
	query += " ORDER BY date, start_time"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		var b models.Booking
		if err := rows.Scan(&b.ID, &b.CourtID, &b.CourtName, &b.PlayerName, &b.Date, &b.StartTime, &b.EndTime, &b.Status, &b.Price, &b.CreatedAt); err != nil {
			return nil, err
		}
		bookings = append(bookings, b)
	}
	return bookings, rows.Err()
}

// Create validates that the requested slot does not overlap an existing
// active booking for the same court and date, then inserts the booking.
// The overlap check and insert run inside a single transaction with a
// locking read to stay correct under concurrent requests.
func (r *BookingRepository) Create(ctx context.Context, b models.Booking) (models.Booking, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return models.Booking{}, err
	}
	defer tx.Rollback()

	var overlapCount int
	err = tx.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM bookings
		WHERE court_id = ?
		  AND date = ?
		  AND status IN (?, ?)
		  AND start_time < ?
		  AND end_time > ?
		FOR UPDATE
	`, b.CourtID, b.Date, models.StatusPending, models.StatusConfirmed, b.EndTime, b.StartTime).Scan(&overlapCount)
	if err != nil {
		return models.Booking{}, err
	}
	if overlapCount > 0 {
		return models.Booking{}, ErrOverlappingBooking
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO bookings (id, court_id, court_name, player_name, date, start_time, end_time, status, price)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, b.ID, b.CourtID, b.CourtName, b.PlayerName, b.Date, b.StartTime, b.EndTime, b.Status, b.Price)
	if err != nil {
		return models.Booking{}, err
	}

	if err := tx.Commit(); err != nil {
		return models.Booking{}, err
	}

	return b, nil
}

func (r *BookingRepository) UpdateStatus(ctx context.Context, id string, status models.BookingStatus) (models.Booking, error) {
	res, err := r.db.ExecContext(ctx, `UPDATE bookings SET status = ? WHERE id = ?`, status, id)
	if err != nil {
		return models.Booking{}, err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return models.Booking{}, err
	}
	if rows == 0 {
		return models.Booking{}, ErrNotFound
	}

	var b models.Booking
	err = r.db.QueryRowContext(ctx, `
		SELECT id, court_id, court_name, player_name, date, start_time, end_time, status, price, created_at
		FROM bookings WHERE id = ?
	`, id).Scan(&b.ID, &b.CourtID, &b.CourtName, &b.PlayerName, &b.Date, &b.StartTime, &b.EndTime, &b.Status, &b.Price, &b.CreatedAt)
	if err != nil {
		return models.Booking{}, err
	}

	return b, nil
}
