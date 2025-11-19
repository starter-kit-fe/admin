package job

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/robfig/cron/v3"
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
	maxExceptionInfoLen    = 2000

	releaseJobLockScript = redis.NewScript(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
end
return 0
`)
)

type Service struct {
	repo           *Repository
	registry       *executorRegistry
	logger         *slog.Logger
	redis          *redis.Client
	defaultLockTTL time.Duration

	mu         sync.RWMutex
	scheduler  *cron.Cron
	jobs       map[int64]*jobSchedule
	lockMisses map[int64]uint64
	started    bool
}

type ServiceOptions struct {
	Logger         *slog.Logger
	Redis          *redis.Client
	DefaultLockTTL time.Duration
}

type jobSchedule struct {
	job     Job
	entryID cron.EntryID
}

type jobRunContext struct {
	Source  string
	Message string
}

type jobRunContextKey struct{}

func NewService(repo *Repository, opts ServiceOptions) *Service {
	if repo == nil {
		return nil
	}

	lockTTL := opts.DefaultLockTTL
	if lockTTL <= 0 {
		lockTTL = 3 * time.Minute
	}

	logger := opts.Logger
	if logger == nil {
		logger = slog.Default()
	}

	return &Service{
		repo:           repo,
		registry:       newExecutorRegistry(),
		logger:         logger,
		redis:          opts.Redis,
		defaultLockTTL: lockTTL,
		jobs:           make(map[int64]*jobSchedule),
		lockMisses:     make(map[int64]uint64),
	}
}

func (s *Service) RegisterExecutor(key string, exec Executor) error {
	if s == nil {
		return ErrServiceUnavailable
	}
	return s.registry.Register(key, exec)
}

type ListResult struct {
	Items    []Job `json:"items"`
	Total    int64 `json:"total"`
	PageNum  int   `json:"pageNum"`
	PageSize int   `json:"pageSize"`
}

type Job struct {
	JobID          int64           `json:"jobId"`
	JobName        string          `json:"jobName"`
	JobGroup       string          `json:"jobGroup"`
	InvokeTarget   string          `json:"invokeTarget"`
	InvokeParams   json.RawMessage `json:"invokeParams,omitempty"`
	CronExpression string          `json:"cronExpression"`
	MisfirePolicy  string          `json:"misfirePolicy"`
	Concurrent     string          `json:"concurrent"`
	Status         string          `json:"status"`
	Remark         *string         `json:"remark,omitempty"`
	CreateBy       string          `json:"createBy,omitempty"`
	CreateTime     string          `json:"createTime,omitempty"`
	UpdateBy       string          `json:"updateBy,omitempty"`
	UpdateTime     string          `json:"updateTime,omitempty"`
}

type JobLog struct {
	JobLogID     int64           `json:"jobLogId"`
	JobID        int64           `json:"jobId"`
	JobName      string          `json:"jobName"`
	JobGroup     string          `json:"jobGroup"`
	InvokeTarget string          `json:"invokeTarget"`
	InvokeParams json.RawMessage `json:"invokeParams,omitempty"`
	JobMessage   *string         `json:"jobMessage,omitempty"`
	Status       string          `json:"status"`
	Exception    string          `json:"exception,omitempty"`
	CreateTime   string          `json:"createTime,omitempty"`
}

type JobLogList struct {
	Items    []JobLog `json:"items"`
	Total    int64    `json:"total"`
	PageNum  int      `json:"pageNum"`
	PageSize int      `json:"pageSize"`
}

type JobDetail struct {
	Job              Job        `json:"job"`
	InvokeParamsText string     `json:"invokeParamsText"`
	Logs             JobLogList `json:"logs"`
}

type ListJobLogsOptions struct {
	PageNum  int
	PageSize int
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
	JobName        string          `json:"jobName"`
	JobGroup       string          `json:"jobGroup"`
	InvokeTarget   string          `json:"invokeTarget"`
	InvokeParams   json.RawMessage `json:"invokeParams"`
	CronExpression string          `json:"cronExpression"`
	MisfirePolicy  string          `json:"misfirePolicy"`
	Concurrent     string          `json:"concurrent"`
	Status         string          `json:"status"`
	Remark         *string         `json:"remark"`
	Operator       string          `json:"operator"`
}

type UpdateJobInput struct {
	ID             int64
	JobName        *string          `json:"jobName"`
	JobGroup       *string          `json:"jobGroup"`
	InvokeTarget   *string          `json:"invokeTarget"`
	InvokeParams   *json.RawMessage `json:"invokeParams"`
	CronExpression *string          `json:"cronExpression"`
	MisfirePolicy  *string          `json:"misfirePolicy"`
	Concurrent     *string          `json:"concurrent"`
	Status         *string          `json:"status"`
	Remark         *string          `json:"remark"`
	Operator       string           `json:"operator"`
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

func (s *Service) GetJobDetail(ctx context.Context, id int64, opts ListJobLogsOptions) (*JobDetail, error) {
	job, err := s.GetJob(ctx, id)
	if err != nil {
		return nil, err
	}

	if opts.PageNum <= 0 {
		opts.PageNum = 1
	}
	if opts.PageSize <= 0 {
		opts.PageSize = 10
	}

	records, total, err := s.repo.ListJobLogs(ctx, id, opts.PageNum, opts.PageSize)
	if err != nil {
		return nil, err
	}

	logs := make([]JobLog, 0, len(records))
	for i := range records {
		logs = append(logs, jobLogFromModel(&records[i]))
	}

	return &JobDetail{
		Job:              *job,
		InvokeParamsText: rawJSONText(job.InvokeParams),
		Logs: JobLogList{
			Items:    logs,
			Total:    total,
			PageNum:  opts.PageNum,
			PageSize: opts.PageSize,
		},
	}, nil
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

	job, err := s.GetJob(ctx, record.JobID)
	if err != nil {
		return nil, err
	}
	if err := s.configureSchedule(*job); err != nil && s.logger != nil {
		s.logger.Error("configure job schedule failed", "jobID", job.JobID, "error", err)
	}
	return job, nil
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
	if input.InvokeParams != nil {
		value, err := sanitizeInvokeParams(*input.InvokeParams)
		if err != nil {
			return nil, err
		}
		values["invoke_params"] = value
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

	job, err := s.GetJob(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	if err := s.configureSchedule(*job); err != nil && s.logger != nil {
		s.logger.Error("configure job schedule failed", "jobID", job.JobID, "error", err)
	}
	return job, nil
}

func (s *Service) DeleteJob(ctx context.Context, id int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	if err := s.repo.DeleteJob(ctx, id); err != nil {
		return err
	}
	s.mu.Lock()
	s.detachLocked(id)
	s.mu.Unlock()
	return nil
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
	job, err := s.GetJob(ctx, id)
	if err == nil && job != nil {
		if err := s.configureSchedule(*job); err != nil && s.logger != nil {
			s.logger.Error("configure job schedule failed", "jobID", job.JobID, "error", err)
		}
	}
	return nil
}

func (s *Service) TriggerJob(ctx context.Context, id int64, operator string) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}

	job, err := s.GetJob(ctx, id)
	if err != nil {
		return err
	}

	s.dispatchJob(*job, jobRunContext{
		Source:  "manual",
		Message: "手动触发",
	})

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

		params, err := sanitizeInvokeParams(input.InvokeParams)
		if err != nil {
			return nil, err
		}

		remark := sanitizeRemark(input.Remark)
		operator := sanitizeOperator(input.Operator)

		return &model.SysJob{
			JobName:        jobName,
			JobGroup:       jobGroup,
			InvokeTarget:   invokeTarget,
			InvokeParams:   params,
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
		if opts.update.InvokeParams != nil {
			if _, err := sanitizeInvokeParams(*opts.update.InvokeParams); err != nil {
				return nil, err
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

	var params json.RawMessage
	if trimmed := strings.TrimSpace(record.InvokeParams); trimmed != "" {
		raw := []byte(trimmed)
		if json.Valid(raw) {
			buf := make([]byte, len(raw))
			copy(buf, raw)
			params = json.RawMessage(buf)
		}
	}

	return Job{
		JobID:          record.JobID,
		JobName:        record.JobName,
		JobGroup:       record.JobGroup,
		InvokeTarget:   record.InvokeTarget,
		InvokeParams:   params,
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

func jobLogFromModel(record *model.SysJobLog) JobLog {
	if record == nil {
		return JobLog{}
	}

	var params json.RawMessage
	if trimmed := strings.TrimSpace(record.InvokeParams); trimmed != "" {
		raw := []byte(trimmed)
		if json.Valid(raw) {
			buf := make([]byte, len(raw))
			copy(buf, raw)
			params = json.RawMessage(buf)
		}
	}

	message := record.JobMessage
	exception := strings.TrimSpace(record.ExceptionInfo)

	return JobLog{
		JobLogID:     record.JobLogID,
		JobID:        record.JobID,
		JobName:      record.JobName,
		JobGroup:     record.JobGroup,
		InvokeTarget: record.InvokeTarget,
		InvokeParams: params,
		JobMessage:   message,
		Status:       record.Status,
		Exception:    exception,
		CreateTime:   formatTime(record.CreateTime),
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

func withRunContext(ctx context.Context, meta jobRunContext) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}
	return context.WithValue(ctx, jobRunContextKey{}, meta)
}

func runContextFrom(ctx context.Context) jobRunContext {
	if ctx == nil {
		return jobRunContext{}
	}
	if meta, ok := ctx.Value(jobRunContextKey{}).(jobRunContext); ok {
		return meta
	}
	return jobRunContext{}
}

func (s *Service) Start(ctx context.Context) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}

	s.mu.Lock()
	if s.started {
		s.mu.Unlock()
		return nil
	}
	logger := s.cronLogger()
	s.scheduler = cron.New(
		cron.WithSeconds(),
		cron.WithChain(cron.Recover(logger)),
	)
	s.started = true
	s.mu.Unlock()

	if err := s.loadEnabledJobs(ctx); err != nil {
		return err
	}

	s.scheduler.Start()
	if s.logger != nil {
		s.logger.Info("job scheduler started")
	}
	return nil
}

func (s *Service) Stop() {
	if s == nil {
		return
	}

	s.mu.Lock()
	s.started = false
	s.jobs = make(map[int64]*jobSchedule)
	s.lockMisses = make(map[int64]uint64)
	scheduler := s.scheduler
	s.scheduler = nil
	s.mu.Unlock()

	if scheduler != nil {
		ctx := scheduler.Stop()
		if ctx != nil {
			<-ctx.Done()
		}
		if s.logger != nil {
			s.logger.Info("job scheduler stopped")
		}
	}
}

func (s *Service) loadEnabledJobs(ctx context.Context) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	records, err := s.repo.ListEnabledJobs(ctx)
	if err != nil {
		return err
	}
	for i := range records {
		job := jobFromModel(&records[i])
		if err := s.configureSchedule(job); err != nil && s.logger != nil {
			s.logger.Error("schedule job failed", "jobID", job.JobID, "error", err)
		}
	}
	return nil
}

func (s *Service) configureSchedule(job Job) error {
	if s == nil {
		return nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.detachLocked(job.JobID)

	schedule := &jobSchedule{job: job}
	if job.Status == "0" && s.scheduler != nil {
		runner := s.newCronJob(job, jobRunContext{
			Source:  "cron",
			Message: "定时调度",
		})
		entryID, err := s.scheduler.AddJob(job.CronExpression, runner)
		if err != nil {
			return err
		}
		schedule.entryID = entryID
		if s.logger != nil {
			s.logger.Info("job scheduled", "jobID", job.JobID, "spec", job.CronExpression)
		}
	}

	s.jobs[job.JobID] = schedule
	return nil
}

func (s *Service) detachLocked(jobID int64) {
	if schedule, ok := s.jobs[jobID]; ok {
		if schedule.entryID != 0 && s.scheduler != nil {
			s.scheduler.Remove(schedule.entryID)
		}
		schedule.entryID = 0
		delete(s.jobs, jobID)
	}
}

func (s *Service) newCronJob(job Job, meta jobRunContext) cron.Job {
	if s == nil {
		return cron.FuncJob(func() {})
	}

	if strings.TrimSpace(meta.Source) == "" {
		meta.Source = "cron"
	}
	if strings.TrimSpace(meta.Message) == "" {
		meta.Message = "定时调度"
	}

	runner := cron.FuncJob(func() {
		ctx := withRunContext(context.Background(), meta)
		s.executeJob(ctx, job)
	})

	if strings.TrimSpace(job.Concurrent) == "1" {
		return cron.NewChain(cron.SkipIfStillRunning(s.cronLogger())).Then(runner)
	}
	return runner
}

func (s *Service) dispatchJob(job Job, meta jobRunContext) {
	if s == nil {
		return
	}
	if strings.TrimSpace(meta.Source) == "" {
		meta.Source = "manual"
	}
	if strings.TrimSpace(meta.Message) == "" {
		meta.Message = "手动触发"
	}
	go s.newCronJob(job, meta).Run()
}

func (s *Service) executeJob(ctx context.Context, job Job) {
	if s == nil {
		return
	}

	runCtx := runContextFrom(ctx)
	startTime := time.Now()
	var execErr error
	shouldRecord := true

	defer func() {
		if shouldRecord {
			status := "0"
			if execErr != nil {
				status = "1"
			}
			s.recordJobLog(context.Background(), job, runCtx, status, time.Since(startTime), execErr)
		}
	}()

	exec, ok := s.registry.Resolve(job.InvokeTarget)
	if !ok {
		if s.logger != nil {
			s.logger.Warn("no executor registered", "jobID", job.JobID, "target", job.InvokeTarget)
		}
		execErr = fmt.Errorf("no executor registered for %s", job.InvokeTarget)
		return
	}

	var release func(context.Context) error
	var proceed bool = true
	var err error

	if s.redis != nil && strings.TrimSpace(job.Concurrent) == "1" {
		release, proceed, err = s.tryAcquireLock(ctx, job)
		if err != nil {
			if s.logger != nil {
				s.logger.Error("acquire job lock failed", "jobID", job.JobID, "error", err)
			}
			return
		}
		if !proceed {
			count := s.incrementLockMiss(job.JobID)
			if s.logger != nil {
				s.logger.Info("job lock busy", "jobID", job.JobID, "misses", count)
			}
			shouldRecord = false
			return
		}
		defer func() {
			if release != nil {
				if err := release(context.Background()); err != nil && s.logger != nil {
					s.logger.Error("release job lock failed", "jobID", job.JobID, "error", err)
				}
			}
		}()
	}

	payload := ExecutionPayload{
		Job:    job,
		Logger: s.logger,
	}
	if len(job.InvokeParams) > 0 {
		payload.Params = cloneParams(job.InvokeParams)
	}

	if err := exec(ctx, payload); err != nil {
		execErr = err
		if s.logger != nil {
			s.logger.Error("job execution failed", "jobID", job.JobID, "error", err)
		}
	} else if s.logger != nil {
		s.logger.Info("job executed", "jobID", job.JobID)
	}
}

func (s *Service) recordJobLog(ctx context.Context, job Job, meta jobRunContext, status string, duration time.Duration, execErr error) {
	if s == nil || s.repo == nil {
		return
	}
	if ctx == nil {
		ctx = context.Background()
	}

	message := strings.TrimSpace(meta.Message)
	if message == "" {
		if strings.TrimSpace(meta.Source) == "manual" {
			message = "手动触发"
		} else {
			message = "定时调度"
		}
	}
	durationText := duration.Round(time.Millisecond)
	resultLabel := "成功"
	if status != "0" {
		resultLabel = "失败"
	}
	detail := fmt.Sprintf("%s | %s | 用时 %s", message, resultLabel, durationText)

	record := &model.SysJobLog{
		JobID:        job.JobID,
		JobName:      job.JobName,
		JobGroup:     job.JobGroup,
		InvokeTarget: job.InvokeTarget,
		InvokeParams: rawJSONText(job.InvokeParams),
		Status:       status,
		JobMessage:   &detail,
	}

	if execErr != nil {
		record.ExceptionInfo = truncateString(execErr.Error(), maxExceptionInfoLen)
	}

	now := time.Now()
	record.CreateTime = &now

	if err := s.repo.CreateJobLog(ctx, record); err != nil && s.logger != nil {
		s.logger.Error("record job log failed", "jobID", job.JobID, "error", err)
	}
}

func (s *Service) tryAcquireLock(ctx context.Context, job Job) (func(context.Context) error, bool, error) {
	if s.redis == nil {
		return nil, true, nil
	}

	key := fmt.Sprintf("jobs:lock:%d", job.JobID)
	token := uuid.NewString()
	ttl := s.resolveLockTTL(job)

	acquired, err := s.redis.SetNX(ctx, key, token, ttl).Result()
	if err != nil {
		return nil, false, err
	}
	if !acquired {
		return nil, false, nil
	}

	release := func(ctx context.Context) error {
		_, err := releaseJobLockScript.Run(ctx, s.redis, []string{key}, token).Result()
		return err
	}
	return release, true, nil
}

func (s *Service) resolveLockTTL(job Job) time.Duration {
	ttl := s.defaultLockTTL
	if len(job.InvokeParams) == 0 {
		return ttl
	}

	var params map[string]json.RawMessage
	if err := json.Unmarshal(job.InvokeParams, &params); err != nil {
		return ttl
	}

	if raw, ok := params["lockTTLSeconds"]; ok {
		var seconds int64
		if err := json.Unmarshal(raw, &seconds); err == nil && seconds > 0 {
			return time.Duration(seconds) * time.Second
		}
	}

	return ttl
}

func (s *Service) incrementLockMiss(jobID int64) uint64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	next := s.lockMisses[jobID] + 1
	s.lockMisses[jobID] = next
	return next
}

func (s *Service) cronLogger() cron.Logger {
	return slogCronLogger{logger: s.logger}
}

type slogCronLogger struct {
	logger *slog.Logger
}

func (l slogCronLogger) Info(msg string, keysAndValues ...interface{}) {
	if l.logger == nil {
		return
	}
	l.logger.Info(msg, normalizeKV(keysAndValues)...)
}

func (l slogCronLogger) Error(err error, msg string, keysAndValues ...interface{}) {
	if l.logger == nil {
		return
	}
	args := append(keysAndValues, "error", err)
	l.logger.Error(msg, normalizeKV(args)...)
}

func normalizeKV(pairs []interface{}) []interface{} {
	if len(pairs) == 0 {
		return nil
	}
	args := make([]interface{}, 0, len(pairs))
	for i := 0; i < len(pairs); i += 2 {
		key := fmt.Sprint(pairs[i])
		var val interface{}
		if i+1 < len(pairs) {
			val = pairs[i+1]
		}
		args = append(args, key, val)
	}
	return args
}

func sanitizeInvokeParams(raw json.RawMessage) (string, error) {
	trimmed := strings.TrimSpace(string(raw))
	if trimmed == "" {
		return "", nil
	}
	if !json.Valid([]byte(trimmed)) {
		return "", errors.New("invoke params must be valid JSON")
	}
	return trimmed, nil
}

func cloneParams(raw json.RawMessage) json.RawMessage {
	if len(raw) == 0 {
		return nil
	}
	buf := make([]byte, len(raw))
	copy(buf, raw)
	return json.RawMessage(buf)
}

func rawJSONText(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}
	return strings.TrimSpace(string(raw))
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
