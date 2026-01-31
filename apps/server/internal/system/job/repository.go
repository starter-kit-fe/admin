package job

import (
	jobrepo "github.com/starter-kit-fe/admin/internal/system/job/repository"
	"gorm.io/gorm"
)

type Repository = jobrepo.Repository

func NewRepository(db *gorm.DB) *Repository {
	return jobrepo.NewRepository(db)
}
