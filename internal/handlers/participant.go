package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/udacc/uda-cycling-club/internal/database"
	"github.com/udacc/uda-cycling-club/internal/middleware"
	"github.com/udacc/uda-cycling-club/internal/models"
)

type UpdateParticipantRequest struct {
	Attended         *bool    `json:"attended"`
	ActualDistanceKm *float64 `json:"actual_distance_km"`
	BonusPercentage  *float64 `json:"bonus_percentage"`
	Notes            string   `json:"notes"`
}

type BulkAttendanceRequest struct {
	Participants []struct {
		UserID   uuid.UUID `json:"user_id"`
		Attended bool      `json:"attended"`
	} `json:"participants"`
}

func RegisterForRide(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	rideID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", rideID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.Status != models.RideStatusPublished {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Can only register for published rides",
		})
	}

	var existing models.RideParticipant
	if err := database.DB.Where("ride_id = ? AND user_id = ?", rideID, user.ID).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Already registered for this ride",
		})
	}

	participant := models.RideParticipant{
		RideID:       rideID,
		UserID:       user.ID,
		RegisteredAt: time.Now(),
	}

	if err := database.DB.Create(&participant).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to register for ride",
		})
	}

	database.DB.Preload("User").First(&participant, "id = ?", participant.ID)

	return c.Status(fiber.StatusCreated).JSON(participant.ToResponse(user.IsAdmin))
}

func UnregisterFromRide(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	rideID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", rideID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.Status != models.RideStatusPublished {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Can only unregister from published rides",
		})
	}

	result := database.DB.Where("ride_id = ? AND user_id = ?", rideID, user.ID).Delete(&models.RideParticipant{})
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Not registered for this ride",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Unregistered from ride successfully",
	})
}

func ListParticipants(c *fiber.Ctx) error {
	rideID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var participants []models.RideParticipant
	database.DB.
		Preload("User").
		Where("ride_id = ?", rideID).
		Order("registered_at").
		Find(&participants)

	isAdmin := middleware.IsAdmin(c)
	responses := make([]models.ParticipantResponse, len(participants))
	for i, p := range participants {
		responses[i] = p.ToResponse(isAdmin)
	}

	return c.JSON(fiber.Map{
		"participants": responses,
		"total":        len(responses),
	})
}

func UpdateParticipant(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	rideID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	participantID, err := uuid.Parse(c.Params("pid"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid participant ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", rideID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.CreatedByID != user.ID && (ride.LeaderID == nil || *ride.LeaderID != user.ID) && !user.IsAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only ride creator or leader can update participants",
		})
	}

	var participant models.RideParticipant
	if err := database.DB.Where("id = ? AND ride_id = ?", participantID, rideID).First(&participant).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Participant not found",
		})
	}

	var req UpdateParticipantRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Attended != nil {
		participant.Attended = *req.Attended
	}
	if req.ActualDistanceKm != nil {
		participant.ActualDistanceKm = req.ActualDistanceKm
	}
	if req.BonusPercentage != nil {
		participant.BonusPercentage = req.BonusPercentage
	}
	if req.Notes != "" {
		participant.Notes = req.Notes
	}

	participant.CalculateFinalDistance(ride.DistanceKm, ride.BonusPercentage)

	if err := database.DB.Save(&participant).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update participant",
		})
	}

	database.DB.Preload("User").First(&participant, "id = ?", participant.ID)

	return c.JSON(participant.ToResponse(user.IsAdmin))
}

func MarkAttendance(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	rideID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	participantID, err := uuid.Parse(c.Params("pid"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid participant ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", rideID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.CreatedByID != user.ID && (ride.LeaderID == nil || *ride.LeaderID != user.ID) && !user.IsAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only ride creator or leader can mark attendance",
		})
	}

	if ride.Status != models.RideStatusOngoing {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Can only mark attendance for ongoing rides",
		})
	}

	var participant models.RideParticipant
	if err := database.DB.Where("id = ? AND ride_id = ?", participantID, rideID).First(&participant).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Participant not found",
		})
	}

	participant.Attended = true

	if err := database.DB.Save(&participant).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to mark attendance",
		})
	}

	database.DB.Preload("User").First(&participant, "id = ?", participant.ID)

	return c.JSON(participant.ToResponse(user.IsAdmin))
}

func BulkAttendance(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	rideID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ride ID",
		})
	}

	var ride models.Ride
	if err := database.DB.First(&ride, "id = ?", rideID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Ride not found",
		})
	}

	if ride.CreatedByID != user.ID && (ride.LeaderID == nil || *ride.LeaderID != user.ID) && !user.IsAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Only ride creator or leader can mark attendance",
		})
	}

	if ride.Status != models.RideStatusOngoing {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Can only mark attendance for ongoing rides",
		})
	}

	var req BulkAttendanceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	for _, p := range req.Participants {
		database.DB.Model(&models.RideParticipant{}).
			Where("ride_id = ? AND user_id = ?", rideID, p.UserID).
			Update("attended", p.Attended)
	}

	var participants []models.RideParticipant
	database.DB.Preload("User").Where("ride_id = ?", rideID).Find(&participants)

	isAdmin := middleware.IsAdmin(c)
	responses := make([]models.ParticipantResponse, len(participants))
	for i, p := range participants {
		responses[i] = p.ToResponse(isAdmin)
	}

	return c.JSON(fiber.Map{
		"message":      "Attendance updated successfully",
		"participants": responses,
	})
}
