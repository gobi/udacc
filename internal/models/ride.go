package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RideStatus string

const (
	RideStatusDraft     RideStatus = "draft"
	RideStatusPublished RideStatus = "published"
	RideStatusOngoing   RideStatus = "ongoing"
	RideStatusCompleted RideStatus = "completed"
	RideStatusCancelled RideStatus = "cancelled"
)

type Ride struct {
	ID              uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Title           string         `gorm:"size:255;not null" json:"title"`
	Description     string         `gorm:"type:text" json:"description"`
	RideTypeID      uint           `gorm:"not null" json:"ride_type_id"`
	RideType        RideType       `gorm:"foreignKey:RideTypeID" json:"ride_type,omitempty"`
	CreatedByID     uuid.UUID      `gorm:"type:uuid;not null" json:"created_by_id"`
	CreatedBy       User           `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
	LeaderID        *uuid.UUID     `gorm:"type:uuid" json:"leader_id"`
	Leader          *User          `gorm:"foreignKey:LeaderID" json:"leader,omitempty"`
	GPXFileURL      string         `gorm:"size:500" json:"gpx_file_url"`
	DistanceKm      float64        `gorm:"type:decimal(10,2);default:0" json:"distance_km"`
	ElevationGain   float64        `gorm:"type:decimal(10,2);default:0" json:"elevation_gain"`
	MaxGradient     float64        `gorm:"type:decimal(5,2);default:0" json:"max_gradient"`
	MaxDescent      float64        `gorm:"type:decimal(5,2);default:0" json:"max_descent"`
	PassCount       int            `gorm:"default:0" json:"pass_count"`
	StartTime       *time.Time     `json:"start_time"`
	MeetingPointName string        `gorm:"size:255" json:"meeting_point_name"`
	MeetingPointLat  *float64      `gorm:"type:decimal(10,8)" json:"meeting_point_lat"`
	MeetingPointLng  *float64      `gorm:"type:decimal(11,8)" json:"meeting_point_lng"`
	Status          RideStatus     `gorm:"size:20;default:'draft'" json:"status"`
	BonusPercentage float64        `gorm:"type:decimal(5,2);default:0" json:"bonus_percentage"`
	StartedAt       *time.Time     `json:"started_at"`
	CompletedAt     *time.Time     `json:"completed_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	Participants    []RideParticipant `gorm:"foreignKey:RideID" json:"participants,omitempty"`
}

type RideResponse struct {
	ID               uuid.UUID     `json:"id"`
	Title            string        `json:"title"`
	Description      string        `json:"description"`
	RideTypeID       uint          `json:"ride_type_id"`
	RideType         *RideType     `json:"ride_type,omitempty"`
	CreatedByID      uuid.UUID     `json:"created_by_id"`
	CreatedBy        *UserResponse `json:"created_by,omitempty"`
	LeaderID         *uuid.UUID    `json:"leader_id"`
	Leader           *UserResponse `json:"leader,omitempty"`
	GPXFileURL       string        `json:"gpx_file_url,omitempty"`
	DistanceKm       float64       `json:"distance_km"`
	ElevationGain    float64       `json:"elevation_gain"`
	MaxGradient      float64       `json:"max_gradient"`
	MaxDescent       float64       `json:"max_descent"`
	PassCount        int           `json:"pass_count"`
	StartTime        *time.Time    `json:"start_time"`
	MeetingPointName string        `json:"meeting_point_name"`
	MeetingPointLat  *float64      `json:"meeting_point_lat"`
	MeetingPointLng  *float64      `json:"meeting_point_lng"`
	Status           RideStatus    `json:"status"`
	BonusPercentage  float64       `json:"bonus_percentage"`
	StartedAt        *time.Time    `json:"started_at"`
	CompletedAt      *time.Time    `json:"completed_at"`
	ParticipantCount int           `json:"participant_count"`
	CreatedAt        time.Time     `json:"created_at"`
}

func (r *Ride) ToResponse(viewerIsAdmin bool) RideResponse {
	resp := RideResponse{
		ID:               r.ID,
		Title:            r.Title,
		Description:      r.Description,
		RideTypeID:       r.RideTypeID,
		CreatedByID:      r.CreatedByID,
		LeaderID:         r.LeaderID,
		GPXFileURL:       r.GPXFileURL,
		DistanceKm:       r.DistanceKm,
		ElevationGain:    r.ElevationGain,
		MaxGradient:      r.MaxGradient,
		MaxDescent:       r.MaxDescent,
		PassCount:        r.PassCount,
		StartTime:        r.StartTime,
		MeetingPointName: r.MeetingPointName,
		MeetingPointLat:  r.MeetingPointLat,
		MeetingPointLng:  r.MeetingPointLng,
		Status:           r.Status,
		BonusPercentage:  r.BonusPercentage,
		StartedAt:        r.StartedAt,
		CompletedAt:      r.CompletedAt,
		ParticipantCount: len(r.Participants),
		CreatedAt:        r.CreatedAt,
	}

	if r.RideType.ID != 0 {
		resp.RideType = &r.RideType
	}

	if r.CreatedBy.ID != uuid.Nil {
		createdByResp := r.CreatedBy.ToResponse(viewerIsAdmin)
		resp.CreatedBy = &createdByResp
	}

	if r.Leader != nil && r.Leader.ID != uuid.Nil {
		leaderResp := r.Leader.ToResponse(viewerIsAdmin)
		resp.Leader = &leaderResp
	}

	return resp
}
