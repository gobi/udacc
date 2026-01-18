package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/udacc/uda-cycling-club/internal/database"
	"github.com/udacc/uda-cycling-club/internal/middleware"
	"github.com/udacc/uda-cycling-club/internal/models"
)

type UpdateRoleRequest struct {
	IsRideLeader *bool `json:"is_ride_leader"`
	IsAdmin      *bool `json:"is_admin"`
}

func ListUsers(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	var users []models.User
	var total int64

	database.DB.Model(&models.User{}).Count(&total)
	database.DB.Limit(limit).Offset(offset).Order("created_at DESC").Find(&users)

	isAdmin := middleware.IsAdmin(c)
	responses := make([]models.UserResponse, len(users))
	for i, user := range users {
		responses[i] = user.ToResponse(isAdmin)
	}

	return c.JSON(fiber.Map{
		"users":  responses,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func GetLeaderboard(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	var users []models.User
	var total int64

	database.DB.Model(&models.User{}).Where("total_distance_km > 0").Count(&total)
	database.DB.Where("total_distance_km > 0").
		Order("total_distance_km DESC").
		Limit(limit).
		Offset(offset).
		Find(&users)

	isAdmin := middleware.IsAdmin(c)
	responses := make([]fiber.Map, len(users))
	for i, user := range users {
		responses[i] = fiber.Map{
			"rank": offset + i + 1,
			"user": user.ToResponse(isAdmin),
		}
	}

	return c.JSON(fiber.Map{
		"leaderboard": responses,
		"total":       total,
		"limit":       limit,
		"offset":      offset,
	})
}

func GetStatistics(c *fiber.Ctx) error {
	var totalUsers int64
	var totalRideLeaders int64
	var totalDistance float64
	var totalRides int64

	database.DB.Model(&models.User{}).Count(&totalUsers)
	database.DB.Model(&models.User{}).Where("is_ride_leader = ?", true).Count(&totalRideLeaders)
	database.DB.Model(&models.User{}).Select("COALESCE(SUM(total_distance_km), 0)").Scan(&totalDistance)
	database.DB.Model(&models.User{}).Select("COALESCE(SUM(total_rides), 0)").Scan(&totalRides)

	var completedRides int64
	database.DB.Model(&models.Ride{}).Where("status = ?", models.RideStatusCompleted).Count(&completedRides)

	return c.JSON(fiber.Map{
		"total_users":        totalUsers,
		"total_ride_leaders": totalRideLeaders,
		"total_distance_km":  totalDistance,
		"total_rides":        totalRides,
		"completed_rides":    completedRides,
	})
}

func GetRideLeaders(c *fiber.Ctx) error {
	var users []models.User
	database.DB.Where("is_ride_leader = ?", true).Order("total_distance_km DESC").Find(&users)

	isAdmin := middleware.IsAdmin(c)
	responses := make([]models.UserResponse, len(users))
	for i, user := range users {
		responses[i] = user.ToResponse(isAdmin)
	}

	return c.JSON(fiber.Map{
		"ride_leaders": responses,
	})
}

func GetUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(user.ToResponse(middleware.IsAdmin(c)))
}

func GetUserRides(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	var participants []models.RideParticipant
	var total int64

	database.DB.Model(&models.RideParticipant{}).
		Joins("JOIN rides ON rides.id = ride_participants.ride_id").
		Where("ride_participants.user_id = ? AND ride_participants.completed = ? AND rides.status = ?",
			id, true, models.RideStatusCompleted).
		Count(&total)

	database.DB.
		Preload("Ride").
		Preload("Ride.RideType").
		Joins("JOIN rides ON rides.id = ride_participants.ride_id").
		Where("ride_participants.user_id = ? AND ride_participants.completed = ? AND rides.status = ?",
			id, true, models.RideStatusCompleted).
		Order("rides.completed_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&participants)

	isAdmin := middleware.IsAdmin(c)
	responses := make([]fiber.Map, len(participants))
	for i, p := range participants {
		responses[i] = fiber.Map{
			"ride":              p.Ride.ToResponse(isAdmin),
			"final_distance_km": p.FinalDistanceKm,
			"completed_at":      p.Ride.CompletedAt,
		}
	}

	return c.JSON(fiber.Map{
		"rides":  responses,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func UpdateUserRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	var req UpdateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	if req.IsRideLeader != nil {
		user.IsRideLeader = *req.IsRideLeader
	}
	if req.IsAdmin != nil {
		user.IsAdmin = *req.IsAdmin
	}

	if err := database.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update user role",
		})
	}

	return c.JSON(user.ToResponse(true))
}
