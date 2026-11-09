package model

import "time"

const (
	StatusMenunggu = "Menunggu"
	StatusDiproses = "Diproses"
	StatusSelesai  = "Selesai"
)

type Aspiration struct {
	ID               int       `json:"id"`
	UserID           int       `json:"user_id"`
	UserName         string    `json:"user_name"`
	UserKelas        string    `json:"user_kelas"`
	Title            string    `json:"title"`
	Content          string    `json:"content"`
	Category         string    `json:"category"`
	TanggalPengaduan string    `json:"tanggal_pengaduan"`
	BuktiFile        string    `json:"bukti_file"`
	Anonimitas       bool      `json:"anonimitas"`
	IsAnonymous      bool      `json:"is_anonymous"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
	VoteCount        int       `json:"vote_count"`
	Response         string    `json:"response"`
	ResponseImageURL string    `json:"response_image_url"`
}
