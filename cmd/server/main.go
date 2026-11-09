package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/Firdaus371/student-voice-api/internal/config"
	"github.com/Firdaus371/student-voice-api/internal/handler"
	"github.com/Firdaus371/student-voice-api/internal/repository"
	"github.com/Firdaus371/student-voice-api/internal/routes"
	"github.com/Firdaus371/student-voice-api/internal/service"
)

// @title           Student Voice API
// @version         1.0
// @description     Dokumentasi API untuk Aplikasi Student Voice (Skripsi).
// @termsOfService  http://swagger.io/terms/

// @contact.name    Tim Pengembang
// @contact.email   support@studentvoice.com

// @license.name    Apache 2.0
// @license.url     http://www.apache.org/licenses/LICENSE-2.0.html

// @host            localhost:8080
// @BasePath        /
func main() {
	log.Println("🚀 Starting Student Voice API...")

	// ======================
	// INIT DATABASE
	// ======================
	db := config.InitDB()
	defer db.Close()

	// ======================
	// REPOSITORY (GUDANG)
	// ======================
	aspRepo := repository.NewAspirationRepository(db)
	voteRepo := repository.NewVoteRepository(db)
	userRepo := repository.NewUserRepository(db)

	// ======================
	// SERVICE (OTAK)
	// ======================
	aspService := service.NewAspirationService(aspRepo)
	voteService := service.NewVoteService(voteRepo)
	userService := service.NewUserService(userRepo)

	// ======================
	// HANDLER (PELAYAN)
	// ======================
	aspHandler := handler.NewAspirationHandler(aspService)
	voteHandler := handler.NewVoteHandler(voteService)
	authHandler := handler.NewAuthHandler(userService)

	// ======================
	// ROUTER (PINTU MASUK)
	// ======================
	r := gin.Default()

	// ⚠️ PENTING: Jangan pasang CORS disini lagi.
	// Kita sudah pasang CORS yang lebih lengkap di file routes.go

	// DAFTARKAN SEMUA ROUTE
	routes.RegisterRoutes(r, aspHandler, voteHandler, authHandler)

	log.Println("🔥 Server running at :8080")
	r.Run(":8080")
}