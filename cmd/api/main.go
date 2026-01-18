package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/udacc/uda-cycling-club/internal/config"
	"github.com/udacc/uda-cycling-club/internal/database"
	"github.com/udacc/uda-cycling-club/internal/models"
	"github.com/udacc/uda-cycling-club/internal/routes"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = database.Migrate(db,
		&models.User{},
		&models.RideType{},
		&models.Ride{},
		&models.RideParticipant{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	seedRideTypes()

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
		BodyLimit: int(cfg.MaxFileSize),
	})

	routes.Setup(app)

	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}

func seedRideTypes() {
	for _, rt := range models.DefaultRideTypes {
		var existing models.RideType
		if err := database.DB.Where("id = ?", rt.ID).First(&existing).Error; err != nil {
			database.DB.Create(&rt)
			log.Printf("Seeded ride type: %s", rt.Name)
		}
	}
}
