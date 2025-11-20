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
	ErrRepositoryUnavailable = errors.New("job repository is not initialized")
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

type ListOptions struct {
	PageNum   int
	PageSize  int
	JobName   string
	JobGroup  string
	Status    string
	StartTime time.Time
	EndTime   time.Time
}

func (r *Repository) ListJobs(ctx context.Context, opts ListOptions) ([]model.SysJob, int64, error) {
	if r == nil || r.db == nil {
		return nil, 0, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysJob{})

	if name := strings.TrimSpace(opts.JobName); name != "" {
		query = query.Where("job_name ILIKE ?", "%"+name+"%")
	}

	if group := strings.TrimSpace(opts.JobGroup); group != "" {
		query = query.Where("job_group = ?", group)
	}

	if status := strings.TrimSpace(opts.Status); status != "" {
		query = query.Where("status = ?", status)
	}

	if !opts.StartTime.IsZero() {
		query = query.Where("create_time >= ?", opts.StartTime)
	}

	if !opts.EndTime.IsZero() {
		query = query.Where("create_time <= ?", opts.EndTime)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	var records []model.SysJob
	if err := query.
		Order("create_time DESC, job_id DESC").
		Offset((pageNum - 1) * pageSize).
		Limit(pageSize).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}

	return records, total, nil
}

func (r *Repository) GetJob(ctx context.Context, id int64) (*model.SysJob, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	var record model.SysJob
	if err := r.db.WithContext(ctx).First(&record, id).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *Repository) CreateJob(ctx context.Context, record *model.SysJob) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if record == nil {
		return errors.New("job record is required")
	}
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *Repository) UpdateJob(ctx context.Context, id int64, values map[string]interface{}) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if len(values) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).
		Model(&model.SysJob{}).
		Where("job_id = ?", id).
		Updates(values).Error
}

func (r *Repository) DeleteJob(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	result := r.db.WithContext(ctx).Delete(&model.SysJob{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) UpdateJobStatus(ctx context.Context, id int64, status string) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	return r.db.WithContext(ctx).
		Model(&model.SysJob{}).
		Where("job_id = ?", id).
		Update("status", status).Error
}

func (r *Repository) ListEnabledJobs(ctx context.Context) ([]model.SysJob, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	var records []model.SysJob
	if err := r.db.WithContext(ctx).
		Model(&model.SysJob{}).
		Where("status = ?", "0").
		Order("job_id ASC").
		Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}

func (r *Repository) CreateJobLog(ctx context.Context, record *model.SysJobLog) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if record == nil {
		return errors.New("job log record is required")
	}
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *Repository) ListJobLogs(ctx context.Context, jobID int64, pageNum, pageSize int) ([]model.SysJobLog, int64, error) {
	if r == nil || r.db == nil {
		return nil, 0, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysJobLog{}).Where("job_id = ?", jobID)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if pageNum <= 0 {
		pageNum = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	var records []model.SysJobLog
	if err := query.
		Order("job_log_id DESC").
		Offset((pageNum - 1) * pageSize).
		Limit(pageSize).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}

	return records, total, nil
}

// GetJobLog 获取单条任务日志
func (r *Repository) GetJobLog(ctx context.Context, logID int64) (*model.SysJobLog, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	var record model.SysJobLog
	if err := r.db.WithContext(ctx).First(&record, logID).Error; err != nil {
		return nil, err
	}

	return &record, nil
}

// CreateJobLogStep 创建步骤日志
func (r *Repository) CreateJobLogStep(ctx context.Context, step *model.SysJobLogStep) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if step == nil {
		return errors.New("job log step record is required")
	}
	return r.db.WithContext(ctx).Create(step).Error
}

// GetJobLogSteps 获取任务日志的所有步骤
func (r *Repository) GetJobLogSteps(ctx context.Context, jobLogID int64) ([]model.SysJobLogStep, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	var steps []model.SysJobLogStep
	err := r.db.WithContext(ctx).
		Where("job_log_id = ?", jobLogID).
		Order("step_order ASC").
		Find(&steps).Error
	return steps, err
}

// ListJobLogSteps 获取多个日志的步骤
func (r *Repository) ListJobLogSteps(ctx context.Context, jobLogIDs []int64) (map[int64][]model.SysJobLogStep, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	if len(jobLogIDs) == 0 {
		return map[int64][]model.SysJobLogStep{}, nil
	}

	var steps []model.SysJobLogStep
	if err := r.db.WithContext(ctx).
		Where("job_log_id IN ?", jobLogIDs).
		Order("job_log_id ASC, step_order ASC").
		Find(&steps).Error; err != nil {
		return nil, err
	}

	result := make(map[int64][]model.SysJobLogStep)
	for i := range steps {
		step := steps[i]
		result[step.JobLogID] = append(result[step.JobLogID], step)
	}

	return result, nil
}

// UpdateJobLogStep 更新步骤日志
func (r *Repository) UpdateJobLogStep(ctx context.Context, stepID int64, updates map[string]interface{}) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if len(updates) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).
		Model(&model.SysJobLogStep{}).
		Where("step_id = ?", stepID).
		Updates(updates).Error
}

// GetLatestLogsByStatus 获取指定状态的最新日志
func (r *Repository) GetLatestLogsByStatus(ctx context.Context, jobIDs []int64, statuses []string) (map[int64]model.SysJobLog, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	if len(jobIDs) == 0 {
		return map[int64]model.SysJobLog{}, nil
	}

	query := r.db.WithContext(ctx).
		Model(&model.SysJobLog{}).
		Where("job_id IN ?", jobIDs)
	if len(statuses) > 0 {
		query = query.Where("status IN ?", statuses)
	}

	var logs []model.SysJobLog
	if err := query.
		Order("job_id ASC, job_log_id DESC").
		Find(&logs).Error; err != nil {
		return nil, err
	}

	result := make(map[int64]model.SysJobLog)
	for i := range logs {
		log := logs[i]
		if _, exists := result[log.JobID]; exists {
			continue
		}
		result[log.JobID] = log
	}

	return result, nil
}

// UpdateJobLog 更新任务日志
func (r *Repository) UpdateJobLog(ctx context.Context, jobLogID int64, updates map[string]interface{}) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if len(updates) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).
		Model(&model.SysJobLog{}).
		Where("job_log_id = ?", jobLogID).
		Updates(updates).Error
}
