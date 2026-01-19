package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/udacc/uda-cycling-club/internal/config"
	"github.com/udacc/uda-cycling-club/internal/database"
	"github.com/udacc/uda-cycling-club/internal/middleware"
	"github.com/udacc/uda-cycling-club/internal/models"
	"github.com/udacc/uda-cycling-club/pkg/gpx"
)

type CreateRideRequest struct {
	Title            string   `json:"title"`
	Description      string   `json:"description"`
	RideTypeID       uint     `json:"ride_type_id"`
	DistanceKm       float64  `json:"distance_km"`
	ElevationGain    float64  `json:"elevation_gain"`
	MaxGradient      float64  `json:"max_gradient"`
	MaxDescent       float64  `json:"max_descent"`
	PassCount        int      `json:"pass_count"`
	StartTime        string   `json:"start_time"`
	MeetingPointName string   `json:"meeting_point_name"`
	MeetingPointLat  *float64 `json:"meeting_point_lat"`
	MeetingPointLng  *float64 `json:"meeting_point_lng"`
	BonusPercentage  float64  `json:"bonus_percentage"`
}

type UpdateRideRequest struct {
	Title            string   `json:"title"`
	Description      string   `json:"description"`
	RideTypeID       uint     `json:"ride_type_id"`
	DistanceKm       *float64 `json:"distance_km"`
	ElevationGain    *float64 `json:"elevation_gain"`
	MaxGradient      *float64 `json:"max_gradient"`
	MaxDescent       *float64 `json:"max_descent"`
	PassCount        *int     `json:"pass_count"`
	StartTime        string   `json:"start_time"`
	MeetingPointName string   `json:"meeting_point_name"`
	MeetingPointLat  *float64 `json:"meeting_point_lat"`
	MeetingPointLng  *float64 `json:"meeting_point_lng"`
	BonusPercentage  *float64 `json:"bonus_percentage"`
}

type StartRideRequest struct {
	LeaderID *uuid.UUID `json:"leader_id"`
}

type CompleteRideRequest struct {
	BonusPercentage *float64 `json:"bonus_percentage"`
}

func ListRides(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))
	status := c.Query("status")
	rideTypeID := c.Query("ride_type_id")

	query := database.DB.Model(&models.Ride{})

	// Get current user if authenticated
	user := middleware.GetCurrentUser(c)
	isAdmin := middleware.IsAdmin(c)

	// Filter draft rides - only show to creator or admin
	if status == "" {
		// When no status filter, exclude drafts unless user is admin or creator
		if user != nil && isAdmin {
			// Admin sees all
		} else if user != nil {
			// Regular user sees non-draft + own drafts
			query = query.Where("status != ? OR created_by_id = ?", models.RideStatusDraft, user.ID)
		} else {
			// Anonymous user sees only non-draft
			query = query.Where("status != ?", models.RideStatusDraft)
		}
	} else if status == "draft" {
		// Explicit draft filter - only for admin or creator
		if user != nil && isAdmin {
			query = query.Where("status = ?", status)
		} else if user != nil {
			query = query.Where("status = ? AND created_by_id = ?", status, user.ID)
		} else {
			// Anonymous can't see drafts
			return c.JSON(fiber.Map{
				"rides":  []models.RideResponse{},
				"total":  0,
				"limit":  limit,
				"offset": offset,
			})
		}
	} else {
		query = query.Where("status = ?", status)
	}

	if rideTypeID != "" {
		query = query.Where("ride_type_id = ?", rideTypeID)
	}

	var total int64
	query.Count(&total)

	var rides []models.Ride
	query.
		Preload("RideType").
		Preload("CreatedBy").
		Preload("Leader").
		Preload("Participants").
		Order("start_time DESC").
		Limit(limit).
		Offset(offset).
		Find(&rides)

	responses := make([]models.RideResponse, len(rides))
	for i, ride := range rides {
		responses[i] = ride.ToResponse(isAdmin)
	}

	return c.JSON(fiber.Map{
		"rides":  responses,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func GetRideTypes(c *fiber.Ctx) error {
	var rideTypes []models.RideType
	database.DB.Order("sort_order").Find(&rideTypes)
	return c.JSON(fiber.Map{
		"ride_types": rideTypes,
	})
}

func GetRide(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.
		Preload("RideType").
		Preload("CreatedBy").
		Preload("Leader").
		Preload("Participants").
		Preload("Participants.User").
		First(&ride, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	return c.JSON(ride.ToResponse(middleware.IsAdmin(c)))
}

func CreateRide(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	var req CreateRideRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Title == "" || req.RideTypeID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Title and ride_type_id are required",
		})
	}

	var rideType models.RideType
	if err := database.DB.First(&rideType, req.RideTypeID).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride type",
		})
	}

	ride := models.Ride{
		Title:            req.Title,
		Description:      req.Description,
		RideTypeID:       req.RideTypeID,
		CreatedByID:      user.ID,
		DistanceKm:       req.DistanceKm,
		ElevationGain:    req.ElevationGain,
		MaxGradient:      req.MaxGradient,
		MaxDescent:       req.MaxDescent,
		PassCount:        req.PassCount,
		MeetingPointName: req.MeetingPointName,
		MeetingPointLat:  req.MeetingPointLat,
		MeetingPointLng:  req.MeetingPointLng,
		BonusPercentage:  req.BonusPercentage,
		Status:           models.RideStatusDraft,
	}

	if req.StartTime != "" {
		startTime, err := time.Parse(time.RFC3339, req.StartTime)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid start_time format. Use RFC3339 format",
			})
		}
		ride.StartTime = &startTime
	}

	if err := database.DB.Create(&ride).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create ride",
		})
	}

	database.DB.Preload("RideType").Preload("CreatedBy").First(&ride, "id = ?", ride.ID)

	return c.Status(fiber.StatusCreated).JSON(ride.ToResponse(user.IsAdmin))
}

func UpdateRide(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.CreatedByID != user.ID && !user.IsAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only update your own rides",
		})
	}

	if ride.Status == models.RideStatusCompleted || ride.Status == models.RideStatusCancelled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot update completed or cancelled ride",
		})
	}

	var req UpdateRideRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Title != "" {
		ride.Title = req.Title
	}
	if req.Description != "" {
		ride.Description = req.Description
	}
	if req.RideTypeID != 0 {
		ride.RideTypeID = req.RideTypeID
	}
	if req.MeetingPointName != "" {
		ride.MeetingPointName = req.MeetingPointName
	}
	if req.MeetingPointLat != nil {
		ride.MeetingPointLat = req.MeetingPointLat
	}
	if req.MeetingPointLng != nil {
		ride.MeetingPointLng = req.MeetingPointLng
	}
	if req.DistanceKm != nil {
		ride.DistanceKm = *req.DistanceKm
	}
	if req.ElevationGain != nil {
		ride.ElevationGain = *req.ElevationGain
	}
	if req.MaxGradient != nil {
		ride.MaxGradient = *req.MaxGradient
	}
	if req.MaxDescent != nil {
		ride.MaxDescent = *req.MaxDescent
	}
	if req.PassCount != nil {
		ride.PassCount = *req.PassCount
	}
	if req.BonusPercentage != nil {
		ride.BonusPercentage = *req.BonusPercentage
	}
	if req.StartTime != "" {
		startTime, err := time.Parse(time.RFC3339, req.StartTime)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid start_time format",
			})
		}
		ride.StartTime = &startTime
	}

	if err := database.DB.Save(&ride).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update ride",
		})
	}

	database.DB.Preload("RideType").Preload("CreatedBy").Preload("Leader").First(&ride, "id = ?", ride.ID)

	return c.JSON(ride.ToResponse(user.IsAdmin))
}

func DeleteRide(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.CreatedByID != user.ID && !user.IsAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only delete your own rides",
		})
	}

	if ride.Status == models.RideStatusOngoing || ride.Status == models.RideStatusCompleted {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot delete ongoing or completed ride",
		})
	}

	if err := database.DB.Delete(&ride).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete ride",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Ride deleted successfully",
	})
}

func UploadGPX(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.CreatedByID != user.ID && !user.IsAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only upload GPX to your own rides",
		})
	}

	file, err := c.FormFile("gpx")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "GPX file is required",
		})
	}

	if file.Size > config.AppConfig.MaxFileSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File too large",
		})
	}

	uploadDir := config.AppConfig.UploadDir
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create upload directory",
		})
	}

	filename := fmt.Sprintf("%s_%s.gpx", ride.ID.String(), time.Now().Format("20060102150405"))
	filepath := filepath.Join(uploadDir, filename)

	if err := c.SaveFile(file, filepath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}

	stats, err := gpx.ParseGPXFile(filepath)
	if err != nil {
		os.Remove(filepath)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse GPX file: " + err.Error(),
		})
	}

	ride.GPXFileURL = filepath
	ride.DistanceKm = stats.DistanceKm
	ride.ElevationGain = stats.ElevationGain
	ride.MaxGradient = stats.MaxGradient
	ride.MaxDescent = stats.MaxDescent
	ride.PassCount = stats.PassCount

	if err := database.DB.Save(&ride).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update ride",
		})
	}

	return c.JSON(fiber.Map{
		"message": "GPX uploaded successfully",
		"stats":   stats,
	})
}

func PublishRide(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.CreatedByID != user.ID && !user.IsAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only publish your own rides",
		})
	}

	if ride.Status != models.RideStatusDraft {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Only draft rides can be published",
		})
	}

	ride.Status = models.RideStatusPublished

	if err := database.DB.Save(&ride).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to publish ride",
		})
	}

	database.DB.Preload("RideType").Preload("CreatedBy").First(&ride, "id = ?", ride.ID)

	return c.JSON(ride.ToResponse(user.IsAdmin))
}

func StartRide(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.CreatedByID != user.ID && !user.IsAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You can only start your own rides",
		})
	}

	if ride.Status != models.RideStatusPublished {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Only published rides can be started",
		})
	}

	var req StartRideRequest
	c.BodyParser(&req)

	leaderID := user.ID
	if req.LeaderID != nil {
		var leader models.User
		if err := database.DB.First(&leader, "id = ?", req.LeaderID).Error; err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Leader not found",
			})
		}
		if !leader.IsRideLeader && !leader.IsAdmin {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Selected user is not a ride leader",
			})
		}
		leaderID = *req.LeaderID
	}

	now := time.Now()
	ride.Status = models.RideStatusOngoing
	ride.LeaderID = &leaderID
	ride.StartedAt = &now

	if err := database.DB.Save(&ride).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to start ride",
		})
	}

	database.DB.Preload("RideType").Preload("CreatedBy").Preload("Leader").First(&ride, "id = ?", ride.ID)

	return c.JSON(ride.ToResponse(user.IsAdmin))
}

func CompleteRide(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.Preload("Participants").First(&ride, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.CreatedByID != user.ID && (ride.LeaderID == nil || *ride.LeaderID != user.ID) && !user.IsAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only the ride creator or leader can complete the ride",
		})
	}

	if ride.Status != models.RideStatusOngoing {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Only ongoing rides can be completed",
		})
	}

	var req CompleteRideRequest
	c.BodyParser(&req)

	if req.BonusPercentage != nil {
		ride.BonusPercentage = *req.BonusPercentage
	}

	now := time.Now()
	ride.Status = models.RideStatusCompleted
	ride.CompletedAt = &now

	if err := database.DB.Save(&ride).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to complete ride",
		})
	}

	for _, participant := range ride.Participants {
		if participant.Attended {
			participant.Completed = true
			participant.CalculateFinalDistance(ride.DistanceKm, ride.BonusPercentage)
			database.DB.Save(&participant)

			database.DB.Model(&models.User{}).
				Where("id = ?", participant.UserID).
				Updates(map[string]interface{}{
					"total_distance_km": database.DB.Raw("total_distance_km + ?", participant.FinalDistanceKm),
					"total_rides":       database.DB.Raw("total_rides + 1"),
				})
		}
	}

	database.DB.Preload("RideType").Preload("CreatedBy").Preload("Leader").First(&ride, "id = ?", ride.ID)

	return c.JSON(ride.ToResponse(user.IsAdmin))
}

// ParseGPXPreview parses a GPX file and returns route statistics without creating a ride
func ParseGPXPreview(c *fiber.Ctx) error {
	file, err := c.FormFile("gpx")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "GPX file is required",
		})
	}

	if file.Size > config.AppConfig.MaxFileSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File too large",
		})
	}

	uploadDir := config.AppConfig.UploadDir
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create upload directory",
		})
	}

	// Save to a temporary file for parsing
	tempFilename := fmt.Sprintf("temp_%s.gpx", time.Now().Format("20060102150405"))
	tempFilepath := filepath.Join(uploadDir, tempFilename)

	if err := c.SaveFile(file, tempFilepath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}

	// Parse and get stats
	stats, err := gpx.ParseGPXFile(tempFilepath)

	// Clean up temp file
	os.Remove(tempFilepath)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse GPX file: " + err.Error(),
		})
	}

	return c.JSON(stats)
}

// GetRoutePoints returns the route points and passes from a ride's GPX file
func GetRoutePoints(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.GPXFileURL == "" {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No GPX file for this ride",
		})
	}

	points, err := gpx.GetRoutePoints(ride.GPXFileURL)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read GPX file: " + err.Error(),
		})
	}

	// Also get stats which includes passes
	stats, _ := gpx.ParseGPXFile(ride.GPXFileURL)

	response := fiber.Map{
		"points": points,
	}

	if stats != nil && len(stats.Passes) > 0 {
		response["passes"] = stats.Passes
	}

	return c.JSON(response)
}
