package notice

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable = errors.New("notice service is not initialized")

	ErrTitleRequired   = errors.New("notice title is required")
	ErrTypeRequired    = errors.New("notice type is required")
	ErrContentRequired = errors.New("notice content is required")
	ErrInvalidStatus   = errors.New("invalid notice status")
	ErrInvalidType     = errors.New("invalid notice type")
)

var validTypes = map[string]struct{}{
	"1": {},
	"2": {},
}

var validStatus = map[string]struct{}{
	"0": {},
	"1": {},
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	if repo == nil {
		return nil
	}
	return &Service{repo: repo}
}

type Notice struct {
	NoticeID      int64      `json:"noticeId"`
	NoticeTitle   string     `json:"noticeTitle"`
	NoticeType    string     `json:"noticeType"`
	NoticeContent string     `json:"noticeContent"`
	Status        string     `json:"status"`
	Remark        *string    `json:"remark,omitempty"`
	CreateBy      string     `json:"createBy"`
	CreateTime    time.Time  `json:"createTime"`
	UpdateBy      string     `json:"updateBy"`
	UpdateTime    *time.Time `json:"updateTime,omitempty"`
}

type CreateNoticeInput struct {
	NoticeTitle   string
	NoticeType    string
	NoticeContent string
	Status        string
	Remark        *string
	Operator      string
}

type UpdateNoticeInput struct {
	ID            int64
	NoticeTitle   *string
	NoticeType    *string
	NoticeContent *string
	Status        *string
	Remark        *string
	Operator      string
}

func (s *Service) ListNotices(ctx context.Context, opts ListOptions) ([]Notice, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	records, err := s.repo.ListNotices(ctx, opts)
	if err != nil {
		return nil, err
	}

	result := make([]Notice, 0, len(records))
	for i := range records {
		result = append(result, *noticeFromModel(&records[i]))
	}
	return result, nil
}

func (s *Service) GetNotice(ctx context.Context, id int64) (*Notice, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	record, err := s.repo.GetNotice(ctx, id)
	if err != nil {
		return nil, err
	}
	return noticeFromModel(record), nil
}

func (s *Service) CreateNotice(ctx context.Context, input CreateNoticeInput) (*Notice, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	title := strings.TrimSpace(input.NoticeTitle)
	if title == "" {
		return nil, ErrTitleRequired
	}

	noticeType := strings.TrimSpace(input.NoticeType)
	if noticeType == "" {
		return nil, ErrTypeRequired
	}
	if _, ok := validTypes[noticeType]; !ok {
		return nil, ErrInvalidType
	}

	content := strings.TrimSpace(input.NoticeContent)
	if content == "" {
		return nil, ErrContentRequired
	}

	status := normalizeStatus(input.Status)
	if _, ok := validStatus[status]; !ok {
		return nil, ErrInvalidStatus
	}

	now := time.Now()
	record := &model.SysNotice{
		NoticeTitle:   title,
		NoticeType:    noticeType,
		NoticeContent: []byte(content),
		Status:        status,
		Remark:        normalizeRemark(input.Remark),
		CreateBy:      sanitizeOperator(input.Operator),
		UpdateBy:      sanitizeOperator(input.Operator),
		CreateTime:    &now,
		UpdateTime:    &now,
	}

	if err := s.repo.CreateNotice(ctx, record); err != nil {
		return nil, err
	}

	return noticeFromModel(record), nil
}

func (s *Service) UpdateNotice(ctx context.Context, input UpdateNoticeInput) (*Notice, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	record, err := s.repo.GetNotice(ctx, input.ID)
	if err != nil {
		return nil, err
	}

	if input.NoticeTitle != nil {
		title := strings.TrimSpace(*input.NoticeTitle)
		if title == "" {
			return nil, ErrTitleRequired
		}
		record.NoticeTitle = title
	}

	if input.NoticeType != nil {
		noticeType := strings.TrimSpace(*input.NoticeType)
		if noticeType == "" {
			return nil, ErrTypeRequired
		}
		if _, ok := validTypes[noticeType]; !ok {
			return nil, ErrInvalidType
		}
		record.NoticeType = noticeType
	}

	if input.NoticeContent != nil {
		content := strings.TrimSpace(*input.NoticeContent)
		if content == "" {
			return nil, ErrContentRequired
		}
		record.NoticeContent = []byte(content)
	}

	if input.Status != nil {
		status := normalizeStatus(*input.Status)
		if _, ok := validStatus[status]; !ok {
			return nil, ErrInvalidStatus
		}
		record.Status = status
	}

	if input.Remark != nil {
		record.Remark = normalizeRemark(input.Remark)
	}

	now := time.Now()
	record.UpdateBy = sanitizeOperator(input.Operator)
	record.UpdateTime = &now

	if err := s.repo.SaveNotice(ctx, record); err != nil {
		return nil, err
	}

	return noticeFromModel(record), nil
}

func (s *Service) DeleteNotice(ctx context.Context, id int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	return s.repo.DeleteNotice(ctx, id)
}

func noticeFromModel(record *model.SysNotice) *Notice {
	if record == nil {
		return nil
	}

	var created time.Time
	if record.CreateTime != nil {
		created = *record.CreateTime
	}

	return &Notice{
		NoticeID:      record.NoticeID,
		NoticeTitle:   record.NoticeTitle,
		NoticeType:    record.NoticeType,
		NoticeContent: string(record.NoticeContent),
		Status:        record.Status,
		Remark:        record.Remark,
		CreateBy:      record.CreateBy,
		CreateTime:    created,
		UpdateBy:      record.UpdateBy,
		UpdateTime:    record.UpdateTime,
	}
}

func normalizeStatus(status string) string {
	trimmed := strings.TrimSpace(status)
	if trimmed == "" {
		return "0"
	}
	return trimmed
}

func normalizeRemark(remark *string) *string {
	if remark == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*remark)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func sanitizeOperator(operator string) string {
	return strings.TrimSpace(operator)
}
