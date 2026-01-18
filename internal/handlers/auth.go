package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/udacc/uda-cycling-club/internal/database"
	"github.com/udacc/uda-cycling-club/internal/middleware"
	"github.com/udacc/uda-cycling-club/internal/models"
)

type RegisterRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	LastName  string `json:"last_name"`
	FirstName string `json:"first_name"`
	Phone     string `json:"phone"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type UpdateProfileRequest struct {
	LastName  string `json:"last_name"`
	FirstName string `json:"first_name"`
	Phone     string `json:"phone"`
	AvatarURL string `json:"avatar_url"`
	StravaURL string `json:"strava_url"`
	IsPrivate *bool  `json:"is_private"`
}

type AuthResponse struct {
	Token        string              `json:"token"`
	RefreshToken string              `json:"refresh_token"`
	User         models.UserResponse `json:"user"`
}

func Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Email == "" || req.Password == "" || req.LastName == "" || req.FirstName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email, password, last_name, and first_name are required",
		})
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Email already registered",
		})
	}

	user := models.User{
		Email:     req.Email,
		LastName:  req.LastName,
		FirstName: req.FirstName,
		Phone:     req.Phone,
	}

	if err := user.SetPassword(req.Password); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to hash password",
		})
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create user",
		})
	}

	accessToken, refreshToken, err := middleware.GenerateTokens(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate tokens",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(AuthResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		User:         user.ToResponse(false),
	})
}

func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	if !user.CheckPassword(req.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	accessToken, refreshToken, err := middleware.GenerateTokens(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate tokens",
		})
	}

	return c.JSON(AuthResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		User:         user.ToResponse(user.IsAdmin),
	})
}

func RefreshToken(c *fiber.Ctx) error {
	var req RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	claims, err := middleware.ParseToken(req.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid or expired refresh token",
		})
	}

	if claims.TokenType != middleware.RefreshToken {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid token type",
		})
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	accessToken, refreshToken, err := middleware.GenerateTokens(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate tokens",
		})
	}

	return c.JSON(AuthResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		User:         user.ToResponse(user.IsAdmin),
	})
}

func GetMe(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	return c.JSON(user.ToResponse(user.IsAdmin))
}

func UpdateMe(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.AvatarURL != "" {
		user.AvatarURL = req.AvatarURL
	}
	if req.StravaURL != "" {
		user.StravaURL = req.StravaURL
	}
	if req.IsPrivate != nil {
		user.IsPrivate = *req.IsPrivate
	}

	if err := database.DB.Save(user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update profile",
		})
	}

	return c.JSON(user.ToResponse(user.IsAdmin))
}

func ChangePassword(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	var req ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if !user.CheckPassword(req.CurrentPassword) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Current password is incorrect",
		})
	}

	if err := user.SetPassword(req.NewPassword); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to hash password",
		})
	}

	if err := database.DB.Save(user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update password",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Password changed successfully",
	})
}
