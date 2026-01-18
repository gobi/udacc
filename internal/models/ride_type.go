package models

import (
	"time"
)

type RideType struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"uniqueIndex;size:100;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

var DefaultRideTypes = []RideType{
	{ID: 1, Name: "Жийлт", Description: "Богино зайн жийлт", SortOrder: 1},
	{ID: 2, Name: "Оройн жийлт", Description: "Оройн цагийн жийлт", SortOrder: 2},
	{ID: 3, Name: "Өдрийн аялал", Description: "Нэг өдрийн аялал", SortOrder: 3},
	{ID: 4, Name: "Хоногийн аялал", Description: "Нэг хоногийн аялал", SortOrder: 4},
	{ID: 5, Name: "Олон хоногийн аялал", Description: "Олон хоногийн урт аялал", SortOrder: 5},
}
