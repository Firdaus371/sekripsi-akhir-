package repository

import (
	"database/sql"
	"errors"

	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/lib/pq"
)

type AspirationRepository struct {
	DB *sql.DB
}

func NewAspirationRepository(db *sql.DB) *AspirationRepository {
	return &AspirationRepository{DB: db}
}

func (r *AspirationRepository) Create(asp *model.Aspiration) error {
	query := `
		INSERT INTO aspirations (title, content, category, tanggal_pengaduan, bukti_file, anonimitas, status, user_id)
		VALUES ($1, $2, $3, COALESCE(NULLIF($4, '')::date, CURRENT_DATE), $5, $6, 'Menunggu', $7)
		RETURNING id
	`
	return r.DB.QueryRow(query,
		asp.Title,
		asp.Content,
		asp.Category,
		asp.TanggalPengaduan,
		asp.BuktiFile,
		asp.Anonimitas,
		asp.UserID,
	).Scan(&asp.ID)
}

func (r *AspirationRepository) GetAll() ([]model.Aspiration, error) {
	query := `
		SELECT 
			a.id, a.user_id, a.title, a.content, a.category, 
			TO_CHAR(a.tanggal_pengaduan, 'YYYY-MM-DD') as tanggal_pengaduan, 
			COALESCE(a.bukti_file, '') as bukti_file, 
			a.anonimitas, a.status, a.created_at,
			u.name as user_name, COALESCE(u.kelas, '') as user_kelas,
			(SELECT COUNT(*) FROM votes v WHERE v.aspiration_id = a.id)::int as vote_count,
			COALESCE((SELECT message FROM aspiration_responses ar WHERE ar.aspiration_id = a.id ORDER BY ar.created_at DESC LIMIT 1), '') as response,
			COALESCE((SELECT image_url FROM aspiration_responses ar WHERE ar.aspiration_id = a.id ORDER BY ar.created_at DESC LIMIT 1), '') as response_image_url
		FROM aspirations a
		JOIN users u ON a.user_id = u.id
		ORDER BY a.created_at DESC
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	aspirations := []model.Aspiration{}
	for rows.Next() {
		var asp model.Aspiration
		err := rows.Scan(
			&asp.ID, &asp.UserID, &asp.Title, &asp.Content, &asp.Category,
			&asp.TanggalPengaduan, &asp.BuktiFile, &asp.Anonimitas, &asp.Status, &asp.CreatedAt,
			&asp.UserName, &asp.UserKelas,
			&asp.VoteCount, &asp.Response, &asp.ResponseImageURL,
		)
		if err != nil {
			return nil, err
		}
		asp.IsAnonymous = asp.Anonimitas
		aspirations = append(aspirations, asp)
	}
	return aspirations, nil
}

func (r *AspirationRepository) GetByCategories(categories []string) ([]model.Aspiration, error) {
	query := `
		SELECT 
			a.id, a.user_id, a.title, a.content, a.category, 
			TO_CHAR(a.tanggal_pengaduan, 'YYYY-MM-DD') as tanggal_pengaduan, 
			COALESCE(a.bukti_file, '') as bukti_file, 
			a.anonimitas, a.status, a.created_at,
			u.name as user_name, COALESCE(u.kelas, '') as user_kelas,
			(SELECT COUNT(*) FROM votes v WHERE v.aspiration_id = a.id)::int as vote_count,
			COALESCE((SELECT message FROM aspiration_responses ar WHERE ar.aspiration_id = a.id ORDER BY ar.created_at DESC LIMIT 1), '') as response,
			COALESCE((SELECT image_url FROM aspiration_responses ar WHERE ar.aspiration_id = a.id ORDER BY ar.created_at DESC LIMIT 1), '') as response_image_url
		FROM aspirations a
		JOIN users u ON a.user_id = u.id
		WHERE a.category = ANY($1)
		ORDER BY a.created_at DESC
	`
	rows, err := r.DB.Query(query, pq.Array(categories))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	aspirations := []model.Aspiration{}
	for rows.Next() {
		var asp model.Aspiration
		err := rows.Scan(
			&asp.ID, &asp.UserID, &asp.Title, &asp.Content, &asp.Category,
			&asp.TanggalPengaduan, &asp.BuktiFile, &asp.Anonimitas, &asp.Status, &asp.CreatedAt,
			&asp.UserName, &asp.UserKelas,
			&asp.VoteCount, &asp.Response, &asp.ResponseImageURL,
		)
		if err != nil {
			return nil, err
		}
		asp.IsAnonymous = asp.Anonimitas
		aspirations = append(aspirations, asp)
	}
	return aspirations, nil
}

func (r *AspirationRepository) GetByID(id int) (*model.Aspiration, error) {
	query := `
		SELECT 
			a.id, a.user_id, a.title, a.content, a.category, 
			TO_CHAR(a.tanggal_pengaduan, 'YYYY-MM-DD') as tanggal_pengaduan, 
			COALESCE(a.bukti_file, '') as bukti_file, 
			a.anonimitas, a.status, a.created_at,
			u.name as user_name, COALESCE(u.kelas, '') as user_kelas,
			(SELECT COUNT(*) FROM votes v WHERE v.aspiration_id = a.id)::int as vote_count,
			COALESCE((SELECT message FROM aspiration_responses ar WHERE ar.aspiration_id = a.id ORDER BY ar.created_at DESC LIMIT 1), '') as response,
			COALESCE((SELECT image_url FROM aspiration_responses ar WHERE ar.aspiration_id = a.id ORDER BY ar.created_at DESC LIMIT 1), '') as response_image_url
		FROM aspirations a
		JOIN users u ON a.user_id = u.id
		WHERE a.id = $1
	`
	var asp model.Aspiration
	err := r.DB.QueryRow(query, id).Scan(
		&asp.ID, &asp.UserID, &asp.Title, &asp.Content, &asp.Category,
		&asp.TanggalPengaduan, &asp.BuktiFile, &asp.Anonimitas, &asp.Status, &asp.CreatedAt,
		&asp.UserName, &asp.UserKelas,
		&asp.VoteCount, &asp.Response, &asp.ResponseImageURL,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("pengaduan tidak ditemukan")
		}
		return nil, err
	}
	asp.IsAnonymous = asp.Anonimitas
	return &asp, nil
}

func (r *AspirationRepository) UpdateStatus(id int, newStatus string) error {
	_, err := r.DB.Exec("UPDATE aspirations SET status = $1 WHERE id = $2", newStatus, id)
	return err
}

func (r *AspirationRepository) Reply(aspirationID int, message string, imageURL string, adminID int) error {
	query := "INSERT INTO aspiration_responses (aspiration_id, admin_id, message, image_url) VALUES ($1, $2, $3, $4)"
	_, err := r.DB.Exec(query, aspirationID, adminID, message, imageURL)
	if err != nil {
		return err
	}
	_, err = r.DB.Exec("UPDATE aspirations SET status = 'Diproses' WHERE id = $1 AND status = 'Menunggu'", aspirationID)
	return err
}

func (r *AspirationRepository) Delete(id int) error {
	_, err := r.DB.Exec("DELETE FROM aspirations WHERE id = $1", id)
	return err
}

type DashboardStats struct {
	TotalAspirations int    `json:"total_aspirations"`
	TotalCompleted   int    `json:"total_completed"`
	TotalPending     int    `json:"total_pending"`
	TopCategory      string `json:"top_category"`
	MostVotedTitle   string `json:"most_voted_title"`
	MostVotedTotal   int    `json:"most_voted_total"`
}

func (r *AspirationRepository) GetStats(categories []string) (*DashboardStats, error) {
	var stats DashboardStats

	if len(categories) > 0 {
		// Agregasi RBAC: Hanya menghitung kategori sesuai wewenang peran
		r.DB.QueryRow(`
			SELECT COUNT(*) 
			FROM aspirations 
			WHERE category = ANY($1)
		`, pq.Array(categories)).Scan(&stats.TotalAspirations)

		r.DB.QueryRow(`
			SELECT COUNT(*) 
			FROM aspirations 
			WHERE category = ANY($1) AND (status = 'Menunggu' OR status = 'Diproses')
		`, pq.Array(categories)).Scan(&stats.TotalPending)

		r.DB.QueryRow(`
			SELECT COUNT(*) 
			FROM aspirations 
			WHERE category = ANY($1) AND status = 'Selesai'
		`, pq.Array(categories)).Scan(&stats.TotalCompleted)

		err := r.DB.QueryRow(`
			SELECT category 
			FROM aspirations 
			WHERE category = ANY($1)
			GROUP BY category 
			ORDER BY COUNT(*) DESC 
			LIMIT 1
		`, pq.Array(categories)).Scan(&stats.TopCategory)
		if err != nil {
			stats.TopCategory = "-"
		}

		queryTopVote := `
			SELECT a.title, COUNT(v.id) as total_vote
			FROM aspirations a
			LEFT JOIN votes v ON a.id = v.aspiration_id
			WHERE a.category = ANY($1)
			GROUP BY a.id, a.title
			ORDER BY total_vote DESC LIMIT 1
		`
		err = r.DB.QueryRow(queryTopVote, pq.Array(categories)).Scan(&stats.MostVotedTitle, &stats.MostVotedTotal)
		if err != nil {
			stats.MostVotedTitle = "Belum ada vote"
			stats.MostVotedTotal = 0
		}
	} else {
		// Agregasi Menyeluruh: Super Admin / Kepala Sekolah / Publik
		r.DB.QueryRow("SELECT COUNT(*) FROM aspirations").Scan(&stats.TotalAspirations)
		r.DB.QueryRow("SELECT COUNT(*) FROM aspirations WHERE status = 'Menunggu' OR status = 'Diproses'").Scan(&stats.TotalPending)
		r.DB.QueryRow("SELECT COUNT(*) FROM aspirations WHERE status = 'Selesai'").Scan(&stats.TotalCompleted)

		err := r.DB.QueryRow("SELECT category FROM aspirations GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1").Scan(&stats.TopCategory)
		if err != nil {
			stats.TopCategory = "-"
		}

		queryTopVote := `
			SELECT a.title, COUNT(v.id) as total_vote
			FROM aspirations a
			LEFT JOIN votes v ON a.id = v.aspiration_id
			GROUP BY a.id, a.title
			ORDER BY total_vote DESC LIMIT 1
		`
		err = r.DB.QueryRow(queryTopVote).Scan(&stats.MostVotedTitle, &stats.MostVotedTotal)
		if err != nil {
			stats.MostVotedTitle = "Belum ada vote"
			stats.MostVotedTotal = 0
		}
	}

	return &stats, nil
}

type CommentData struct {
	ID        int    `json:"id"`
	UserName  string `json:"user_name"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

func (r *AspirationRepository) AddComment(aspirationID int, userID int, content string) error {
	_, err := r.DB.Exec("INSERT INTO comments (aspiration_id, user_id, content) VALUES ($1, $2, $3)", aspirationID, userID, content)
	return err
}

func (r *AspirationRepository) GetComments(aspirationID int) ([]CommentData, error) {
	rows, err := r.DB.Query(`SELECT c.id, u.name, c.content, TO_CHAR(c.created_at, 'DD Mon HH24:MI') FROM comments c JOIN users u ON c.user_id = u.id WHERE c.aspiration_id = $1 ORDER BY c.created_at ASC`, aspirationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []CommentData
	for rows.Next() {
		var c CommentData
		rows.Scan(&c.ID, &c.UserName, &c.Content, &c.CreatedAt)
		comments = append(comments, c)
	}
	return comments, nil
}
