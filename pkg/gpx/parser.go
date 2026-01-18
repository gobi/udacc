package gpx

import (
	"math"
	"os"

	"github.com/tkrajina/gpxgo/gpx"
)

type RouteStats struct {
	DistanceKm    float64 `json:"distance_km"`
	ElevationGain float64 `json:"elevation_gain"`
	MaxGradient   float64 `json:"max_gradient"`
	MaxDescent    float64 `json:"max_descent"`
	PassCount     int     `json:"pass_count"`
}

const (
	earthRadiusKm  = 6371.0
	minPassElevation = 50.0
)

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

	if len(points) < 2 {
		return &RouteStats{}, nil
	}

	stats := &RouteStats{}

	var totalDistance float64
	var totalElevationGain float64
	var maxGradient float64
	var maxDescent float64

	prevElevation := points[0].Elevation.Value()
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

		currElevation := currPoint.Elevation.Value()
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
