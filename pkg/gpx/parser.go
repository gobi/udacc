package gpx

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
	"time"

	"github.com/tkrajina/gpxgo/gpx"
)

type RouteStats struct {
	DistanceKm    float64 `json:"distance_km"`
	ElevationGain float64 `json:"elevation_gain"`
	MaxGradient   float64 `json:"max_gradient"`
	MaxDescent    float64 `json:"max_descent"`
	PassCount     int     `json:"pass_count"`
}

type RoutePoint struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
	Ele float64 `json:"ele"`
}

// GetRoutePoints returns the route points from a GPX file
func GetRoutePoints(filepath string) ([]RoutePoint, error) {
	file, err := os.Open(filepath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	gpxData, err := gpx.Parse(file)
	if err != nil {
		return nil, err
	}

	var points []gpx.GPXPoint
	for _, track := range gpxData.Tracks {
		for _, segment := range track.Segments {
			points = append(points, segment.Points...)
		}
	}

	for _, route := range gpxData.Routes {
		points = append(points, route.Points...)
	}

	routePoints := make([]RoutePoint, len(points))
	for i, p := range points {
		routePoints[i] = RoutePoint{
			Lat: p.Latitude,
			Lng: p.Longitude,
			Ele: p.Elevation.Value(),
		}
	}

	return routePoints, nil
}

const (
	earthRadiusKm      = 6371.0
	minPassElevation   = 50.0
	elevationAPIURL    = "https://api.open-elevation.com/api/v1/lookup"
	maxPointsPerBatch  = 100 // API limit
)

// ElevationRequest represents a request to the elevation API
type ElevationRequest struct {
	Locations []Location `json:"locations"`
}

// Location represents a lat/lng point
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// ElevationResponse represents the API response
type ElevationResponse struct {
	Results []ElevationResult `json:"results"`
}

// ElevationResult represents a single elevation result
type ElevationResult struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Elevation float64 `json:"elevation"`
}

// fetchElevations fetches elevation data for points that don't have it
func fetchElevations(points []gpx.GPXPoint) ([]float64, error) {
	elevations := make([]float64, len(points))

	// Process in batches
	for i := 0; i < len(points); i += maxPointsPerBatch {
		end := i + maxPointsPerBatch
		if end > len(points) {
			end = len(points)
		}

		batch := points[i:end]
		locations := make([]Location, len(batch))
		for j, p := range batch {
			locations[j] = Location{
				Latitude:  p.Latitude,
				Longitude: p.Longitude,
			}
		}

		reqBody := ElevationRequest{Locations: locations}
		jsonData, err := json.Marshal(reqBody)
		if err != nil {
			return nil, err
		}

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Post(elevationAPIURL, "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			fmt.Printf("Elevation API error: %v\n", err)
			return nil, err
		}
		defer resp.Body.Close()

		var elevResp ElevationResponse
		if err := json.NewDecoder(resp.Body).Decode(&elevResp); err != nil {
			return nil, err
		}

		for j, result := range elevResp.Results {
			elevations[i+j] = result.Elevation
		}

		// Rate limiting - be nice to free API
		if end < len(points) {
			time.Sleep(100 * time.Millisecond)
		}
	}

	return elevations, nil
}

func ParseGPXFile(filepath string) (*RouteStats, error) {
	file, err := os.Open(filepath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	gpxData, err := gpx.Parse(file)
	if err != nil {
		return nil, err
	}

	var points []gpx.GPXPoint
	for _, track := range gpxData.Tracks {
		for _, segment := range track.Segments {
			points = append(points, segment.Points...)
		}
	}

	for _, route := range gpxData.Routes {
		points = append(points, route.Points...)
	}

	// Debug: print point count and sample elevation
	fmt.Printf("GPX Debug: Tracks=%d, Routes=%d, Total Points=%d\n",
		len(gpxData.Tracks), len(gpxData.Routes), len(points))
	if len(points) > 0 {
		fmt.Printf("GPX Debug: First point - Lat=%.6f, Lon=%.6f, Ele=%.2f, EleNull=%v\n",
			points[0].Latitude, points[0].Longitude, points[0].Elevation.Value(), points[0].Elevation.Null())
	}

	if len(points) < 2 {
		return &RouteStats{}, nil
	}

	// Check if elevation data is missing
	hasElevation := false
	for _, p := range points {
		if !p.Elevation.Null() && p.Elevation.Value() != 0 {
			hasElevation = true
			break
		}
	}

	// Fetch elevation from API if missing
	var apiElevations []float64
	if !hasElevation {
		fmt.Println("GPX Debug: No elevation data found, fetching from API...")
		var err error
		apiElevations, err = fetchElevations(points)
		if err != nil {
			fmt.Printf("GPX Debug: Failed to fetch elevations: %v\n", err)
			// Continue without elevation data
		} else {
			fmt.Printf("GPX Debug: Fetched %d elevations from API\n", len(apiElevations))
			if len(apiElevations) > 0 {
				fmt.Printf("GPX Debug: First elevation from API: %.2f\n", apiElevations[0])
			}
		}
	}

	stats := &RouteStats{}

	var totalDistance float64
	var totalElevationGain float64
	var maxGradient float64
	var maxDescent float64

	// Get elevation for a point (from GPX or API)
	getElevation := func(idx int) (float64, bool) {
		if !points[idx].Elevation.Null() && points[idx].Elevation.Value() != 0 {
			return points[idx].Elevation.Value(), true
		}
		if apiElevations != nil && idx < len(apiElevations) {
			return apiElevations[idx], true
		}
		return 0, false
	}

	prevElevation, hasPrevEle := getElevation(0)
	isClimbing := true
	lastPeakElevation := prevElevation
	passCount := 0

	for i := 1; i < len(points); i++ {
		prevPoint := points[i-1]
		currPoint := points[i]

		distance := haversineDistance(
			prevPoint.Latitude, prevPoint.Longitude,
			currPoint.Latitude, currPoint.Longitude,
		)
		totalDistance += distance

		currElevation, hasCurrEle := getElevation(i)
		if hasCurrEle {
			if !hasPrevEle {
				prevElevation = currElevation
				hasPrevEle = true
			}

			elevationDiff := currElevation - prevElevation

			if elevationDiff > 0 {
				totalElevationGain += elevationDiff
			}

			if distance > 0.001 {
				gradient := (elevationDiff / (distance * 1000)) * 100

				if gradient > maxGradient {
					maxGradient = gradient
				}
				if gradient < 0 && math.Abs(gradient) > maxDescent {
					maxDescent = math.Abs(gradient)
				}
			}

			if isClimbing && elevationDiff < -5 {
				if currElevation-lastPeakElevation < -minPassElevation {
					passCount++
				}
				isClimbing = false
				lastPeakElevation = prevElevation
			} else if !isClimbing && elevationDiff > 5 {
				isClimbing = true
				lastPeakElevation = prevElevation
			}

			if isClimbing && currElevation > lastPeakElevation {
				lastPeakElevation = currElevation
			}

			prevElevation = currElevation
		}
	}

	stats.DistanceKm = math.Round(totalDistance*100) / 100
	stats.ElevationGain = math.Round(totalElevationGain*100) / 100
	stats.MaxGradient = math.Round(maxGradient*100) / 100
	stats.MaxDescent = math.Round(maxDescent*100) / 100
	stats.PassCount = passCount

	return stats, nil
}

func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}
