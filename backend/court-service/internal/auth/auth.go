// Package auth authorizes requests against user-service: the Clerk session
// token is forwarded to GET /auth/me, which verifies it with Clerk and returns
// the user's role from its database. Exposes chi-compatible middlewares.
package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"slices"
	"strings"
	"sync"
	"time"
)

// Claims is the authorization user-service resolves for a session.
type Claims struct {
	ID     string `json:"id"`
	Role   string `json:"role"`
	Active bool   `json:"active"`
}

var (
	ErrInvalidToken = errors.New("invalid or expired token")
	ErrDisabled     = errors.New("account is disabled")
	ErrUnavailable  = errors.New("authorization service unavailable")
)

const (
	// cacheTTL bounds how long a role change takes to reach this service.
	// Clerk session tokens live ~60s, so entries die with their token anyway.
	cacheTTL      = 30 * time.Second
	cacheMaxItems = 1000
)

type ctxKey struct{}

// FromContext returns the claims stored by RequireRole.
func FromContext(ctx context.Context) (Claims, bool) {
	c, ok := ctx.Value(ctxKey{}).(Claims)
	return c, ok
}

type cacheEntry struct {
	claims  Claims
	expires time.Time
}

// Verifier resolves session tokens through user-service, caching successes briefly.
type Verifier struct {
	meURL  string
	client *http.Client

	mu    sync.Mutex
	cache map[string]cacheEntry
}

// NewVerifier builds a Verifier for the user-service at baseURL (e.g. http://user-service).
func NewVerifier(baseURL string) *Verifier {
	return &Verifier{
		meURL:  strings.TrimRight(baseURL, "/") + "/auth/me",
		client: &http.Client{Timeout: 5 * time.Second},
		cache:  make(map[string]cacheEntry),
	}
}

// Verify returns the claims for token, or ErrInvalidToken / ErrDisabled / ErrUnavailable.
func (v *Verifier) Verify(ctx context.Context, token string) (Claims, error) {
	if claims, ok := v.cached(token); ok {
		return claims, nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.meURL, nil)
	if err != nil {
		return Claims{}, fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")

	res, err := v.client.Do(req)
	if err != nil {
		return Claims{}, fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	defer res.Body.Close()

	switch res.StatusCode {
	case http.StatusOK:
	case http.StatusUnauthorized:
		return Claims{}, ErrInvalidToken
	case http.StatusForbidden:
		return Claims{}, ErrDisabled
	default:
		return Claims{}, fmt.Errorf("%w: user-service answered %d", ErrUnavailable, res.StatusCode)
	}

	var claims Claims
	if err := json.NewDecoder(res.Body).Decode(&claims); err != nil || claims.ID == "" {
		return Claims{}, fmt.Errorf("%w: unexpected /auth/me payload", ErrUnavailable)
	}
	v.store(token, claims)
	return claims, nil
}

func (v *Verifier) cached(token string) (Claims, bool) {
	v.mu.Lock()
	defer v.mu.Unlock()
	entry, ok := v.cache[token]
	if !ok || time.Now().After(entry.expires) {
		delete(v.cache, token)
		return Claims{}, false
	}
	return entry.claims, true
}

func (v *Verifier) store(token string, claims Claims) {
	v.mu.Lock()
	defer v.mu.Unlock()
	if len(v.cache) >= cacheMaxItems {
		now := time.Now()
		for key, entry := range v.cache {
			if now.After(entry.expires) {
				delete(v.cache, key)
			}
		}
		if len(v.cache) >= cacheMaxItems {
			clear(v.cache)
		}
	}
	v.cache[token] = cacheEntry{claims: claims, expires: time.Now().Add(cacheTTL)}
}

// RequireRole rejects requests without a valid Bearer token (401), from a
// disabled account or whose role is not one of roles (403).
func RequireRole(verifier *Verifier, roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
			if !ok || token == "" {
				writeError(w, http.StatusUnauthorized, "missing bearer token")
				return
			}
			claims, err := verifier.Verify(r.Context(), token)
			switch {
			case errors.Is(err, ErrInvalidToken):
				writeError(w, http.StatusUnauthorized, err.Error())
				return
			case errors.Is(err, ErrDisabled):
				writeError(w, http.StatusForbidden, err.Error())
				return
			case err != nil:
				log.Printf("auth: %v", err)
				writeError(w, http.StatusServiceUnavailable, ErrUnavailable.Error())
				return
			}
			if !slices.Contains(roles, claims.Role) {
				writeError(w, http.StatusForbidden, "insufficient permissions")
				return
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, claims)))
		})
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
