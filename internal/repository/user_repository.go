package repository

import (
	"database/sql"

	"github.com/Firdaus371/student-voice-api/internal/model"
)

type UserRepository struct {
	DB *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{DB: db}
}

// Create User (Registrasi oleh Admin untuk 6 peran)
func (r *UserRepository) Create(user *model.User) error {
	role := user.Role
	if role == "" {
		role = model.RoleSiswa
	}

	query := `
		INSERT INTO users (name, nis, nip, email, password, role, phone, kelas, gender) 
		VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), $4, $5, $6, $7, $8, $9) 
		RETURNING id
	`
	return r.DB.QueryRow(query,
		user.Name, user.NIS, user.NIP, user.Email, user.Password,
		role, user.Phone, user.Kelas, user.Gender,
	).Scan(&user.ID)
}

// FindByEmail (Login)
func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	query := `
		SELECT id, name, COALESCE(nis, ''), COALESCE(nip, ''), email, password, role, avatar_url, 
		       COALESCE(phone, ''), COALESCE(kelas, ''), COALESCE(gender, '') 
		FROM users WHERE email = $1
	`
	var user model.User
	err := r.DB.QueryRow(query, email).Scan(
		&user.ID, &user.Name, &user.NIS, &user.NIP, &user.Email, &user.Password,
		&user.Role, &user.AvatarURL, &user.Phone, &user.Kelas, &user.Gender,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateAvatar
func (r *UserRepository) UpdateAvatar(userID int, avatarURL string) error {
	_, err := r.DB.Exec("UPDATE users SET avatar_url = $1 WHERE id = $2", avatarURL, userID)
	return err
}

// GetAll (Admin)
func (r *UserRepository) GetAll() ([]model.User, error) {
	query := `
		SELECT id, name, COALESCE(nis, ''), COALESCE(nip, ''), email, role, avatar_url, 
		       COALESCE(phone, ''), COALESCE(kelas, ''), COALESCE(gender, '') 
		FROM users ORDER BY created_at DESC
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(
			&u.ID, &u.Name, &u.NIS, &u.NIP, &u.Email, &u.Role, &u.AvatarURL,
			&u.Phone, &u.Kelas, &u.Gender,
		); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

// Delete (Admin)
func (r *UserRepository) Delete(id int) error {
	_, err := r.DB.Exec("DELETE FROM users WHERE id = $1", id)
	return err
}

// GetByID
func (r *UserRepository) GetByID(id int) (*model.User, error) {
	query := `
		SELECT id, name, COALESCE(nis, ''), COALESCE(nip, ''), email, password, role, avatar_url, 
		       COALESCE(phone, ''), COALESCE(kelas, ''), COALESCE(gender, '')
		FROM users WHERE id = $1
	`
	var user model.User
	err := r.DB.QueryRow(query, id).Scan(
		&user.ID, &user.Name, &user.NIS, &user.NIP, &user.Email, &user.Password,
		&user.Role, &user.AvatarURL, &user.Phone, &user.Kelas, &user.Gender,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Update (Profil Siswa / Pegawai)
func (r *UserRepository) Update(user *model.User) error {
	query := `
		UPDATE users 
		SET name = $1, nis = NULLIF($2, ''), nip = NULLIF($3, ''), email = $4, password = $5, avatar_url = $6, 
		    phone = $7, kelas = $8, gender = $9
		WHERE id = $10
	`
	_, err := r.DB.Exec(query,
		user.Name, user.NIS, user.NIP, user.Email, user.Password, user.AvatarURL,
		user.Phone, user.Kelas, user.Gender,
		user.ID,
	)
	return err
}

// ResetPassword (Superadmin)
func (r *UserRepository) ResetPassword(userID int, hashedPassword string) error {
	_, err := r.DB.Exec("UPDATE users SET password = $1 WHERE id = $2", hashedPassword, userID)
	return err
}
