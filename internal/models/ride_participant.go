package models

import (
	"time"

	"github.com/google/uuid"
)

type RideParticipant struct {
	ID              uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	RideID          uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_ride_user" json:"ride_id"`
	Ride            Ride       `gorm:"foreignKey:RideID" json:"-"`
	UserID          uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_ride_user" json:"user_id"`
	User            User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	RegisteredAt    time.Time  `gorm:"not null;default:now()" json:"registered_at"`
	Attended        bool       `gorm:"default:false" json:"attended"`
	Completed       bool       `gorm:"default:false" json:"completed"`
	ActualDistanceKm *float64  `gorm:"type:decimal(10,2)" json:"actual_distance_km"`
	BonusPercentage  *float64  `gorm:"type:decimal(5,2)" json:"bonus_percentage"`
	FinalDistanceKm  float64   `gorm:"type:decimal(10,2);default:0" json:"final_distance_km"`
	Notes           string     `gorm:"type:text" json:"notes"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type ParticipantResponse struct {
	ID               uuid.UUID     `json:"id"`
	RideID           uuid.UUID     `json:"ride_id"`
	UserID           uuid.UUID     `json:"user_id"`
	User             *UserResponse `json:"user,omitempty"`
	RegisteredAt     time.Time     `json:"registered_at"`
	Attended         bool          `json:"attended"`
	Completed        bool          `json:"completed"`
	ActualDistanceKm *float64      `json:"actual_distance_km"`
	BonusPercentage  *float64      `json:"bonus_percentage"`
	FinalDistanceKm  float64       `json:"final_distance_km"`
	Notes            string        `json:"notes"`
}

func (rp *RideParticipant) ToResponse(viewerIsAdmin bool) ParticipantResponse {
	resp := ParticipantResponse{
		ID:               rp.ID,
		RideID:           rp.RideID,
		UserID:           rp.UserID,
		RegisteredAt:     rp.RegisteredAt,
		Attended:         rp.Attended,
		Completed:        rp.Completed,
		ActualDistanceKm: rp.ActualDistanceKm,
		BonusPercentage:  rp.BonusPercentage,
		FinalDistanceKm:  rp.FinalDistanceKm,
		Notes:            rp.Notes,
	}

	if rp.User.ID != uuid.Nil {
		userResp := rp.User.ToResponse(viewerIsAdmin)
		resp.User = &userResp
	}

	return resp
}

func (rp *RideParticipant) CalculateFinalDistance(rideDistanceKm, rideBonusPercentage float64) {
	distance := rideDistanceKm
	if rp.ActualDistanceKm != nil {
		distance = *rp.ActualDistanceKm
	}

	bonus := rideBonusPercentage
	if rp.BonusPercentage != nil {
		bonus = *rp.BonusPercentage
	}

	rp.FinalDistanceKm = distance * (1 + bonus/100)
}
