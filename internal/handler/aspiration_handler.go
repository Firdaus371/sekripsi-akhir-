package handler

import (
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/Firdaus371/student-voice-api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AspirationHandler struct {
	service service.AspirationService
}

func NewAspirationHandler(service service.AspirationService) *AspirationHandler {
	return &AspirationHandler{service: service}
}

// 1. CREATE ASPIRATION (Pengaduan oleh Siswa)
func (h *AspirationHandler) Create(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Autentikasi diperlukan"})
		return
	}

	var title, content, category, tanggalPengaduan, buktiPath string
	var anonimitas bool

	contentType := c.GetHeader("Content-Type")
	if strings.Contains(contentType, "application/json") {
		var req struct {
			Title            string `json:"title"`
			Content          string `json:"content"`
			Category         string `json:"category"`
			TanggalPengaduan string `json:"tanggal_pengaduan"`
			TanggalKejadian  string `json:"tanggal_kejadian"`
			BuktiFile        string `json:"bukti_file"`
			Anonimitas       *bool  `json:"anonimitas"`
			IsAnonymous      *bool  `json:"is_anonymous"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
			return
		}
		title = req.Title
		content = req.Content
		category = req.Category
		tanggalPengaduan = req.TanggalPengaduan
		if tanggalPengaduan == "" {
			tanggalPengaduan = req.TanggalKejadian
		}
		buktiPath = req.BuktiFile
		if req.Anonimitas != nil {
			anonimitas = *req.Anonimitas
		} else if req.IsAnonymous != nil {
			anonimitas = *req.IsAnonymous
		}
	} else {
		title = c.PostForm("title")
		content = c.PostForm("content")
		category = c.PostForm("category")

		tanggalPengaduan = c.PostForm("tanggal_pengaduan")
		if tanggalPengaduan == "" {
			tanggalPengaduan = c.PostForm("tanggal_kejadian")
		}

		anonStr := c.PostForm("anonimitas")
		if anonStr == "" {
			anonStr = c.PostForm("is_anonymous")
		}
		anonimitas, _ = strconv.ParseBool(anonStr)
		buktiPath = c.PostForm("bukti_file")

		// Simpan bukti file jika ada
		file, err := c.FormFile("bukti_file")
		if err != nil {
			file, err = c.FormFile("images")
		}
		if err == nil {
			_ = os.MkdirAll("./uploads", 0755)
			ext := filepath.Ext(file.Filename)
			filename := fmt.Sprintf("bukti_%d_%d%s", userID, time.Now().UnixNano(), ext)
			path := "/uploads/" + filename
			if err := c.SaveUploadedFile(file, "."+path); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file bukti: " + err.Error()})
				return
			}
			buktiPath = path
		}
	}

	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)
	category = strings.TrimSpace(category)
	if title == "" || content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Judul dan isi pengaduan wajib diisi"})
		return
	}
	if category == "" {
		category = "Akademik"
	}

	asp := model.Aspiration{
		UserID:           userID,
		Title:            title,
		Content:          content,
		Category:         category,
		TanggalPengaduan: tanggalPengaduan,
		BuktiFile:        buktiPath,
		Anonimitas:       anonimitas,
		IsAnonymous:      anonimitas,
	}

	if err := h.service.Create(&asp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengirim pengaduan: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Pengaduan & bukti berhasil dikirim", "data": asp})
}

// 2. GET ALL (Dengan Pemilahan Hak Akses Sesuai Peran)
func (h *AspirationHandler) GetAll(c *gin.Context) {
	role := c.GetString("role")

	aspirations, err := h.service.GetForRole(role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Privasi Anonimitas: HANYA Super Admin (RoleAdmin) yang berhak melihat identitas asli jika anonimitas = true.
	// Untuk role lain (Guru BK, Waka, Kepsek, Siswa, atau Publik), identitas disamarkan total menjadi "Anonim" & "-".
	isSuperAdmin := role == model.RoleAdmin
	for i := range aspirations {
		aspirations[i].IsAnonymous = aspirations[i].Anonimitas
		if aspirations[i].Anonimitas && !isSuperAdmin {
			aspirations[i].UserName = "Anonim"
			aspirations[i].UserKelas = "-"
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": aspirations})
}

// 3. GET BY ID
func (h *AspirationHandler) GetByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	asp, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengaduan tidak ditemukan"})
		return
	}

	role := c.GetString("role")
	isSuperAdmin := role == model.RoleAdmin
	asp.IsAnonymous = asp.Anonimitas
	if asp.Anonimitas && !isSuperAdmin {
		asp.UserName = "Anonim"
		asp.UserKelas = "-"
	}

	c.JSON(http.StatusOK, gin.H{"data": asp})
}

// 4. UPDATE STATUS (Hanya Pejabat yang Berwenang Sesuai Kategori atau Superadmin)
func (h *AspirationHandler) UpdateStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	userRole := c.GetString("role")

	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status wajib diisi (pilihan: Menunggu, Diproses, Selesai)"})
		return
	}

	if err := h.service.UpdateStatus(id, input.Status, userRole); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status pengaduan berhasil diperbarui"})
}

// 5. REPLY (Pemberian Tanggapan & Bukti oleh Pejabat Berwenang)
func (h *AspirationHandler) Reply(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	userRole := c.GetString("role")
	responderID := c.GetInt("user_id")

	var message, imagePath string
	contentType := c.GetHeader("Content-Type")

	if strings.Contains(contentType, "application/json") {
		var req struct {
			Response         string `json:"response"`
			Message          string `json:"message"`
			ResponseImageURL string `json:"response_image_url"`
			ImageURL         string `json:"image_url"`
		}
		if err := c.ShouldBindJSON(&req); err == nil {
			message = req.Response
			if message == "" {
				message = req.Message
			}
			imagePath = req.ResponseImageURL
			if imagePath == "" {
				imagePath = req.ImageURL
			}
		}
	} else {
		message = c.PostForm("message")
		if message == "" {
			message = c.PostForm("response")
		}
		imagePath = c.PostForm("image_url")
		if imagePath == "" {
			imagePath = c.PostForm("response_image_url")
		}

		file, err := c.FormFile("image")
		if err != nil {
			file, err = c.FormFile("images")
		}
		if err == nil {
			_ = os.MkdirAll("./uploads", 0755)
			ext := filepath.Ext(file.Filename)
			filename := fmt.Sprintf("reply_%d_%s%s", id, uuid.New().String(), ext)
			path := "/uploads/" + filename
			if err := c.SaveUploadedFile(file, "."+path); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file bukti tanggapan"})
				return
			}
			imagePath = path
		}
	}

	if strings.TrimSpace(message) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pesan tanggapan wajib diisi"})
		return
	}

	if err := h.service.Reply(id, message, imagePath, responderID, userRole); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tanggapan & bukti berhasil dikirim"})
}

// UPLOAD ASPIRATION MEDIA (Upload File Bukti Pengaduan / Tanggapan)
func (h *AspirationHandler) Upload(c *gin.Context) {
	_ = os.MkdirAll("./uploads", 0755)
	var imageUrls []string

	form, err := c.MultipartForm()
	if err == nil && form != nil {
		var files []*multipart.FileHeader
		for _, key := range []string{"images", "image", "bukti_file", "file"} {
			if fList, exists := form.File[key]; exists && len(fList) > 0 {
				files = append(files, fList...)
			}
		}
		for _, file := range files {
			ext := filepath.Ext(file.Filename)
			filename := fmt.Sprintf("upload_%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
			path := "/uploads/" + filename
			if err := c.SaveUploadedFile(file, "."+path); err == nil {
				imageUrls = append(imageUrls, path)
			}
		}
	} else {
		for _, key := range []string{"images", "image", "bukti_file", "file"} {
			file, err := c.FormFile(key)
			if err == nil && file != nil {
				ext := filepath.Ext(file.Filename)
				filename := fmt.Sprintf("upload_%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
				path := "/uploads/" + filename
				if err := c.SaveUploadedFile(file, "."+path); err == nil {
					imageUrls = append(imageUrls, path)
				}
				break
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "File berhasil diunggah",
		"image_urls": imageUrls,
	})
}

// 6. DELETE (Khusus Superadmin untuk menghapus spam / laporan palsu)
func (h *AspirationHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	userRole := c.GetString("role")

	if err := h.service.Delete(id, userRole); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pengaduan berhasil dihapus"})
}

// 7. GET STATS
func (h *AspirationHandler) GetStats(c *gin.Context) {
	role := c.GetString("role")
	stats, err := h.service.GetStats(role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat statistik: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// 8. ADD COMMENT
func (h *AspirationHandler) AddComment(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	userID := c.GetInt("user_id")
	var input struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.service.AddComment(id, userID, input.Content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengirim komentar"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Komentar berhasil dikirim"})
}

// 9. GET COMMENTS
func (h *AspirationHandler) GetComments(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	comments, err := h.service.GetComments(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": comments})
}
