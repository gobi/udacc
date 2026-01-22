package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/udacc/uda-cycling-club/internal/config"
	"github.com/udacc/uda-cycling-club/internal/database"
	"github.com/udacc/uda-cycling-club/internal/middleware"
	"github.com/udacc/uda-cycling-club/internal/models"
)

type FacebookLoginRequest struct {
	AccessToken string `json:"access_token"`
}

type FacebookUserInfo struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Picture   struct {
		Data struct {
			URL string `json:"url"`
		} `json:"data"`
	} `json:"picture"`
}

// FacebookLogin handles login/register via Facebook OAuth
func FacebookLogin(c *fiber.Ctx) error {
	var req FacebookLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.AccessToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Access token is required",
		})
	}

	// Verify access token with Facebook
	fbUser, err := verifyFacebookToken(req.AccessToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid Facebook access token",
		})
	}

	if fbUser.ID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Could not get Facebook user info",
		})
	}

	// Try to find user by Facebook ID
	var user models.User
	result := database.DB.Where("facebook_id = ?", fbUser.ID).First(&user)

	if result.Error != nil {
		// User not found by Facebook ID, try by email if provided
		if fbUser.Email != "" {
			fbUser.Email = strings.ToLower(strings.TrimSpace(fbUser.Email))
			result = database.DB.Where("email = ?", fbUser.Email).First(&user)

			if result.Error == nil {
				// Found user by email, link Facebook account
				user.FacebookID = &fbUser.ID
				if user.OAuthProvider == "" {
					user.OAuthProvider = "facebook"
				}
				if user.AvatarURL == "" && fbUser.Picture.Data.URL != "" {
					user.AvatarURL = fbUser.Picture.Data.URL
				}
				if err := database.DB.Save(&user).Error; err != nil {
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
						"error": "Failed to link Facebook account",
					})
				}
			}
		}

		// If still not found, create new user
		if result.Error != nil {
			if fbUser.Email == "" {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Email permission is required. Please allow email access in Facebook.",
				})
			}

			// Ensure we have names
			firstName := fbUser.FirstName
			lastName := fbUser.LastName
			if firstName == "" {
				firstName = "Facebook"
			}
			if lastName == "" {
				lastName = "User"
			}

			user = models.User{
				Email:         fbUser.Email,
				FirstName:     firstName,
				LastName:      lastName,
				FacebookID:    &fbUser.ID,
				OAuthProvider: "facebook",
				AvatarURL:     fbUser.Picture.Data.URL,
			}

			if err := database.DB.Create(&user).Error; err != nil {
				// Check if email already exists (race condition)
				if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
					return c.Status(fiber.StatusConflict).JSON(fiber.Map{
						"error": "Email already registered. Please login with your password.",
					})
				}
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to create user",
				})
			}
		}
	}

	// Generate tokens
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

// verifyFacebookToken validates the access token with Facebook Graph API
func verifyFacebookToken(accessToken string) (*FacebookUserInfo, error) {
	cfg := config.AppConfig

	// First, verify the token is valid for our app
	debugURL := fmt.Sprintf(
		"https://graph.facebook.com/debug_token?input_token=%s&access_token=%s|%s",
		accessToken,
		cfg.FacebookAppID,
		cfg.FacebookAppSecret,
	)

	debugResp, err := http.Get(debugURL)
	if err != nil {
		return nil, fmt.Errorf("failed to verify token: %w", err)
	}
	defer debugResp.Body.Close()

	var debugResult struct {
		Data struct {
			IsValid bool   `json:"is_valid"`
			AppID   string `json:"app_id"`
			UserID  string `json:"user_id"`
		} `json:"data"`
	}

	if err := json.NewDecoder(debugResp.Body).Decode(&debugResult); err != nil {
		return nil, fmt.Errorf("failed to decode debug response: %w", err)
	}

	if !debugResult.Data.IsValid {
		return nil, fmt.Errorf("invalid access token")
	}

	if debugResult.Data.AppID != cfg.FacebookAppID {
		return nil, fmt.Errorf("token is not for this app")
	}

	// Get user info
	userURL := fmt.Sprintf(
		"https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=%s",
		accessToken,
	)

	userResp, err := http.Get(userURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer userResp.Body.Close()

	var fbUser FacebookUserInfo
	if err := json.NewDecoder(userResp.Body).Decode(&fbUser); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	return &fbUser, nil
}
