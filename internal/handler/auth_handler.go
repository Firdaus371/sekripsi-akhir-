package handler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/Firdaus371/student-voice-api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// --- DEFINISI INPUT & OUTPUT ---

// INPUT REGISTRASI PENGGUNA (6 PERAN OLEH ADMIN)
type RegisterInput struct {
	Name     string `json:"name" binding:"required" example:"Budi Santoso"`
	Email    string `json:"email" binding:"required,email" example:"budi@mthuda.sch.id"`
	Password string `json:"password" binding:"required,min=6" example:"password123"`
	Role     string `json:"role" example:"siswa"` // siswa, admin, guru_bk, waka_kesiswaan, waka_kurikulum, kepala_sekolah
	NIS      string `json:"nis" example:"20260001"`
	NIP      string `json:"nip" example:"198001012010011001"`
	Phone    string `json:"phone" example:"08123456789"`
	Kelas    string `json:"kelas" example:"IX-A"`
	Gender   string `json:"gender" example:"Laki-laki"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required" example:"siswa@mthuda.sch.id"`
	Password string `json:"password" binding:"required" example:"password123"`
}

type ResetPasswordInput struct {
	NewPassword string `json:"new_password" binding:"required,min=6" example:"passwordBaru123"`
}

// OUTPUT
type RegisterResponse struct {
	Message string `json:"message" example:"Pengguna berhasil didaftarkan!"`
	Email   string `json:"email" example:"budi@mthuda.sch.id"`
	Role    string `json:"role" example:"siswa"`
}

type LoginResponse struct {
	Token string      `json:"token" example:"eyJhbGciOiJIUzI1Ni..."`
	User  *model.User `json:"user"`
}

type ErrorResponse struct {
	Error string `json:"error" example:"Input tidak valid"`
}

type AuthHandler struct {
	service service.UserService
}

func NewAuthHandler(service service.UserService) *AuthHandler {
	return &AuthHandler{service: service}
}

// Register (Oleh Superadmin untuk 6 Peran)
func (h *AuthHandler) Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
		return
	}

	role := input.Role
	if role == "" {
		role = model.RoleSiswa
	}

	user := model.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: input.Password,
		Role:     role,
		NIS:      input.NIS,
		NIP:      input.NIP,
		Phone:    input.Phone,
		Kelas:    input.Kelas,
		Gender:   input.Gender,
	}

	if err := h.service.Register(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal registrasi: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, RegisterResponse{
		Message: "Pengguna berhasil didaftarkan!",
		Email:   input.Email,
		Role:    role,
	})
}

// Login
func (h *AuthHandler) Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input salah: " + err.Error()})
		return
	}

	token, err := h.service.Login(input.Email, input.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau kata sandi salah"})
		return
	}

	user, _ := h.service.GetUserDetails(input.Email)

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User:  user,
	})
}

// UploadAvatar
func (h *AuthHandler) UploadAvatar(c *gin.Context) {
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File tidak ada"})
		return
	}

	userID := c.GetInt("user_id")
	filename := strconv.Itoa(userID) + "_" + uuid.New().String() + filepath.Ext(file.Filename)
	path := "uploads/" + filename

	if err := c.SaveUploadedFile(file, path); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan gambar"})
		return
	}

	avatarURL := "/" + path
	h.service.UpdateAvatar(userID, avatarURL)

	c.JSON(http.StatusOK, gin.H{"avatar_url": avatarURL})
}

// GetAllUsers (Superadmin)
func (h *AuthHandler) GetAllUsers(c *gin.Context) {
	users, err := h.service.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal ambil data pengguna: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

// DeleteUser (Superadmin)
func (h *AuthHandler) DeleteUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	if err := h.service.DeleteUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus pengguna: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pengguna berhasil dihapus"})
}

// ResetPassword (Superadmin)
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	var input ResetPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid: " + err.Error()})
		return
	}

	if err := h.service.ResetPassword(id, input.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal reset kata sandi: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kata sandi pengguna berhasil di-reset"})
}

// UpdateProfile (Mandiri oleh user yang sedang login)
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetInt("user_id")

	name := c.PostForm("name")
	nis := c.PostForm("nis")
	nip := c.PostForm("nip")
	email := c.PostForm("email")
	phone := c.PostForm("phone")
	kelas := c.PostForm("kelas")
	gender := c.PostForm("gender")
	oldPassword := c.PostForm("old_password")
	newPassword := c.PostForm("new_password")

	var avatarURL string
	file, err := c.FormFile("avatar")
	if err == nil {
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("profile_%d_%d%s", userID, time.Now().UnixNano(), ext)
		path := "/uploads/" + filename
		if err := c.SaveUploadedFile(file, "."+path); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan foto"})
			return
		}
		avatarURL = path
	}

	err = h.service.UpdateProfile(userID, name, nis, nip, email, oldPassword, newPassword, avatarURL, phone, kelas, gender)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedUser, _ := h.service.GetUserDetails(email)
	c.JSON(http.StatusOK, gin.H{"message": "Profil diperbarui", "user": updatedUser})
}
