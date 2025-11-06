package loginlog

import (
	"context"
	"errors"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable = errors.New("login log service is not initialized")
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

type ListResult struct {
	Items    []LoginLog `json:"items"`
	Total    int64      `json:"total"`
	PageNum  int        `json:"pageNum"`
	PageSize int        `json:"pageSize"`
}

type LoginLog struct {
	InfoID        int64   `json:"infoId"`
	UserName      string  `json:"userName"`
	IPAddr        string  `json:"ipaddr"`
	LoginLocation string  `json:"loginLocation"`
	Browser       string  `json:"browser"`
	OS            string  `json:"os"`
	Status        string  `json:"status"`
	Msg           string  `json:"msg"`
	LoginTime     *string `json:"loginTime,omitempty"`
}

func (s *Service) ListLoginLogs(ctx context.Context, opts ListOptions) (*ListResult, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	records, total, err := s.repo.ListLoginLogs(ctx, ListOptions{
		PageNum:  pageNum,
		PageSize: pageSize,
		UserName: opts.UserName,
		Status:   opts.Status,
		IPAddr:   opts.IPAddr,
	})
	if err != nil {
		return nil, err
	}

	items := make([]LoginLog, 0, len(records))
	for i := range records {
		items = append(items, *loginLogFromModel(&records[i]))
	}

	return &ListResult{
		Items:    items,
		Total:    total,
		PageNum:  pageNum,
		PageSize: pageSize,
	}, nil
}

func (s *Service) GetLoginLog(ctx context.Context, id int64) (*LoginLog, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	record, err := s.repo.GetLoginLog(ctx, id)
	if err != nil {
		return nil, err
	}
	return loginLogFromModel(record), nil
}

func (s *Service) DeleteLoginLog(ctx context.Context, id int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	return s.repo.DeleteLoginLog(ctx, id)
}

func (s *Service) UnlockAccount(ctx context.Context, _ int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	// 暂无锁定机制，直接返回成功
	return nil
}

func loginLogFromModel(record *model.SysLogininfor) *LoginLog {
	if record == nil {
		return nil
	}

	var loginTime *string
	if record.LoginTime != nil {
		formatted := record.LoginTime.Format("2006-01-02 15:04:05")
		loginTime = &formatted
	}

	return &LoginLog{
		InfoID:        record.InfoID,
		UserName:      record.UserName,
		IPAddr:        record.IPAddr,
		LoginLocation: record.LoginLocation,
		Browser:       record.Browser,
		OS:            record.OS,
		Status:        record.Status,
		Msg:           record.Msg,
		LoginTime:     loginTime,
	}
}
