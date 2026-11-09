package service

import (
	"errors"

	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/Firdaus371/student-voice-api/internal/repository"
	"github.com/Firdaus371/student-voice-api/pkg/utils"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Register(user *model.User) error
	Login(email, password string) (string, error)
	GetUserDetails(email string) (*model.User, error)
	UpdateAvatar(userID int, avatarURL string) error
	GetAllUsers() ([]model.User, error)
	DeleteUser(id int) error
	UpdateProfile(id int, name, nis, nip, email, oldPassword, newPassword, avatarURL, phone, kelas, gender string) error
	ResetPassword(userID int, newPassword string) error
}

type userService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) UserService {
	return &userService{repo: repo}
}

// REGISTER (oleh Admin untuk 6 peran)
func (s *userService) Register(user *model.User) error {
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashedPwd)
	return s.repo.Create(user)
}

// LOGIN
func (s *userService) Login(email, password string) (string, error) {
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return "", errors.New("User tidak ditemukan")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", errors.New("Password salah")
	}

	return utils.GenerateToken(user.ID, user.Role)
}

func (s *userService) GetUserDetails(email string) (*model.User, error) {
	return s.repo.FindByEmail(email)
}

func (s *userService) UpdateAvatar(userID int, avatarURL string) error {
	return s.repo.UpdateAvatar(userID, avatarURL)
}

func (s *userService) GetAllUsers() ([]model.User, error) {
	return s.repo.GetAll()
}

func (s *userService) DeleteUser(id int) error {
	return s.repo.Delete(id)
}

// UPDATE PROFILE
func (s *userService) UpdateProfile(id int, name, nis, nip, email, oldPassword, newPassword, avatarURL, phone, kelas, gender string) error {
	existingUser, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("user tidak ditemukan")
	}

	existingUser.Name = name
	existingUser.NIS = nis
	existingUser.NIP = nip
	existingUser.Email = email
	existingUser.Phone = phone
	existingUser.Kelas = kelas
	existingUser.Gender = gender

	if avatarURL != "" {
		existingUser.AvatarURL = avatarURL
	}

	if newPassword != "" {
		if oldPassword == "" {
			return errors.New("password lama wajib diisi untuk keamanan")
		}
		err := bcrypt.CompareHashAndPassword([]byte(existingUser.Password), []byte(oldPassword))
		if err != nil {
			return errors.New("password lama salah")
		}
		hashedPwd, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		existingUser.Password = string(hashedPwd)
	}

	return s.repo.Update(existingUser)
}

// RESET PASSWORD (SUPERADMIN)
func (s *userService) ResetPassword(userID int, newPassword string) error {
	if len(newPassword) < 6 {
		return errors.New("password baru minimal 6 karakter")
	}
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.repo.ResetPassword(userID, string(hashedPwd))
}
