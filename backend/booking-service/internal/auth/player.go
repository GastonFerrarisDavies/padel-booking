package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

const maxBodyBytes = 1 << 20

// Player is the minimal identity required to create a booking.
type Player struct {
	FirstName string
	LastName  string
}

func (p Player) FullName() string { return p.FirstName + " " + p.LastName }

type playerKey struct{}

// PlayerFromContext returns the identity stored by RequirePlayer.
func PlayerFromContext(ctx context.Context) (Player, bool) {
	p, ok := ctx.Value(playerKey{}).(Player)
	return p, ok
}

// RequirePlayer rejects the request (401) unless the JSON body identifies the
// player with name and surname: `firstName` + `lastName`, or a `playerName`
// with at least two words. The body is restored for the next handler.
func RequirePlayer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(io.LimitReader(r.Body, maxBodyBytes))
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		r.Body = io.NopCloser(bytes.NewReader(body))

		var in struct {
			FirstName  string `json:"firstName"`
			LastName   string `json:"lastName"`
			PlayerName string `json:"playerName"`
		}
		_ = json.Unmarshal(body, &in)

		player, ok := parsePlayer(in.FirstName, in.LastName, in.PlayerName)
		if !ok {
			writeError(w, http.StatusUnauthorized, "player name and surname are required")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), playerKey{}, player)))
	})
}

func parsePlayer(firstName, lastName, fullName string) (Player, bool) {
	first, last := strings.TrimSpace(firstName), strings.TrimSpace(lastName)
	if first == "" && last == "" {
		if name, surname, found := strings.Cut(strings.Join(strings.Fields(fullName), " "), " "); found {
			first, last = name, surname
		}
	}
	return Player{FirstName: first, LastName: last}, first != "" && last != ""
}
