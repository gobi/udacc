.PHONY: run build test clean docker-up docker-down tidy

# Run the application
run:
	go run cmd/api/main.go

# Build the application
build:
	go build -o bin/api cmd/api/main.go

# Run tests
test:
	go test ./... -v

# Clean build artifacts
clean:
	rm -rf bin/

# Start PostgreSQL
docker-up:
	docker-compose up -d

# Stop PostgreSQL
docker-down:
	docker-compose down

# Tidy dependencies
tidy:
	go mod tidy

# Download dependencies
deps:
	go mod download

# Run with hot reload (requires air)
dev:
	air
