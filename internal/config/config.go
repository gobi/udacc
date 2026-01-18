package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port string
	Env  string

	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	JWTSecret            string
	JWTExpiryHours       int
	JWTRefreshExpiryDays int

	UploadDir   string
	MaxFileSize int64
}

var AppConfig *Config

func Load() (*Config, error) {
	godotenv.Load()

	jwtExpiryHours, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	jwtRefreshExpiryDays, _ := strconv.Atoi(getEnv("JWT_REFRESH_EXPIRY_DAYS", "7"))
	maxFileSize, _ := strconv.ParseInt(getEnv("MAX_FILE_SIZE", "10485760"), 10, 64)

	AppConfig = &Config{
		Port: getEnv("PORT", "3000"),
		Env:  getEnv("ENV", "development"),

		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "uda_cycling"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		JWTSecret:            getEnv("JWT_SECRET", "default-secret-key"),
		JWTExpiryHours:       jwtExpiryHours,
		JWTRefreshExpiryDays: jwtRefreshExpiryDays,

		UploadDir:   getEnv("UPLOAD_DIR", "./uploads"),
		MaxFileSize: maxFileSize,
	}

	return AppConfig, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func (c *Config) GetDSN() string {
	return "host=" + c.DBHost +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" port=" + c.DBPort +
		" sslmode=" + c.DBSSLMode +
		" TimeZone=Asia/Ulaanbaatar"
}
