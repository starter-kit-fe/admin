package operlog

import (
	"context"
	"errors"
	"strings"
	"time"

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
	List     []OperLog `json:"list"`
	Total    int64     `json:"total"`
	PageNum  int       `json:"pageNum"`
	PageSize int       `json:"pageSize"`
}

type OperLog struct {
	OperID        int64      `json:"operId"`
	Title         string     `json:"title"`
	BusinessType  int        `json:"businessType"`
	Method        string     `json:"method"`
	RequestMethod string     `json:"requestMethod"`
	OperatorType  int        `json:"operatorType"`
	OperName      string     `json:"operName"`
	DeptName      string     `json:"deptName"`
	OperURL       string     `json:"operUrl"`
	OperIP        string     `json:"operIp"`
	OperLocation  string     `json:"operLocation"`
	OperParam     string     `json:"operParam"`
	JSONResult    string     `json:"jsonResult"`
	Status        int        `json:"status"`
	ErrorMsg      string     `json:"errorMsg"`
	CreatedAt     *time.Time `json:"createdAt,omitempty"`
	CostTime      int64      `json:"costTime"`
}

const (
	maxPayloadLength = 4000
)

type CreateOperLogInput struct {
	Title         string
	BusinessType  int
	Method        string
	RequestMethod string
	OperatorType  int
	OperName      string
	DeptName      string
	OperURL       string
	OperIP        string
	OperLocation  string
	OperParam     string
	JSONResult    string
	Status        int
	ErrorMsg      string
	CreateTime    *time.Time
	CostTime      int64
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
		List:     items,
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

func (s *Service) RecordOperLog(ctx context.Context, input CreateOperLogInput) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}

	record := &model.SysOperLog{
		Title:         normalizeString(input.Title),
		BusinessType:  sanitizeBusinessType(input.BusinessType),
		Method:        truncateString(normalizeString(input.Method), 200),
		RequestMethod: strings.ToUpper(strings.TrimSpace(input.RequestMethod)),
		OperatorType:  sanitizeOperatorType(input.OperatorType),
		OperName:      truncateString(normalizeString(input.OperName), 64),
		DeptName:      truncateString(normalizeString(input.DeptName), 64),
		OperURL:       truncateString(strings.TrimSpace(input.OperURL), 255),
		OperIP:        truncateString(strings.TrimSpace(input.OperIP), 64),
		OperLocation:  truncateString(strings.TrimSpace(input.OperLocation), 255),
		OperParam:     truncateString(input.OperParam, maxPayloadLength),
		JSONResult:    truncateString(input.JSONResult, maxPayloadLength),
		Status:        sanitizeStatus(input.Status),
		ErrorMsg:      truncateString(input.ErrorMsg, maxPayloadLength),
		CostTime:      sanitizeCostTime(input.CostTime),
	}
	if input.CreateTime != nil {
		record.CreatedAt = *input.CreateTime
	}
	return s.repo.CreateOperLog(ctx, record)
}

func operLogFromModel(record *model.SysOperLog) *OperLog {
	if record == nil {
		return nil
	}

	return &OperLog{
		OperID:        int64(record.ID),
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
		CreatedAt:     &record.CreatedAt,
		CostTime:      record.CostTime,
	}
}

func normalizeString(value string) string {
	return strings.TrimSpace(value)
}

func truncateString(value string, max int) string {
	if max <= 0 {
		return ""
	}
	if len(value) <= max {
		return value
	}
	return value[:max]
}

func sanitizeBusinessType(value int) int {
	if value < 0 || value > 9 {
		return 0
	}
	return value
}

func sanitizeOperatorType(value int) int {
	if value < 0 || value > 9 {
		return 0
	}
	return value
}

func sanitizeStatus(value int) int {
	if value != 0 && value != 1 {
		return 0
	}
	return value
}

func sanitizeCostTime(value int64) int64 {
	if value < 0 {
		return 0
	}
	return value
}
