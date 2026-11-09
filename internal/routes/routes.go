package routes

import (
	"github.com/Firdaus371/student-voice-api/internal/handler"
	"github.com/Firdaus371/student-voice-api/internal/middleware"
	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/gin-gonic/gin"

	_ "github.com/Firdaus371/student-voice-api/docs"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func RegisterRoutes(r *gin.Engine, aspHandler *handler.AspirationHandler, voteHandler *handler.VoteHandler, authHandler *handler.AuthHandler) {
	r.Use(CORSMiddleware())
	r.Static("/uploads", "./uploads")

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// ======================
	// AUTH ROUTES
	// ======================
	auth := r.Group("/auth")
	auth.POST("/login", authHandler.Login)
	auth.POST("/upload-avatar", middleware.AuthMiddleware(), authHandler.UploadAvatar)
	auth.PUT("/profile", middleware.AuthMiddleware(), authHandler.UpdateProfile)

	// Manajemen Pengguna (KHUSUS SUPERADMIN)
	adminAuth := auth.Group("")
	adminAuth.Use(middleware.AuthMiddleware(), middleware.RequireRoles(model.RoleAdmin))
	{
		adminAuth.GET("/users", authHandler.GetAllUsers)
		adminAuth.POST("/users", authHandler.Register)
		adminAuth.POST("/register-siswa", authHandler.Register) // Alias kompatibilitas
		adminAuth.DELETE("/users/:id", authHandler.DeleteUser)
		adminAuth.PUT("/users/:id/reset-password", authHandler.ResetPassword) // Fitur reset password oleh Admin
	}

	// Alias Manajemen Pengguna di Root /users untuk kompatibilitas frontend
	rootUsers := r.Group("/users")
	rootUsers.Use(middleware.AuthMiddleware(), middleware.RequireRoles(model.RoleAdmin))
	{
		rootUsers.GET("", authHandler.GetAllUsers)
		rootUsers.POST("", authHandler.Register)
		rootUsers.DELETE("/:id", authHandler.DeleteUser)
		rootUsers.PUT("/:id/reset-password", authHandler.ResetPassword)
	}

	// ======================
	// ASPIRATION / PENGADUAN ROUTES
	// ======================
	asp := r.Group("/aspirations")
	// Endpoint publik / semi-privat (mendeteksi peran jika token disertakan)
	asp.GET("", middleware.OptionalAuthMiddleware(), aspHandler.GetAll)
	asp.GET("/:id", middleware.OptionalAuthMiddleware(), aspHandler.GetByID)
	asp.GET("/:id/comments", aspHandler.GetComments)
	asp.GET("/stats", middleware.OptionalAuthMiddleware(), aspHandler.GetStats)

	// Endpoint Pengaduan & Interaksi Siswa (Terproteksi)
	protected := asp.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		// Upload file bukti (foto pengaduan / lampiran)
		protected.POST("/upload", aspHandler.Upload)

		// Membuat pengaduan
		protected.POST("", aspHandler.Create)
		protected.POST("/:id/vote", voteHandler.CreateVote)
		protected.DELETE("/:id/vote", voteHandler.RemoveVote)
		protected.POST("/:id/comments", aspHandler.AddComment)
	}

	// Endpoint Tindak Lanjut Pengaduan (Guru BK, Waka Kesiswaan, Waka Kurikulum, Kepala Sekolah, Superadmin)
	pejabat := asp.Group("")
	pejabat.Use(
		middleware.AuthMiddleware(),
		middleware.RequireRoles(model.RoleGuruBK, model.RoleWakaKesiswaan, model.RoleWakaKurikulum, model.RoleKepalaSekolah, model.RoleAdmin),
	)
	{
		pejabat.PATCH("/:id/status", aspHandler.UpdateStatus)
		pejabat.POST("/:id/reply", aspHandler.Reply)
		pejabat.PUT("/:id/reply", aspHandler.Reply)
	}

	// Endpoint Penghapusan Laporan Spam/Palsu (HANYA SUPERADMIN)
	superAdminOnly := asp.Group("")
	superAdminOnly.Use(middleware.AuthMiddleware(), middleware.RequireRoles(model.RoleAdmin))
	{
		superAdminOnly.DELETE("/:id", aspHandler.Delete)
	}
}
