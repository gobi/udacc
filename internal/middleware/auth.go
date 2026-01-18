package middleware

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/udacc/uda-cycling-club/internal/config"
	"github.com/udacc/uda-cycling-club/internal/database"
	"github.com/udacc/uda-cycling-club/internal/models"
)

type TokenType string

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	Email     string    `json:"email"`
	IsAdmin   bool      `json:"is_admin"`
	IsRideLeader bool   `json:"is_ride_leader"`
	TokenType TokenType `json:"token_type"`
	jwt.RegisteredClaims
}

func GenerateTokens(user *models.User) (accessToken, refreshToken string, err error) {
	cfg := config.AppConfig

	accessClaims := Claims{
		UserID:       user.ID,
		Email:        user.Email,
		IsAdmin:      user.IsAdmin,
		IsRideLeader: user.IsRideLeader,
		TokenType:    AccessToken,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(cfg.JWTExpiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	accessTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = accessTokenObj.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		return "", "", err
	}

	refreshClaims := Claims{
		UserID:    user.ID,
		Email:     user.Email,
		TokenType: RefreshToken,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(cfg.JWTRefreshExpiryDays) * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err = refreshTokenObj.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func ParseToken(tokenString string) (*Claims, error) {
	cfg := config.AppConfig

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}

func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header required",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		claims, err := ParseToken(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		if claims.TokenType != AccessToken {
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

		c.Locals("user", &user)
		c.Locals("claims", claims)

		return c.Next()
	}
}

func RideLeaderRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := c.Locals("user").(*models.User)

		if !user.IsRideLeader && !user.IsAdmin {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Ride leader permission required",
			})
		}

		return c.Next()
	}
}

func AdminRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := c.Locals("user").(*models.User)

		if !user.IsAdmin {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Admin permission required",
			})
		}

		return c.Next()
	}
}

func GetCurrentUser(c *fiber.Ctx) *models.User {
	user, ok := c.Locals("user").(*models.User)
	if !ok {
		return nil
	}
	return user
}

func IsAdmin(c *fiber.Ctx) bool {
	user := GetCurrentUser(c)
	return user != nil && user.IsAdmin
}
