// Package auth verifies the HS256 JWTs issued by user-service (shared
// JWT_SECRET) and exposes chi-compatible middlewares.
package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"slices"
	"strings"
	"time"
)

// Claims are the fields user-service puts in its tokens.
type Claims struct {
	Sub  string `json:"sub"`
	Role string `json:"role"`
	Exp  int64  `json:"exp"`
}

var ErrInvalidToken = errors.New("invalid or expired token")

type ctxKey struct{}

// FromContext returns the claims stored by RequireRole.
func FromContext(ctx context.Context) (Claims, bool) {
	c, ok := ctx.Value(ctxKey{}).(Claims)
	return c, ok
}

// Verify checks signature, algorithm and expiry of a compact JWT.
func Verify(token string, secret []byte) (Claims, error) {
	parts := strings.Split(token, ".")
	if len(secret) == 0 || len(parts) != 3 {
		return Claims{}, ErrInvalidToken
	}

	var header struct {
		Alg string `json:"alg"`
	}
	if err := decodeSegment(parts[0], &header); err != nil || header.Alg != "HS256" {
		return Claims{}, ErrInvalidToken
	}

	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(parts[0] + "." + parts[1]))
	sig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil || !hmac.Equal(sig, mac.Sum(nil)) {
		return Claims{}, ErrInvalidToken
	}

	var claims Claims
	if err := decodeSegment(parts[1], &claims); err != nil {
		return Claims{}, ErrInvalidToken
	}
	if claims.Exp == 0 || time.Now().Unix() >= claims.Exp {
		return Claims{}, ErrInvalidToken
	}
	return claims, nil
}

// RequireRole rejects requests without a valid Bearer token (401) or whose
// role is not one of roles (403).
func RequireRole(secret []byte, roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
			if !ok || token == "" {
				writeError(w, http.StatusUnauthorized, "missing bearer token")
				return
			}
			claims, err := Verify(token, secret)
			if err != nil {
				writeError(w, http.StatusUnauthorized, err.Error())
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

func decodeSegment(segment string, v any) error {
	raw, err := base64.RawURLEncoding.DecodeString(segment)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
