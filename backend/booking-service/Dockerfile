# Stage 1: Build a static binary
ARG GO_VERSION=1.22
FROM golang:${GO_VERSION}-alpine AS build

WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/booking-service ./cmd/api


# Stage 2: Minimal runtime image
FROM alpine:3.20 AS production

RUN apk add --no-cache ca-certificates && \
    addgroup -S app && adduser -S app -G app

COPY --from=build /out/booking-service /usr/local/bin/booking-service

USER app

EXPOSE 8081

ENTRYPOINT ["/usr/local/bin/booking-service"]
