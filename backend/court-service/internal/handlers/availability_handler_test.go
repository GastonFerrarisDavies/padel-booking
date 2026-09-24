package handlers

import (
	"reflect"
	"testing"

	"court-service/internal/bookings"
	"court-service/internal/models"
)

func starts(slots []Slot) []string {
	out := make([]string, len(slots))
	for i, s := range slots {
		out[i] = s.Start
	}
	return out
}

func TestBuildSlots(t *testing.T) {
	schedule := models.OpeningSchedule{OpenTime: "08:00", CloseTime: "11:00"}

	tests := []struct {
		name     string
		duration int
		from     int
		booked   []bookings.Booking
		want     []string
	}{
		{name: "90 min fills opening hours", duration: 90, want: []string{"08:00", "08:30", "09:00", "09:30"}},
		{name: "from rounds up to the step grid", duration: 60, from: 9*60 + 10, want: []string{"09:30", "10:00"}},
		{name: "from before opening is ignored", duration: 120, from: 6 * 60, want: []string{"08:00", "08:30", "09:00"}},
		{
			name:     "bookings (HH:MM:SS) remove overlapping slots only",
			duration: 60,
			booked:   []bookings.Booking{{StartTime: "09:00:00", EndTime: "10:00:00"}},
			want:     []string{"08:00", "10:00"},
		},
		{name: "duration longer than opening hours", duration: 240, want: []string{}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := starts(buildSlots(schedule, 20000, tt.duration, tt.from, tt.booked))
			if !reflect.DeepEqual(got, tt.want) {
				t.Fatalf("got %v, want %v", got, tt.want)
			}
		})
	}
}

func TestBuildSlotsPriceAndEnd(t *testing.T) {
	slots := buildSlots(models.OpeningSchedule{OpenTime: "22:00", CloseTime: "24:00"}, 20000, 90, 0, nil)
	want := []Slot{{Start: "22:00", End: "23:30", Price: 30000}, {Start: "22:30", End: "24:00", Price: 30000}}
	if !reflect.DeepEqual(slots, want) {
		t.Fatalf("got %+v, want %+v", slots, want)
	}
}
