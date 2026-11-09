package service

import (
	"errors"
	"strings"

	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/Firdaus371/student-voice-api/internal/repository"
)

type AspirationService interface {
	Create(asp *model.Aspiration) error
	GetAll() ([]model.Aspiration, error)
	GetForRole(role string) ([]model.Aspiration, error)
	GetByID(id int) (*model.Aspiration, error)
	UpdateStatus(id int, status string, userRole string) error
	Reply(aspirationID int, message string, imageURL string, responderID int, userRole string) error
	Delete(id int, userRole string) error
	GetStats(role string) (*repository.DashboardStats, error)

	AddComment(aspirationID int, userID int, content string) error
	GetComments(aspirationID int) ([]repository.CommentData, error)
}

type aspirationService struct {
	repo *repository.AspirationRepository
}

func NewAspirationService(repo *repository.AspirationRepository) AspirationService {
	return &aspirationService{repo: repo}
}

// Helper: kategori yang dikelola masing-masing peran pejabat
func GetCategoriesByRole(role string) []string {
	switch role {
	case model.RoleGuruBK:
		return []string{"Konseling"}
	case model.RoleWakaKurikulum:
		return []string{"Akademik"}
	case model.RoleWakaKesiswaan:
		return []string{"Keamanan", "Kesiswaan/OSIS", "Fasilitas Sekolah"}
	default:
		return nil
	}
}

// Helper: cek apakah peran berhak menangani kategori laporan
func CanRoleHandleCategory(role, category string) bool {
	if role == model.RoleAdmin || role == model.RoleKepalaSekolah {
		return true // Superadmin dan Kepala Sekolah memiliki hak akses menyeluruh
	}

	allowedCats := GetCategoriesByRole(role)
	for _, c := range allowedCats {
		if strings.EqualFold(c, category) {
			return true
		}
	}
	return false
}

func (s *aspirationService) Create(asp *model.Aspiration) error {
	return s.repo.Create(asp)
}

func (s *aspirationService) GetAll() ([]model.Aspiration, error) {
	return s.repo.GetAll()
}

// GetForRole memfilter pengaduan yang tampil berdasarkan wewenang peran
func (s *aspirationService) GetForRole(role string) ([]model.Aspiration, error) {
	switch role {
	case model.RoleGuruBK, model.RoleWakaKesiswaan, model.RoleWakaKurikulum:
		cats := GetCategoriesByRole(role)
		return s.repo.GetByCategories(cats)
	default:
		// Admin, Kepala Sekolah, atau Siswa/Publik melihat daftar lengkap
		return s.repo.GetAll()
	}
}

func (s *aspirationService) GetByID(id int) (*model.Aspiration, error) {
	return s.repo.GetByID(id)
}

// UpdateStatus memverifikasi wewenang sebelum mengubah status
func (s *aspirationService) UpdateStatus(id int, status string, userRole string) error {
	// Validasi nilai status
	if status != model.StatusMenunggu && status != model.StatusDiproses && status != model.StatusSelesai {
		return errors.New("status tidak valid (pilihan: Menunggu, Diproses, Selesai)")
	}

	asp, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	if !CanRoleHandleCategory(userRole, asp.Category) {
		return errors.New("akses ditolak: Anda tidak memiliki wewenang untuk menindaklanjuti pengaduan kategori " + asp.Category)
	}

	return s.repo.UpdateStatus(id, status)
}

// Reply memverifikasi wewenang sebelum memberi balasan tanggapan
func (s *aspirationService) Reply(aspirationID int, message string, imageURL string, responderID int, userRole string) error {
	asp, err := s.repo.GetByID(aspirationID)
	if err != nil {
		return err
	}

	if !CanRoleHandleCategory(userRole, asp.Category) {
		return errors.New("akses ditolak: Anda tidak memiliki wewenang memberi tanggapan pada pengaduan kategori " + asp.Category)
	}

	return s.repo.Reply(aspirationID, message, imageURL, responderID)
}

// Delete hanya dapat dilakukan oleh Superadmin untuk membersihkan laporan spam/palsu
func (s *aspirationService) Delete(id int, userRole string) error {
	if userRole != model.RoleAdmin {
		return errors.New("akses ditolak: hanya Superadmin yang berwenang menghapus laporan")
	}
	return s.repo.Delete(id)
}

func (s *aspirationService) GetStats(role string) (*repository.DashboardStats, error) {
	switch role {
	case model.RoleGuruBK, model.RoleWakaKesiswaan, model.RoleWakaKurikulum:
		cats := GetCategoriesByRole(role)
		return s.repo.GetStats(cats)
	default:
		// Admin, Kepala Sekolah, atau Siswa/Publik melihat statistik menyeluruh
		return s.repo.GetStats(nil)
	}
}

func (s *aspirationService) AddComment(aspirationID int, userID int, content string) error {
	return s.repo.AddComment(aspirationID, userID, content)
}

func (s *aspirationService) GetComments(aspirationID int) ([]repository.CommentData, error) {
	return s.repo.GetComments(aspirationID)
}
