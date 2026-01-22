package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/udacc/uda-cycling-club/internal/handlers"
	"github.com/udacc/uda-cycling-club/internal/middleware"
)

func Setup(app *fiber.App) {
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})

	api := app.Group("/api/v1")

	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Post("/facebook", handlers.FacebookLogin)
	auth.Post("/refresh", handlers.RefreshToken)
	auth.Get("/me", middleware.AuthRequired(), handlers.GetMe)
	auth.Put("/me", middleware.AuthRequired(), handlers.UpdateMe)
	auth.Post("/change-password", middleware.AuthRequired(), handlers.ChangePassword)

	users := api.Group("/users")
	users.Get("/", handlers.ListUsers)
	users.Get("/leaderboard", handlers.GetLeaderboard)
	users.Get("/statistics", handlers.GetStatistics)
	users.Get("/ride-leaders", handlers.GetRideLeaders)
	users.Get("/:id", handlers.GetUser)
	users.Get("/:id/rides", handlers.GetUserRides)
	users.Put("/:id/role", middleware.AuthRequired(), middleware.AdminRequired(), handlers.UpdateUserRole)

	rides := api.Group("/rides")
	rides.Get("/", handlers.ListRides)
	rides.Get("/types", handlers.GetRideTypes)
	rides.Post("/parse-gpx", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.ParseGPXPreview)
	rides.Get("/:id", handlers.GetRide)
	rides.Post("/", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.CreateRide)
	rides.Put("/:id", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.UpdateRide)
	rides.Delete("/:id", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.DeleteRide)
	rides.Post("/:id/gpx", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.UploadGPX)
	rides.Get("/:id/route", handlers.GetRoutePoints)
	rides.Post("/:id/publish", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.PublishRide)
	rides.Post("/:id/start", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.StartRide)
	rides.Post("/:id/complete", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.CompleteRide)

	rides.Post("/:id/register", middleware.AuthRequired(), handlers.RegisterForRide)
	rides.Delete("/:id/register", middleware.AuthRequired(), handlers.UnregisterFromRide)
	rides.Get("/:id/participants", handlers.ListParticipants)
	rides.Put("/:id/participants/:pid", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.UpdateParticipant)
	rides.Post("/:id/participants/:pid/attendance", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.MarkAttendance)
	rides.Post("/:id/participants/bulk-attendance", middleware.AuthRequired(), middleware.RideLeaderRequired(), handlers.BulkAttendance)
}
