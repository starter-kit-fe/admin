package user

import (
	"context"
	"errors"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("user repository is not initialized")
	ErrInvalidUserPayload    = errors.New("user payload is invalid")
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	if db == nil {
		return nil
	}
	return &Repository{db: db}
}

type ListUsersOptions struct {
	PageNum  int
	PageSize int
	UserName string
	Status   string
}

func (r *Repository) ListUsers(ctx context.Context, opts ListUsersOptions) ([]model.SysUser, int64, error) {
	if r == nil || r.db == nil {
		return nil, 0, ErrRepositoryUnavailable
	}

	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize < 0 {
		pageSize = 0
	}

	base := r.db.WithContext(ctx).Model(&model.SysUser{})

	if userName := strings.TrimSpace(opts.UserName); userName != "" {
		base = base.Where("user_name ILIKE ?", "%"+userName+"%")
	}

	if status := strings.TrimSpace(opts.Status); status != "" {
		base = base.Where("status = ?", status)
	}

	var total int64
	countQuery := base.Session(&gorm.Session{})
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if total == 0 {
		return []model.SysUser{}, 0, nil
	}

	dataQuery := base.Session(&gorm.Session{})
	if pageSize > 0 {
		offset := (pageNum - 1) * pageSize
		dataQuery = dataQuery.Offset(offset).Limit(pageSize)
	}

	var users []model.SysUser
	if err := dataQuery.Order("created_at DESC, id DESC").Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *Repository) GetDepartments(ctx context.Context, ids []int64) (map[int64]model.SysDept, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	if len(ids) == 0 {
		return map[int64]model.SysDept{}, nil
	}

	unique := make(map[int64]struct{}, len(ids))
	finalIDs := make([]int64, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, exists := unique[id]; exists {
			continue
		}
		unique[id] = struct{}{}
		finalIDs = append(finalIDs, id)
	}

	if len(finalIDs) == 0 {
		return map[int64]model.SysDept{}, nil
	}

	var depts []model.SysDept
	if err := r.db.WithContext(ctx).
		Where("id IN ?", finalIDs).
		Find(&depts).Error; err != nil {
		return nil, err
	}

	result := make(map[int64]model.SysDept, len(depts))
	for _, dept := range depts {
		result[int64(dept.ID)] = dept
	}
	return result, nil
}

func (r *Repository) GetUser(ctx context.Context, id int64) (*model.SysUser, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	if id <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var user model.SysUser
	err := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(&user).Error
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) CreateUser(ctx context.Context, user *model.SysUser) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if user == nil {
		return ErrInvalidUserPayload
	}

	return r.db.WithContext(ctx).Create(user).Error
}

func (r *Repository) ListDepartments(ctx context.Context, keyword string, limit int) ([]model.SysDept, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	if limit <= 0 {
		limit = 15
	}

	query := r.db.WithContext(ctx).Model(&model.SysDept{}).
		Where("status = ?", "0")

	if trimmed := strings.TrimSpace(keyword); trimmed != "" {
		query = query.Where("dept_name ILIKE ?", "%"+trimmed+"%")
	}

	var depts []model.SysDept
	if err := query.Order("order_num ASC, id ASC").Limit(limit).Find(&depts).Error; err != nil {
		return nil, err
	}

	return depts, nil
}

func (r *Repository) ListRoles(ctx context.Context, keyword string, limit int) ([]model.SysRole, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	if limit <= 0 {
		limit = 15
	}

	query := r.db.WithContext(ctx).Model(&model.SysRole{}).
		Where("status = ?", "0")

	if trimmed := strings.TrimSpace(keyword); trimmed != "" {
		query = query.Where("role_name ILIKE ?", "%"+trimmed+"%")
	}

	var roles []model.SysRole
	if err := query.Order("role_sort ASC, id ASC").Limit(limit).Find(&roles).Error; err != nil {
		return nil, err
	}

	return roles, nil
}

func (r *Repository) ListPosts(ctx context.Context, keyword string, limit int) ([]model.SysPost, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	if limit <= 0 {
		limit = 15
	}

	query := r.db.WithContext(ctx).Model(&model.SysPost{}).
		Where("status = ?", "0")

	if trimmed := strings.TrimSpace(keyword); trimmed != "" {
		query = query.Where("post_name ILIKE ?", "%"+trimmed+"%")
	}

	var posts []model.SysPost
	if err := query.Order("post_sort ASC, id ASC").Limit(limit).Find(&posts).Error; err != nil {
		return nil, err
	}

	return posts, nil
}

func (r *Repository) GetRolesByIDs(ctx context.Context, ids []int64) (map[int64]model.SysRole, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	unique := make(map[int64]struct{}, len(ids))
	filtered := make([]int64, 0, len(ids))
	for _, id := range ids {
		if id <= 0 {
			continue
		}
		if _, exists := unique[id]; exists {
			continue
		}
		unique[id] = struct{}{}
		filtered = append(filtered, id)
	}

	if len(filtered) == 0 {
		return map[int64]model.SysRole{}, nil
	}

	var roles []model.SysRole
	if err := r.db.WithContext(ctx).
		Where("id IN ?", filtered).
		Find(&roles).Error; err != nil {
		return nil, err
	}

	roleMap := make(map[int64]model.SysRole, len(roles))
	for _, role := range roles {
		if role.Status != "0" {
			continue
		}
		roleMap[int64(role.ID)] = role
	}
	return roleMap, nil
}

func (r *Repository) GetPostsByIDs(ctx context.Context, ids []int64) (map[int64]model.SysPost, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	unique := make(map[int64]struct{}, len(ids))
	filtered := make([]int64, 0, len(ids))
	for _, id := range ids {
		if id <= 0 {
			continue
		}
		if _, exists := unique[id]; exists {
			continue
		}
		unique[id] = struct{}{}
		filtered = append(filtered, id)
	}

	if len(filtered) == 0 {
		return map[int64]model.SysPost{}, nil
	}

	var posts []model.SysPost
	if err := r.db.WithContext(ctx).
		Where("id IN ?", filtered).
		Find(&posts).Error; err != nil {
		return nil, err
	}

	postMap := make(map[int64]model.SysPost, len(posts))
	for _, post := range posts {
		if post.Status != "0" {
			continue
		}
		postMap[int64(post.ID)] = post
	}
	return postMap, nil
}

func (r *Repository) GetUserRoleIDs(ctx context.Context, userIDs []int64) (map[int64][]int64, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	if len(userIDs) == 0 {
		return map[int64][]int64{}, nil
	}

	unique := make(map[int64]struct{}, len(userIDs))
	filtered := make([]int64, 0, len(userIDs))
	for _, id := range userIDs {
		if id <= 0 {
			continue
		}
		if _, exists := unique[id]; exists {
			continue
		}
		unique[id] = struct{}{}
		filtered = append(filtered, id)
	}

	if len(filtered) == 0 {
		return map[int64][]int64{}, nil
	}

	var relations []model.SysUserRole
	if err := r.db.WithContext(ctx).
		Where("user_id IN ?", filtered).
		Find(&relations).Error; err != nil {
		return nil, err
	}

	result := make(map[int64][]int64, len(filtered))
	for _, rel := range relations {
		result[rel.UserID] = append(result[rel.UserID], rel.RoleID)
	}

	for userID := range result {
		sort.SliceStable(result[userID], func(i, j int) bool {
			return result[userID][i] < result[userID][j]
		})
	}

	return result, nil
}

func (r *Repository) GetUserPostIDs(ctx context.Context, userIDs []int64) (map[int64][]int64, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	if len(userIDs) == 0 {
		return map[int64][]int64{}, nil
	}

	unique := make(map[int64]struct{}, len(userIDs))
	filtered := make([]int64, 0, len(userIDs))
	for _, id := range userIDs {
		if id <= 0 {
			continue
		}
		if _, exists := unique[id]; exists {
			continue
		}
		unique[id] = struct{}{}
		filtered = append(filtered, id)
	}

	if len(filtered) == 0 {
		return map[int64][]int64{}, nil
	}

	var relations []model.SysUserPost
	if err := r.db.WithContext(ctx).
		Where("user_id IN ?", filtered).
		Find(&relations).Error; err != nil {
		return nil, err
	}

	result := make(map[int64][]int64, len(filtered))
	for _, rel := range relations {
		result[rel.UserID] = append(result[rel.UserID], rel.PostID)
	}

	for userID := range result {
		sort.SliceStable(result[userID], func(i, j int) bool {
			return result[userID][i] < result[userID][j]
		})
	}

	return result, nil
}

func (r *Repository) ReplaceUserRoles(ctx context.Context, userID int64, roleIDs []int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if userID <= 0 {
		return gorm.ErrInvalidData
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&model.SysUserRole{}).Error; err != nil {
			return err
		}

		unique := make(map[int64]struct{}, len(roleIDs))
		filtered := make([]int64, 0, len(roleIDs))
		for _, id := range roleIDs {
			if id <= 0 {
				continue
			}
			if _, exists := unique[id]; exists {
				continue
			}
			unique[id] = struct{}{}
			filtered = append(filtered, id)
		}

		if len(filtered) == 0 {
			return nil
		}

		entries := make([]model.SysUserRole, len(filtered))
		for i, id := range filtered {
			entries[i] = model.SysUserRole{UserID: userID, RoleID: id}
		}

		if err := tx.Create(&entries).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *Repository) ReplaceUserPosts(ctx context.Context, userID int64, postIDs []int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if userID <= 0 {
		return gorm.ErrInvalidData
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&model.SysUserPost{}).Error; err != nil {
			return err
		}

		unique := make(map[int64]struct{}, len(postIDs))
		filtered := make([]int64, 0, len(postIDs))
		for _, id := range postIDs {
			if id <= 0 {
				continue
			}
			if _, exists := unique[id]; exists {
				continue
			}
			unique[id] = struct{}{}
			filtered = append(filtered, id)
		}

		if len(filtered) == 0 {
			return nil
		}

		entries := make([]model.SysUserPost, len(filtered))
		for i, id := range filtered {
			entries[i] = model.SysUserPost{UserID: userID, PostID: id}
		}

		if err := tx.Create(&entries).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *Repository) UpdateUser(ctx context.Context, userID int64, updates map[string]interface{}) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if userID <= 0 {
		return gorm.ErrRecordNotFound
	}
	if len(updates) == 0 {
		return nil
	}

	result := r.db.WithContext(ctx).
		Model(&model.SysUser{}).
		Where("id = ?", userID).
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) SoftDeleteUser(ctx context.Context, userID int64, operator string, at time.Time) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if userID <= 0 {
		return gorm.ErrRecordNotFound
	}

	// Update the updater info first
	updates := map[string]interface{}{
		"updated_at":  time.Now(),
		"update_time": at,
	}
	if strings.TrimSpace(operator) != "" {
		updates["update_by"] = strings.TrimSpace(operator)
	}
	r.db.WithContext(ctx).Model(&model.SysUser{}).Where("id = ?", userID).Updates(updates)

	// Perform soft delete
	result := r.db.WithContext(ctx).Delete(&model.SysUser{}, userID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) UpdateUserPassword(ctx context.Context, userID int64, hashedPassword string, operator string, at time.Time) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if userID <= 0 {
		return gorm.ErrRecordNotFound
	}
	hashedPassword = strings.TrimSpace(hashedPassword)
	if hashedPassword == "" {
		return ErrInvalidUserPayload
	}

	updates := map[string]interface{}{
		"password":        hashedPassword,
		"pwd_update_date": at,
		"update_time":     at,
	}
	if trimmed := strings.TrimSpace(operator); trimmed != "" {
		updates["update_by"] = trimmed
	}

	result := r.db.WithContext(ctx).
		Model(&model.SysUser{}).
		Where("id = ?", userID).
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) ExistsByUsername(ctx context.Context, username string, excludeID int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}

	username = strings.TrimSpace(username)
	if username == "" {
		return false, nil
	}

	query := r.db.WithContext(ctx).
		Model(&model.SysUser{}).
		Where("user_name = ?", username)

	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}
