package job

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable = errors.New("job service is not initialized")

	validStatusValues      = map[string]struct{}{"0": {}, "1": {}}
	validMisfirePolicies   = map[string]struct{}{"1": {}, "2": {}, "3": {}}
	validConcurrentOptions = map[string]struct{}{"0": {}, "1": {}}
	defaultOperator        = "system"
	defaultJobGroup        = "DEFAULT"
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
	Items    []Job `json:"items"`
	Total    int64 `json:"total"`
	PageNum  int   `json:"pageNum"`
	PageSize int   `json:"pageSize"`
}

type Job struct {
	JobID          int64   `json:"jobId"`
	JobName        string  `json:"jobName"`
	JobGroup       string  `json:"jobGroup"`
	InvokeTarget   string  `json:"invokeTarget"`
	CronExpression string  `json:"cronExpression"`
	MisfirePolicy  string  `json:"misfirePolicy"`
	Concurrent     string  `json:"concurrent"`
	Status         string  `json:"status"`
	Remark         *string `json:"remark,omitempty"`
	CreateBy       string  `json:"createBy,omitempty"`
	CreateTime     string  `json:"createTime,omitempty"`
	UpdateBy       string  `json:"updateBy,omitempty"`
	UpdateTime     string  `json:"updateTime,omitempty"`
}

type ListJobsOptions struct {
	PageNum   int
	PageSize  int
	JobName   string
	JobGroup  string
	Status    string
	StartTime string
	EndTime   string
}

type CreateJobInput struct {
	JobName        string  `json:"jobName"`
	JobGroup       string  `json:"jobGroup"`
	InvokeTarget   string  `json:"invokeTarget"`
	CronExpression string  `json:"cronExpression"`
	MisfirePolicy  string  `json:"misfirePolicy"`
	Concurrent     string  `json:"concurrent"`
	Status         string  `json:"status"`
	Remark         *string `json:"remark"`
	Operator       string  `json:"operator"`
}

type UpdateJobInput struct {
	ID             int64
	JobName        *string `json:"jobName"`
	JobGroup       *string `json:"jobGroup"`
	InvokeTarget   *string `json:"invokeTarget"`
	CronExpression *string `json:"cronExpression"`
	MisfirePolicy  *string `json:"misfirePolicy"`
	Concurrent     *string `json:"concurrent"`
	Status         *string `json:"status"`
	Remark         *string `json:"remark"`
	Operator       string  `json:"operator"`
}

func (s *Service) ListJobs(ctx context.Context, opts ListJobsOptions) (*ListResult, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	var startTime time.Time
	var endTime time.Time
	if trimmed := strings.TrimSpace(opts.StartTime); trimmed != "" {
		if ts, err := time.Parse("2006-01-02 15:04:05", trimmed); err == nil {
			startTime = ts
		}
	}
	if trimmed := strings.TrimSpace(opts.EndTime); trimmed != "" {
		if ts, err := time.Parse("2006-01-02 15:04:05", trimmed); err == nil {
			endTime = ts
		}
	}

	records, total, err := s.repo.ListJobs(ctx, ListOptions{
		PageNum:   opts.PageNum,
		PageSize:  opts.PageSize,
		JobName:   opts.JobName,
		JobGroup:  opts.JobGroup,
		Status:    opts.Status,
		StartTime: startTime,
		EndTime:   endTime,
	})
	if err != nil {
		return nil, err
	}

	items := make([]Job, 0, len(records))
	for i := range records {
		items = append(items, jobFromModel(&records[i]))
	}

	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	return &ListResult{
		Items:    items,
		Total:    total,
		PageNum:  pageNum,
		PageSize: pageSize,
	}, nil
}

func (s *Service) GetJob(ctx context.Context, id int64) (*Job, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	record, err := s.repo.GetJob(ctx, id)
	if err != nil {
		return nil, err
	}
	job := jobFromModel(record)
	return &job, nil
}

func (s *Service) CreateJob(ctx context.Context, input CreateJobInput) (*Job, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	record, err := s.validateAndBuildRecord(ctx, validateOptions{
		isCreate: true,
		create:   &input,
	})
	if err != nil {
		return nil, err
	}

	if err := s.repo.CreateJob(ctx, record); err != nil {
		return nil, err
	}

	return s.GetJob(ctx, record.JobID)
}

func (s *Service) UpdateJob(ctx context.Context, input UpdateJobInput) (*Job, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	if input.ID <= 0 {
		return nil, errors.New("job id is required")
	}

	_, err := s.validateAndBuildRecord(ctx, validateOptions{
		isCreate: false,
		update:   &input,
	})
	if err != nil {
		return nil, err
	}

	values := make(map[string]interface{})
	now := time.Now()
	values["update_time"] = now

	if input.JobName != nil {
		values["job_name"] = strings.TrimSpace(*input.JobName)
	}
	if input.JobGroup != nil {
		values["job_group"] = normalizeJobGroup(*input.JobGroup)
	}
	if input.InvokeTarget != nil {
		values["invoke_target"] = strings.TrimSpace(*input.InvokeTarget)
	}
	if input.CronExpression != nil {
		values["cron_expression"] = strings.TrimSpace(*input.CronExpression)
	}
	if input.MisfirePolicy != nil {
		values["misfire_policy"] = strings.TrimSpace(*input.MisfirePolicy)
	}
	if input.Concurrent != nil {
		values["concurrent"] = strings.TrimSpace(*input.Concurrent)
	}
	if input.Status != nil {
		values["status"] = strings.TrimSpace(*input.Status)
	}
	if input.Remark != nil {
		values["remark"] = strings.TrimSpace(*input.Remark)
	}
	operator := strings.TrimSpace(input.Operator)
	if operator == "" {
		operator = defaultOperator
	}
	values["update_by"] = operator

	if err := s.repo.UpdateJob(ctx, input.ID, values); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		return nil, err
	}

	return s.GetJob(ctx, input.ID)
}

func (s *Service) DeleteJob(ctx context.Context, id int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	return s.repo.DeleteJob(ctx, id)
}

func (s *Service) ChangeStatus(ctx context.Context, id int64, status, operator string) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	status = strings.TrimSpace(status)
	if _, ok := validStatusValues[status]; !ok {
		return errors.New("invalid job status")
	}
	if err := s.repo.UpdateJob(ctx, id, map[string]interface{}{
		"status":      status,
		"update_by":   sanitizeOperator(operator),
		"update_time": time.Now(),
	}); err != nil {
		return err
	}
	return nil
}

func (s *Service) TriggerJob(ctx context.Context, id int64, operator string) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	// In this starter implementation we simply record the update timestamp.
	return s.repo.UpdateJob(ctx, id, map[string]interface{}{
		"update_by":   sanitizeOperator(operator),
		"update_time": time.Now(),
	})
}

type validateOptions struct {
	isCreate bool
	create   *CreateJobInput
	update   *UpdateJobInput
}

func (s *Service) validateAndBuildRecord(ctx context.Context, opts validateOptions) (*model.SysJob, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	now := time.Now()

	if opts.isCreate {
		input := opts.create
		if input == nil {
			return nil, errors.New("job payload is required")
		}

		jobName := strings.TrimSpace(input.JobName)
		if jobName == "" {
			return nil, errors.New("job name is required")
		}
		if len(jobName) > 64 {
			jobName = jobName[:64]
		}

		jobGroup := normalizeJobGroup(input.JobGroup)

		invokeTarget := strings.TrimSpace(input.InvokeTarget)
		if invokeTarget == "" {
			return nil, errors.New("invoke target is required")
		}
		if len(invokeTarget) > 500 {
			invokeTarget = invokeTarget[:500]
		}

		cronExpr := strings.TrimSpace(input.CronExpression)
		if cronExpr == "" {
			return nil, errors.New("cron expression is required")
		}
		if len(cronExpr) > 255 {
			cronExpr = cronExpr[:255]
		}

		misfirePolicy := strings.TrimSpace(input.MisfirePolicy)
		if misfirePolicy == "" {
			misfirePolicy = "3"
		}
		if _, ok := validMisfirePolicies[misfirePolicy]; !ok {
			return nil, errors.New("invalid misfire policy")
		}

		concurrent := strings.TrimSpace(input.Concurrent)
		if concurrent == "" {
			concurrent = "1"
		}
		if _, ok := validConcurrentOptions[concurrent]; !ok {
			return nil, errors.New("invalid concurrent flag")
		}

		status := strings.TrimSpace(input.Status)
		if status == "" {
			status = "0"
		}
		if _, ok := validStatusValues[status]; !ok {
			return nil, errors.New("invalid status")
		}

		remark := sanitizeRemark(input.Remark)
		operator := sanitizeOperator(input.Operator)

		return &model.SysJob{
			JobName:        jobName,
			JobGroup:       jobGroup,
			InvokeTarget:   invokeTarget,
			CronExpression: cronExpr,
			MisfirePolicy:  misfirePolicy,
			Concurrent:     concurrent,
			Status:         status,
			Remark:         remark,
			CreateBy:       operator,
			CreateTime:     &now,
			UpdateBy:       operator,
			UpdateTime:     &now,
		}, nil
	}

	if opts.update != nil {
		if opts.update.JobName != nil {
			name := strings.TrimSpace(*opts.update.JobName)
			if name == "" {
				return nil, errors.New("job name is required")
			}
		}
		if opts.update.InvokeTarget != nil {
			target := strings.TrimSpace(*opts.update.InvokeTarget)
			if target == "" {
				return nil, errors.New("invoke target is required")
			}
		}
		if opts.update.CronExpression != nil {
			cron := strings.TrimSpace(*opts.update.CronExpression)
			if cron == "" {
				return nil, errors.New("cron expression is required")
			}
		}
		if opts.update.MisfirePolicy != nil {
			policy := strings.TrimSpace(*opts.update.MisfirePolicy)
			if _, ok := validMisfirePolicies[policy]; !ok {
				return nil, errors.New("invalid misfire policy")
			}
		}
		if opts.update.Concurrent != nil {
			flag := strings.TrimSpace(*opts.update.Concurrent)
			if _, ok := validConcurrentOptions[flag]; !ok {
				return nil, errors.New("invalid concurrent flag")
			}
		}
		if opts.update.Status != nil {
			status := strings.TrimSpace(*opts.update.Status)
			if _, ok := validStatusValues[status]; !ok {
				return nil, errors.New("invalid status")
			}
		}
	}

	return nil, nil
}

func jobFromModel(record *model.SysJob) Job {
	if record == nil {
		return Job{}
	}

	var remark *string
	if strings.TrimSpace(record.Remark) != "" {
		r := strings.TrimSpace(record.Remark)
		remark = &r
	}

	return Job{
		JobID:          record.JobID,
		JobName:        record.JobName,
		JobGroup:       record.JobGroup,
		InvokeTarget:   record.InvokeTarget,
		CronExpression: record.CronExpression,
		MisfirePolicy:  record.MisfirePolicy,
		Concurrent:     record.Concurrent,
		Status:         record.Status,
		Remark:         remark,
		CreateBy:       record.CreateBy,
		CreateTime:     formatTime(record.CreateTime),
		UpdateBy:       record.UpdateBy,
		UpdateTime:     formatTime(record.UpdateTime),
	}
}

func formatTime(value *time.Time) string {
	if value == nil || value.IsZero() {
		return ""
	}
	return value.Format("2006-01-02 15:04:05")
}

func sanitizeRemark(remark *string) string {
	if remark == nil {
		return ""
	}
	return strings.TrimSpace(*remark)
}

func sanitizeOperator(operator string) string {
	operator = strings.TrimSpace(operator)
	if operator == "" {
		return defaultOperator
	}
	if len(operator) > 64 {
		return operator[:64]
	}
	return operator
}

func normalizeJobGroup(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		value = defaultJobGroup
	}
	if len(value) > 64 {
		value = value[:64]
	}
	return strings.ToUpper(value)
}
