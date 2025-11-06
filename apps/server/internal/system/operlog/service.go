package operlog

import (
	"context"
	"errors"
	"strings"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable = errors.New("oper log service is not initialized")
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
	Items    []OperLog `json:"items"`
	Total    int64     `json:"total"`
	PageNum  int       `json:"pageNum"`
	PageSize int       `json:"pageSize"`
}

type OperLog struct {
	OperID        int64   `json:"operId"`
	Title         string  `json:"title"`
	BusinessType  int     `json:"businessType"`
	Method        string  `json:"method"`
	RequestMethod string  `json:"requestMethod"`
	OperatorType  int     `json:"operatorType"`
	OperName      string  `json:"operName"`
	DeptName      string  `json:"deptName"`
	OperURL       string  `json:"operUrl"`
	OperIP        string  `json:"operIp"`
	OperLocation  string  `json:"operLocation"`
	OperParam     string  `json:"operParam"`
	JSONResult    string  `json:"jsonResult"`
	Status        int     `json:"status"`
	ErrorMsg      string  `json:"errorMsg"`
	OperTime      *string `json:"operTime,omitempty"`
	CostTime      int64   `json:"costTime"`
}

func (s *Service) ListOperLogs(ctx context.Context, opts ListOptions) (*ListResult, error) {
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

	records, total, err := s.repo.ListOperLogs(ctx, ListOptions{
		PageNum:       pageNum,
		PageSize:      pageSize,
		Title:         opts.Title,
		BusinessType:  opts.BusinessType,
		Status:        opts.Status,
		OperName:      opts.OperName,
		RequestMethod: opts.RequestMethod,
	})
	if err != nil {
		return nil, err
	}

	items := make([]OperLog, 0, len(records))
	for i := range records {
		items = append(items, *operLogFromModel(&records[i]))
	}

	return &ListResult{
		Items:    items,
		Total:    total,
		PageNum:  pageNum,
		PageSize: pageSize,
	}, nil
}

func (s *Service) GetOperLog(ctx context.Context, id int64) (*OperLog, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	record, err := s.repo.GetOperLog(ctx, id)
	if err != nil {
		return nil, err
	}
	return operLogFromModel(record), nil
}

func (s *Service) DeleteOperLog(ctx context.Context, id int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	return s.repo.DeleteOperLog(ctx, id)
}

func operLogFromModel(record *model.SysOperLog) *OperLog {
	if record == nil {
		return nil
	}

	var operTime *string
	if record.OperTime != nil {
		formatted := record.OperTime.Format("2006-01-02 15:04:05")
		operTime = &formatted
	}

	return &OperLog{
		OperID:        record.OperID,
		Title:         record.Title,
		BusinessType:  record.BusinessType,
		Method:        record.Method,
		RequestMethod: record.RequestMethod,
		OperatorType:  record.OperatorType,
		OperName:      record.OperName,
		DeptName:      record.DeptName,
		OperURL:       record.OperURL,
		OperIP:        record.OperIP,
		OperLocation:  record.OperLocation,
		OperParam:     record.OperParam,
		JSONResult:    record.JSONResult,
		Status:        record.Status,
		ErrorMsg:      record.ErrorMsg,
		OperTime:      operTime,
		CostTime:      record.CostTime,
	}
}

func normalizeString(value string) string {
	return strings.TrimSpace(value)
}
