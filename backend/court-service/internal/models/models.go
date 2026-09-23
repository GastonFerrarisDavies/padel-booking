package models

import "time"

// SportComplex represents a physical venue that hosts one or more courts.
type SportComplex struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Name      string     `gorm:"size:150;not null" json:"name"`
	Address   string     `gorm:"size:255" json:"address"`
	City      string     `gorm:"size:100" json:"city"`
	Phone     string     `gorm:"size:30" json:"phone"`
	Courts    []Court    `json:"courts,omitempty"`
	Schedules []OpeningSchedule `json:"schedules,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

// CourtStatus mirrors the values the frontend expects for a Court.
type CourtStatus string

const (
	CourtStatusAvailable   CourtStatus = "AVAILABLE"
	CourtStatusMaintenance CourtStatus = "MAINTENANCE"
	CourtStatusDisabled    CourtStatus = "DISABLED"
)

// Court belongs to a SportComplex and is the booking unit consumed by
// booking-service (via CourtID, no cross-database foreign key).
type Court struct {
	ID             uint        `gorm:"primaryKey" json:"id"`
	SportComplexID uint        `gorm:"index;not null" json:"sportComplexId"`
	Name           string      `gorm:"size:100;not null" json:"name"`
	Surface        string      `gorm:"size:50" json:"surface"`
	Indoor         bool        `json:"indoor"`
	PricePerHour   float64     `gorm:"type:decimal(10,2);not null" json:"pricePerHour"`
	Status         CourtStatus `gorm:"size:20;default:AVAILABLE" json:"status"`
	Rating         float64     `gorm:"type:decimal(2,1);default:0" json:"rating"`
	ReviewsCount   int         `gorm:"default:0" json:"reviewsCount"`
	CreatedAt      time.Time   `json:"createdAt"`
}

// OpeningSchedule defines a complex's opening hours for a given weekday
// (0 = Sunday ... 6 = Saturday), used to compute court availability.
type OpeningSchedule struct {
	ID             uint   `gorm:"primaryKey" json:"id"`
	SportComplexID uint   `gorm:"index;not null" json:"sportComplexId"`
	Weekday        int    `gorm:"not null" json:"weekday"`
	OpenTime       string `gorm:"size:5;not null" json:"openTime"`  // "HH:MM"
	CloseTime      string `gorm:"size:5;not null" json:"closeTime"` // "HH:MM"
}
