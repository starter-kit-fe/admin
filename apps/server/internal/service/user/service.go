package user

import (
	"context"
	"errors"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
	userrepo "github.com/starter-kit-fe/admin/internal/repo/user"
)

var (
	ErrServiceUnavailable   = errors.New("user service is not initialized")
	ErrDuplicateUsername    = errors.New("username already exists")
	ErrPasswordRequired     = errors.New("password is required")
	ErrInvalidStatus        = errors.New("invalid user status")
	ErrInvalidRoleSelection = errors.New("invalid role selection")
)

type Service struct {
	repo *userrepo.Repository
}

func New(repo *userrepo.Repository) *Service {
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
	Items    []User `json:"items"`
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
	CreateTime    *time.Time   `json:"createTime,omitempty"`
	UpdateBy      string       `json:"updateBy"`
	UpdateTime    *time.Time   `json:"updateTime,omitempty"`
	Roles         []RoleOption `json:"roles"`
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
}

type DeleteUserInput struct {
	ID       int64
	Operator string
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

	result, total, err := s.repo.ListUsers(ctx, userrepo.ListUsersOptions{
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
		Items:    users,
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

	user := &model.SysUser{
		DeptID:        input.DeptID,
		UserName:      username,
		NickName:      nickname,
		UserType:      primaryRoleKey,
		Email:         email,
		Phonenumber:   phone,
		Sex:           sex,
		Avatar:        "",
		Password:      string(hashedPassword),
		Status:        status,
		DelFlag:       "0",
		LoginIP:       "",
		PwdUpdateDate: &now,
		CreateBy:      operator,
		CreateTime:    &now,
		UpdateBy:      operator,
		UpdateTime:    &now,
		Remark:        remark,
	}

	if err := s.repo.CreateUser(ctx, user); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, ErrDuplicateUsername
		}
		return nil, err
	}

	if err := s.repo.ReplaceUserRoles(ctx, user.UserID, roleIDs); err != nil {
		return nil, err
	}

	return s.GetUser(ctx, user.UserID)
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

	if len(updates) == 0 && !roleUpdateRequested {
		return s.GetUser(ctx, input.ID)
	}

	operator := sanitizeOperator(input.Operator)
	now := time.Now()
	updates["update_by"] = operator
	updates["update_time"] = now

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

	users := make([]User, len(records))
	for i, record := range records {
		users[i] = toUserDTO(record, deptMap, roleIDMap, roleMap)
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
		if user.UserID <= 0 {
			continue
		}
		if _, ok := seen[user.UserID]; ok {
			continue
		}
		seen[user.UserID] = struct{}{}
		result = append(result, user.UserID)
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
		if role.Status != "0" || role.DelFlag != "0" {
			continue
		}
		roles = append(roles, RoleOption{
			RoleID:   role.RoleID,
			RoleName: role.RoleName,
			RoleKey:  role.RoleKey,
		})
	}
	return roles
}

func toUserDTO(user model.SysUser, deptMap map[int64]model.SysDept, roleIDMap map[int64][]int64, roleMap map[int64]model.SysRole) User {
	var deptName *string
	if user.DeptID != nil {
		if dept, ok := deptMap[*user.DeptID]; ok {
			name := dept.DeptName
			deptName = &name
		}
	}

	roles := buildUserRoles(roleIDMap[user.UserID], roleMap)
	userType := user.UserType
	if len(roles) > 0 {
		primaryKey := strings.TrimSpace(roles[0].RoleKey)
		if primaryKey != "" {
			userType = primaryKey
		}
	}

	return User{
		UserID:        user.UserID,
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
		CreateTime:    user.CreateTime,
		UpdateBy:      user.UpdateBy,
		UpdateTime:    user.UpdateTime,
		Roles:         roles,
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
		options[i] = DeptOption{DeptID: dept.DeptID, DeptName: dept.DeptName}
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
		if role.Status != "0" || role.DelFlag != "0" {
			continue
		}
		options = append(options, RoleOption{
			RoleID:   role.RoleID,
			RoleName: role.RoleName,
			RoleKey:  role.RoleKey,
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
