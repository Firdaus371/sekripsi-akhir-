package model

import "time"

const (
	RoleSiswa         = "siswa"
	RoleAdmin         = "admin"
	RoleGuruBK        = "guru_bk"
	RoleWakaKesiswaan = "waka_kesiswaan"
	RoleWakaKurikulum = "waka_kurikulum"
	RoleKepalaSekolah = "kepala_sekolah"
)

type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	NIS       string    `json:"nis"`
	NIP       string    `json:"nip"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Role      string    `json:"role"`
	AvatarURL string    `json:"avatar_url"`
	Phone     string    `json:"phone"`
	Kelas     string    `json:"kelas"`
	Gender    string    `json:"gender"`
	CreatedAt time.Time `json:"created_at"`
}
