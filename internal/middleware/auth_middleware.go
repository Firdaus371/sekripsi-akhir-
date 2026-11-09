package middleware

import (
	"net/http"
	"strings"

	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/Firdaus371/student-voice-api/pkg/utils"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware mewajibkan Bearer token valid
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization format must be Bearer {token}"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// OptionalAuthMiddleware mengekstrak token jika ada, tetapi tidak memblokir request jika tidak ada token
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				if claims, err := utils.ValidateToken(parts[1]); err == nil {
					c.Set("user_id", claims.UserID)
					c.Set("role", claims.Role)
				}
			}
		}
		c.Next()
	}
}

// RequireRoles memeriksa apakah peran pengguna yang sedang login termasuk salah satu dari peran yang diizinkan
func RequireRoles(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: peran tidak terdeteksi"})
			c.Abort()
			return
		}

		userRole, ok := roleVal.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: tipe peran tidak valid"})
			c.Abort()
			return
		}

		// Superadmin selalu memiliki bypass akses tertinggi
		if userRole == model.RoleAdmin {
			c.Next()
			return
		}

		for _, allowed := range roles {
			if userRole == allowed {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error": "Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini",
		})
		c.Abort()
	}
}

// AdminOnly pembungkus khusus Super Admin
func AdminOnly() gin.HandlerFunc {
	return RequireRoles(model.RoleAdmin)
}
