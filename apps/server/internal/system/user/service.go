package user

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable   = errors.New("user service is not initialized")
	ErrDuplicateUsername    = errors.New("username already exists")
	ErrPasswordRequired     = errors.New("password is required")
	ErrPasswordTooShort     = errors.New("password is too short")
	ErrPasswordMismatch     = errors.New("current password is incorrect")
	ErrInvalidStatus        = errors.New("invalid user status")
	ErrInvalidRoleSelection = errors.New("invalid role selection")
	ErrInvalidPostSelection = errors.New("invalid post selection")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	if repo == nil {
		return nil
	}
	return &Service{repo: repo}
}

type ListOptions struct {
	PageNum  int
	PageSize int
	UserName string
	Status   string
}

type ListResult struct {
	List     []User `json:"list"`
	Total    int64  `json:"total"`
	PageNum  int    `json:"pageNum"`
	PageSize int    `json:"pageSize"`
}

type DeptOption struct {
	DeptID   int64  `json:"deptId"`
	DeptName string `json:"deptName"`
}

type RoleOption struct {
	RoleID   int64  `json:"roleId"`
	RoleName string `json:"roleName"`
	RoleKey  string `json:"roleKey"`
}

type PostOption struct {
	PostID   int64  `json:"postId"`
	PostName string `json:"postName"`
	PostCode string `json:"postCode"`
}

type User struct {
	UserID        int64        `json:"userId"`
	DeptID        *int64       `json:"deptId,omitempty"`
	DeptName      *string      `json:"deptName,omitempty"`
	UserName      string       `json:"userName"`
	NickName      string       `json:"nickName"`
	UserType      string       `json:"userType"`
	Email         string       `json:"email"`
	Phonenumber   string       `json:"phonenumber"`
	Sex           string       `json:"sex"`
	Avatar        string       `json:"avatar"`
	Status        string       `json:"status"`
	Remark        *string      `json:"remark,omitempty"`
	LoginIP       string       `json:"loginIp"`
	LoginDate     *time.Time   `json:"loginDate,omitempty"`
	PwdUpdateDate *time.Time   `json:"pwdUpdateDate,omitempty"`
	CreateBy      string       `json:"createBy"`
	CreatedAt     *time.Time   `json:"createdAt,omitempty"`
	UpdateBy      string       `json:"updateBy"`
	UpdatedAt     *time.Time   `json:"updatedAt,omitempty"`
	Roles         []RoleOption `json:"roles"`
	Posts         []PostOption `json:"posts"`
}

type CreateUserInput struct {
	UserName    string
	NickName    string
	DeptID      *int64
	Email       string
	Phonenumber string
	Sex         string
	Status      string
	Password    string
	Remark      *string
	Operator    string
	RoleIDs     []int64
	PostIDs     []int64
}

type UpdateUserInput struct {
	ID          int64
	UserName    *string
	NickName    *string
	DeptID      *int64
	Email       *string
	Phonenumber *string
	Sex         *string
	Status      *string
	Remark      *string
	Operator    string
	RoleIDs     *[]int64
	PostIDs     *[]int64
}

type DeleteUserInput struct {
	ID       int64
	Operator string
}

type ResetPasswordInput struct {
	UserID   int64
	Password string
	Operator string
}

type UpdateProfileInput struct {
	UserID      int64
	NickName    string
	Email       string
	Phonenumber string
	Sex         string
	Remark      *string
}

type ChangePasswordInput struct {
	UserID          int64
	CurrentPassword string
	NewPassword     string
}

func (s *Service) ListUsers(ctx context.Context, opts ListOptions) (*ListResult, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}

	pageSize := opts.PageSize
	if pageSize < 0 {
		pageSize = 0
	}

	status := strings.TrimSpace(opts.Status)
	if status == "all" {
		status = ""
	}

	result, total, err := s.repo.ListUsers(ctx, ListUsersOptions{
		PageNum:  pageNum,
		PageSize: pageSize,
		UserName: opts.UserName,
		Status:   status,
	})
	if err != nil {
		return nil, err
	}

	users, err := s.composeUsers(ctx, result)
	if err != nil {
		return nil, err
	}

	return &ListResult{
		List:     users,
		Total:    total,
		PageNum:  pageNum,
		PageSize: pageSize,
	}, nil
}

func (s *Service) GetUser(ctx context.Context, id int64) (*User, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	user, err := s.repo.GetUser(ctx, id)
	if err != nil {
		return nil, err
	}

	users, err := s.composeUsers(ctx, []model.SysUser{*user})
	if err != nil {
		return nil, err
	}
	if len(users) == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	return &users[0], nil
}

func (s *Service) CreateUser(ctx context.Context, input CreateUserInput) (*User, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	username := strings.TrimSpace(input.UserName)
	if username == "" {
		return nil, errors.New("username is required")
	}

	nickname := strings.TrimSpace(input.NickName)
	if nickname == "" {
		return nil, errors.New("nickname is required")
	}

	if strings.TrimSpace(input.Password) == "" {
		return nil, ErrPasswordRequired
	}

	exists, err := s.repo.ExistsByUsername(ctx, username, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateUsername
	}

	status, err := normalizeStatus(input.Status)
	if err != nil {
		return nil, err
	}

	sex := normalizeSex(input.Sex)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(strings.TrimSpace(input.Password)), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	operator := sanitizeOperator(input.Operator)
	email := strings.TrimSpace(input.Email)
	phone := strings.TrimSpace(input.Phonenumber)
	remark := normalizeRemark(input.Remark)
	roleIDs := normalizeIDs(input.RoleIDs)

	primaryRoleKey := "00"
	if len(roleIDs) > 0 {
		roleMap, err := s.repo.GetRolesByIDs(ctx, roleIDs)
		if err != nil {
			return nil, err
		}
		if len(roleMap) != len(roleIDs) {
			return nil, ErrInvalidRoleSelection
		}
		if role := roleMap[roleIDs[0]]; role.RoleKey != "" {
			primaryRoleKey = strings.TrimSpace(role.RoleKey)
			if primaryRoleKey == "" {
				primaryRoleKey = "00"
			}
		}
	}

	postIDs := normalizeIDs(input.PostIDs)
	if len(postIDs) > 0 {
		postMap, err := s.repo.GetPostsByIDs(ctx, postIDs)
		if err != nil {
			return nil, err
		}
		if len(postMap) != len(postIDs) {
			return nil, ErrInvalidPostSelection
		}
	}

	user := &model.SysUser{
		DeptID:      input.DeptID,
		UserName:    username,
		NickName:    nickname,
		UserType:    primaryRoleKey,
		Email:       email,
		Phonenumber: phone,
		Sex:         sex,
		Avatar:      "",
		Password:    string(hashedPassword),
		Status:      status,

		LoginIP:       "",
		PwdUpdateDate: &now,
		CreateBy:      operator,
		UpdateBy:      operator,
		Remark:        remark,
	}

	if err := s.repo.CreateUser(ctx, user); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, ErrDuplicateUsername
		}
		return nil, err
	}

	if err := s.repo.ReplaceUserRoles(ctx, int64(user.ID), roleIDs); err != nil {
		return nil, err
	}

	if err := s.repo.ReplaceUserPosts(ctx, int64(user.ID), postIDs); err != nil {
		return nil, err
	}

	return s.GetUser(ctx, int64(user.ID))
}

func (s *Service) UpdateUser(ctx context.Context, input UpdateUserInput) (*User, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	if input.ID <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	existing, err := s.repo.GetUser(ctx, input.ID)
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})
	roleUpdateRequested := false
	var roleIDs []int64
	if input.RoleIDs != nil {
		roleUpdateRequested = true
		roleIDs = normalizeIDs(*input.RoleIDs)
		if len(roleIDs) > 0 {
			roleMap, err := s.repo.GetRolesByIDs(ctx, roleIDs)
			if err != nil {
				return nil, err
			}
			if len(roleMap) != len(roleIDs) {
				return nil, ErrInvalidRoleSelection
			}
			primaryRoleKey := strings.TrimSpace(roleMap[roleIDs[0]].RoleKey)
			if primaryRoleKey == "" {
				primaryRoleKey = "00"
			}
			updates["user_type"] = primaryRoleKey
		} else {
			updates["user_type"] = "00"
		}
	}

	postUpdateRequested := false
	var postIDs []int64
	if input.PostIDs != nil {
		postUpdateRequested = true
		postIDs = normalizeIDs(*input.PostIDs)
		if len(postIDs) > 0 {
			postMap, err := s.repo.GetPostsByIDs(ctx, postIDs)
			if err != nil {
				return nil, err
			}
			if len(postMap) != len(postIDs) {
				return nil, ErrInvalidPostSelection
			}
		}
	}

	if input.UserName != nil {
		newUsername := strings.TrimSpace(*input.UserName)
		if newUsername == "" {
			return nil, errors.New("username is required")
		}
		if newUsername != existing.UserName {
			exists, err := s.repo.ExistsByUsername(ctx, newUsername, input.ID)
			if err != nil {
				return nil, err
			}
			if exists {
				return nil, ErrDuplicateUsername
			}
		}
		updates["user_name"] = newUsername
	}

	if input.NickName != nil {
		newNickname := strings.TrimSpace(*input.NickName)
		if newNickname == "" {
			return nil, errors.New("nickname is required")
		}
		updates["nick_name"] = newNickname
	}

	if input.DeptID != nil {
		updates["dept_id"] = *input.DeptID
	}

	if input.Email != nil {
		updates["email"] = strings.TrimSpace(*input.Email)
	}

	if input.Phonenumber != nil {
		updates["phonenumber"] = strings.TrimSpace(*input.Phonenumber)
	}

	if input.Sex != nil {
		updates["sex"] = normalizeSex(*input.Sex)
	}

	if input.Status != nil {
		status, err := normalizeStatus(*input.Status)
		if err != nil {
			return nil, err
		}
		updates["status"] = status
	}

	if input.Remark != nil {
		if trimmed := normalizeRemark(input.Remark); trimmed == nil {
			updates["remark"] = nil
		} else {
			updates["remark"] = *trimmed
		}
	}

	if len(updates) == 0 && !roleUpdateRequested && !postUpdateRequested {
		return s.GetUser(ctx, input.ID)
	}

	operator := sanitizeOperator(input.Operator)
	now := time.Now()
	updates["update_by"] = operator
	updates["updated_at"] = now

	if len(updates) > 0 {
		if err := s.repo.UpdateUser(ctx, input.ID, updates); err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				return nil, ErrDuplicateUsername
			}
			return nil, err
		}
	}

	if roleUpdateRequested {
		if err := s.repo.ReplaceUserRoles(ctx, input.ID, roleIDs); err != nil {
			return nil, err
		}
	}

	if postUpdateRequested {
		if err := s.repo.ReplaceUserPosts(ctx, input.ID, postIDs); err != nil {
			return nil, err
		}
	}

	return s.GetUser(ctx, input.ID)
}

func (s *Service) DeleteUser(ctx context.Context, input DeleteUserInput) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	if input.ID <= 0 {
		return gorm.ErrRecordNotFound
	}

	operator := sanitizeOperator(input.Operator)
	return s.repo.SoftDeleteUser(ctx, input.ID, operator, time.Now())
}

func (s *Service) ResetPassword(ctx context.Context, input ResetPasswordInput) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	if input.UserID <= 0 {
		return gorm.ErrRecordNotFound
	}

	password := strings.TrimSpace(input.Password)
	if password == "" {
		return ErrPasswordRequired
	}
	if utf8.RuneCountInString(password) < 6 {
		return ErrPasswordTooShort
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	operator := sanitizeOperator(input.Operator)
	now := time.Now()

	return s.repo.UpdateUserPassword(ctx, input.UserID, string(hashedPassword), operator, now)
}

func (s *Service) UpdateProfile(ctx context.Context, input UpdateProfileInput) (*User, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	if input.UserID <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	existing, err := s.repo.GetUser(ctx, input.UserID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, gorm.ErrRecordNotFound
	}

	nickname := strings.TrimSpace(input.NickName)
	if nickname == "" {
		return nil, errors.New("nickname is required")
	}

	updates := map[string]interface{}{
		"nick_name":   nickname,
		"email":       strings.TrimSpace(input.Email),
		"phonenumber": strings.TrimSpace(input.Phonenumber),
		"sex":         normalizeSex(input.Sex),
	}

	if input.Remark != nil {
		if trimmed := normalizeRemark(input.Remark); trimmed == nil {
			updates["remark"] = nil
		} else {
			updates["remark"] = *trimmed
		}
	}

	operator := sanitizeOperator(strconv.FormatInt(input.UserID, 10))
	now := time.Now()
	updates["update_by"] = operator
	updates["updated_at"] = now

	if err := s.repo.UpdateUser(ctx, input.UserID, updates); err != nil {
		return nil, err
	}
	return s.GetUser(ctx, input.UserID)
}

func (s *Service) ChangePassword(ctx context.Context, input ChangePasswordInput) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	if input.UserID <= 0 {
		return gorm.ErrRecordNotFound
	}

	current := strings.TrimSpace(input.CurrentPassword)
	if current == "" {
		return ErrPasswordRequired
	}

	newPassword := strings.TrimSpace(input.NewPassword)
	if newPassword == "" {
		return ErrPasswordRequired
	}
	if utf8.RuneCountInString(newPassword) < 6 {
		return ErrPasswordTooShort
	}

	user, err := s.repo.GetUser(ctx, input.UserID)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(current)); err != nil {
		return ErrPasswordMismatch
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	operator := sanitizeOperator(strconv.FormatInt(input.UserID, 10))
	now := time.Now()
	return s.repo.UpdateUserPassword(ctx, input.UserID, string(hashedPassword), operator, now)
}

func (s *Service) composeUsers(ctx context.Context, records []model.SysUser) ([]User, error) {
	if len(records) == 0 {
		return []User{}, nil
	}

	deptIDs := collectDeptIDs(records)
	deptMap := map[int64]model.SysDept{}
	if len(deptIDs) > 0 {
		var err error
		deptMap, err = s.repo.GetDepartments(ctx, deptIDs)
		if err != nil {
			return nil, err
		}
	}

	userIDs := collectUserIDs(records)
	roleIDMap, err := s.repo.GetUserRoleIDs(ctx, userIDs)
	if err != nil {
		return nil, err
	}

	roleIDs := collectRoleIDs(roleIDMap)
	roleMap := map[int64]model.SysRole{}
	if len(roleIDs) > 0 {
		roleMap, err = s.repo.GetRolesByIDs(ctx, roleIDs)
		if err != nil {
			return nil, err
		}
	}

	postIDMap, err := s.repo.GetUserPostIDs(ctx, userIDs)
	if err != nil {
		return nil, err
	}
	postIDs := collectPostIDs(postIDMap)
	postMap := map[int64]model.SysPost{}
	if len(postIDs) > 0 {
		postMap, err = s.repo.GetPostsByIDs(ctx, postIDs)
		if err != nil {
			return nil, err
		}
	}

	users := make([]User, len(records))
	for i, record := range records {
		users[i] = toUserDTO(record, deptMap, roleIDMap, roleMap, postIDMap, postMap)
	}
	return users, nil
}

func collectDeptIDs(users []model.SysUser) []int64 {
	seen := make(map[int64]struct{})
	result := make([]int64, 0, len(users))

	for _, user := range users {
		if user.DeptID == nil {
			continue
		}
		id := *user.DeptID
		if id <= 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		result = append(result, id)
	}

	return result
}

func collectUserIDs(users []model.SysUser) []int64 {
	seen := make(map[int64]struct{}, len(users))
	result := make([]int64, 0, len(users))

	for _, user := range users {
		if user.ID <= 0 {
			continue
		}
		if _, ok := seen[int64(user.ID)]; ok {
			continue
		}
		seen[int64(user.ID)] = struct{}{}
		result = append(result, int64(user.ID))
	}

	return result
}

func collectRoleIDs(roleIDMap map[int64][]int64) []int64 {
	seen := make(map[int64]struct{})
	result := make([]int64, 0)

	for _, ids := range roleIDMap {
		for _, id := range ids {
			if _, ok := seen[id]; ok {
				continue
			}
			seen[id] = struct{}{}
			result = append(result, id)
		}
	}

	return result
}

func collectPostIDs(postIDMap map[int64][]int64) []int64 {
	seen := make(map[int64]struct{})
	result := make([]int64, 0)

	for _, ids := range postIDMap {
		for _, id := range ids {
			if _, ok := seen[id]; ok {
				continue
			}
			seen[id] = struct{}{}
			result = append(result, id)
		}
	}

	return result
}

func buildUserRoles(userRoleIDs []int64, roleMap map[int64]model.SysRole) []RoleOption {
	if len(userRoleIDs) == 0 {
		return []RoleOption{}
	}

	roles := make([]RoleOption, 0, len(userRoleIDs))
	for _, roleID := range userRoleIDs {
		role, ok := roleMap[roleID]
		if !ok {
			continue
		}
		if role.Status != "0" {
			continue
		}
		roles = append(roles, RoleOption{
			RoleID:   int64(role.ID),
			RoleName: role.RoleName,
			RoleKey:  role.RoleKey,
		})
	}
	return roles
}

func buildUserPosts(userPostIDs []int64, postMap map[int64]model.SysPost) []PostOption {
	if len(userPostIDs) == 0 {
		return []PostOption{}
	}

	posts := make([]PostOption, 0, len(userPostIDs))
	for _, postID := range userPostIDs {
		post, ok := postMap[postID]
		if !ok {
			continue
		}
		if post.Status != "0" {
			continue
		}
		posts = append(posts, PostOption{
			PostID:   int64(post.ID),
			PostName: post.PostName,
			PostCode: post.PostCode,
		})
	}
	return posts
}

func toUserDTO(
	user model.SysUser,
	deptMap map[int64]model.SysDept,
	roleIDMap map[int64][]int64,
	roleMap map[int64]model.SysRole,
	postIDMap map[int64][]int64,
	postMap map[int64]model.SysPost,
) User {
	var deptName *string
	if user.DeptID != nil {
		if dept, ok := deptMap[*user.DeptID]; ok {
			name := dept.DeptName
			deptName = &name
		}
	}

	roles := buildUserRoles(roleIDMap[int64(user.ID)], roleMap)
	posts := buildUserPosts(postIDMap[int64(user.ID)], postMap)
	userType := user.UserType
	if len(roles) > 0 {
		primaryKey := strings.TrimSpace(roles[0].RoleKey)
		if primaryKey != "" {
			userType = primaryKey
		}
	}

	return User{
		UserID:        int64(user.ID),
		DeptID:        user.DeptID,
		DeptName:      deptName,
		UserName:      user.UserName,
		NickName:      user.NickName,
		UserType:      userType,
		Email:         user.Email,
		Phonenumber:   user.Phonenumber,
		Sex:           user.Sex,
		Avatar:        user.Avatar,
		Status:        user.Status,
		Remark:        copyStringPtr(user.Remark),
		LoginIP:       user.LoginIP,
		LoginDate:     user.LoginDate,
		PwdUpdateDate: user.PwdUpdateDate,
		CreateBy:      user.CreateBy,
		CreatedAt:     &user.CreatedAt,
		UpdateBy:      user.UpdateBy,
		UpdatedAt:     &user.UpdatedAt,
		Roles:         roles,
		Posts:         posts,
	}
}

func copyStringPtr(src *string) *string {
	if src == nil {
		return nil
	}
	val := *src
	return &val
}

func normalizeIDs(ids []int64) []int64 {
	seen := make(map[int64]struct{}, len(ids))
	result := make([]int64, 0, len(ids))
	for _, id := range ids {
		if id <= 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		result = append(result, id)
	}
	return result
}

func normalizeStatus(status string) (string, error) {
	value := strings.TrimSpace(status)
	if value == "" {
		return "0", nil
	}

	switch value {
	case "0", "1":
		return value, nil
	default:
		return "", ErrInvalidStatus
	}
}

func (s *Service) ListDepartmentOptions(ctx context.Context, keyword string, limit int) ([]DeptOption, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	if limit <= 0 {
		limit = 15
	}

	depts, err := s.repo.ListDepartments(ctx, keyword, limit)
	if err != nil {
		return nil, err
	}

	options := make([]DeptOption, len(depts))
	for i, dept := range depts {
		options[i] = DeptOption{DeptID: int64(dept.ID), DeptName: dept.DeptName}
	}
	return options, nil
}

func (s *Service) ListRoleOptions(ctx context.Context, keyword string, limit int) ([]RoleOption, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	if limit <= 0 {
		limit = 15
	}

	roles, err := s.repo.ListRoles(ctx, keyword, limit)
	if err != nil {
		return nil, err
	}

	options := make([]RoleOption, 0, len(roles))
	for _, role := range roles {
		if role.Status != "0" {
			continue
		}
		options = append(options, RoleOption{
			RoleID:   int64(role.ID),
			RoleName: role.RoleName,
			RoleKey:  role.RoleKey,
		})
	}
	return options, nil
}

func (s *Service) ListPostOptions(ctx context.Context, keyword string, limit int) ([]PostOption, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	if limit <= 0 {
		limit = 15
	}

	posts, err := s.repo.ListPosts(ctx, keyword, limit)
	if err != nil {
		return nil, err
	}

	options := make([]PostOption, 0, len(posts))
	for _, post := range posts {
		if post.Status != "0" {
			continue
		}
		options = append(options, PostOption{
			PostID:   int64(post.ID),
			PostName: post.PostName,
			PostCode: post.PostCode,
		})
	}
	return options, nil
}

func normalizeSex(sex string) string {
	value := strings.TrimSpace(sex)
	switch value {
	case "0", "1", "2":
		return value
	default:
		return "2"
	}
}

func sanitizeOperator(operator string) string {
	value := strings.TrimSpace(operator)
	if value == "" {
		return "system"
	}
	if len(value) > 64 {
		return value[:64]
	}
	return value
}

func normalizeRemark(remark *string) *string {
	if remark == nil {
		return nil
	}
	value := strings.TrimSpace(*remark)
	if value == "" {
		return nil
	}
	return &value
}
