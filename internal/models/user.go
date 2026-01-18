package models

import (
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email        string         `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash string         `gorm:"size:255;not null" json:"-"`
	LastName     string         `gorm:"size:100;not null" json:"last_name"`
	FirstName    string         `gorm:"size:100;not null" json:"first_name"`
	Phone        string         `gorm:"size:20" json:"phone,omitempty"`
	AvatarURL    string         `gorm:"size:500" json:"avatar_url,omitempty"`
	StravaURL    string         `gorm:"size:500" json:"strava_url,omitempty"`
	IsPrivate    bool           `gorm:"default:false" json:"is_private"`
	IsRideLeader bool           `gorm:"default:false" json:"is_ride_leader"`
	IsAdmin      bool           `gorm:"default:false" json:"is_admin"`
	TotalDistanceKm float64     `gorm:"type:decimal(10,2);default:0" json:"total_distance_km"`
	TotalRides   int            `gorm:"default:0" json:"total_rides"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hash)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

func (u *User) GetDisplayName(viewerIsAdmin bool) (lastName, firstName string) {
	if !u.IsPrivate || viewerIsAdmin {
		return u.LastName, u.FirstName
	}

	lastNameRunes := []rune(u.LastName)
	firstNameRunes := []rune(u.FirstName)

	maskedLastName := ""
	maskedFirstName := ""

	if utf8.RuneCountInString(u.LastName) > 0 {
		maskedLastName = string(lastNameRunes[0]) + "***"
	}

	if utf8.RuneCountInString(u.FirstName) > 0 {
		maskedFirstName = string(firstNameRunes[0]) + "***"
	}

	return maskedLastName, maskedFirstName
}

type UserResponse struct {
	ID              uuid.UUID `json:"id"`
	Email           string    `json:"email,omitempty"`
	LastName        string    `json:"last_name"`
	FirstName       string    `json:"first_name"`
	Phone           string    `json:"phone,omitempty"`
	AvatarURL       string    `json:"avatar_url,omitempty"`
	StravaURL       string    `json:"strava_url,omitempty"`
	IsPrivate       bool      `json:"is_private"`
	IsRideLeader    bool      `json:"is_ride_leader"`
	IsAdmin         bool      `json:"is_admin"`
	TotalDistanceKm float64   `json:"total_distance_km"`
	TotalRides      int       `json:"total_rides"`
	CreatedAt       time.Time `json:"created_at"`
}

func (u *User) ToResponse(viewerIsAdmin bool) UserResponse {
	lastName, firstName := u.GetDisplayName(viewerIsAdmin)

	resp := UserResponse{
		ID:              u.ID,
		LastName:        lastName,
		FirstName:       firstName,
		IsPrivate:       u.IsPrivate,
		IsRideLeader:    u.IsRideLeader,
		IsAdmin:         u.IsAdmin,
		TotalDistanceKm: u.TotalDistanceKm,
		TotalRides:      u.TotalRides,
		CreatedAt:       u.CreatedAt,
	}

	if !u.IsPrivate || viewerIsAdmin {
		resp.Email = u.Email
		resp.Phone = u.Phone
		resp.AvatarURL = u.AvatarURL
		resp.StravaURL = u.StravaURL
	}

	return resp
}
