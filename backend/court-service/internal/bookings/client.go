// Package bookings is a minimal HTTP client for booking-service, which owns
// reservation data (database-per-service: no cross-database queries).
package bookings

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Booking holds the fields court-service needs to compute availability.
type Booking struct {
	CourtID   string `json:"courtId"`
	StartTime string `json:"startTime"` // "HH:MM" or "HH:MM:SS"
	EndTime   string `json:"endTime"`
	Status    string `json:"status"`
}

type Client struct {
	baseURL string
	http    *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		http:    &http.Client{Timeout: 3 * time.Second},
	}
}

// ActiveByCourt returns the non-cancelled bookings of a date, keyed by courtId.
func (c *Client) ActiveByCourt(ctx context.Context, date string) (map[string][]Booking, error) {
	endpoint := fmt.Sprintf("%s/bookings?date=%s", c.baseURL, url.QueryEscape(date))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("booking-service responded %d", resp.StatusCode)
	}

	var list []Booking
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, fmt.Errorf("decoding bookings: %w", err)
	}

	byCourt := make(map[string][]Booking)
	for _, b := range list {
		if b.Status == "CANCELLED" {
			continue
		}
		byCourt[b.CourtID] = append(byCourt[b.CourtID], b)
	}
	return byCourt, nil
}
