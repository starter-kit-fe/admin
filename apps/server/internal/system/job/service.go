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
	ErrJobRunningConflict = errors.New("job is running and concurrency is disabled")

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
	streams        *logStreamHub

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

type jobRunOptions struct {
	logID int64
}

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
		streams:        newLogStreamHub(),
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
	IsRunning      bool            `json:"isRunning"`
	CurrentLogID   *int64          `json:"currentLogId,omitempty"`
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
	Steps        []JobLogStep    `json:"steps,omitempty"`
}

type JobLogStep struct {
	StepID     int64  `json:"stepId"`
	JobLogID   int64  `json:"jobLogId"`
	StepName   string `json:"stepName"`
	StepOrder  int    `json:"stepOrder"`
	Status     string `json:"status"`
	Message    string `json:"message,omitempty"`
	Output     string `json:"output,omitempty"`
	Error      string `json:"error,omitempty"`
	StartTime  string `json:"startTime,omitempty"`
	EndTime    string `json:"endTime,omitempty"`
	DurationMs *int64 `json:"durationMs,omitempty"`
	CreateTime string `json:"createTime,omitempty"`
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

	s.attachRunningState(ctx, items)

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

func (s *Service) GetJobLog(ctx context.Context, id int64) (*JobLog, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	record, err := s.repo.GetJobLog(ctx, id)
	if err != nil {
		return nil, err
	}

	log := jobLogFromModel(record)
	return &log, nil
}

func (s *Service) GetJobDetail(ctx context.Context, id int64, opts ListJobLogsOptions) (*JobDetail, error) {
	job, err := s.GetJob(ctx, id)
	if err != nil {
		return nil, err
	}

	jobData := *job
	jobSlice := []Job{jobData}
	s.attachRunningState(ctx, jobSlice)
	if len(jobSlice) > 0 {
		jobData = jobSlice[0]
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

	logIDs := make([]int64, 0, len(records))
	for i := range records {
		logIDs = append(logIDs, records[i].JobLogID)
	}

	stepsMap, stepsErr := s.repo.ListJobLogSteps(ctx, logIDs)
	if stepsErr != nil && s.logger != nil {
		s.logger.Warn("load job log steps failed", "jobID", id, "error", stepsErr)
	}

	logs := make([]JobLog, 0, len(records))
	for i := range records {
		log := jobLogFromModel(&records[i])
		if stepRecords, ok := stepsMap[log.JobLogID]; ok {
			for j := range stepRecords {
				log.Steps = append(log.Steps, jobLogStepFromModel(&stepRecords[j]))
			}
		}
		logs = append(logs, log)
	}

	return &JobDetail{
		Job:              jobData,
		InvokeParamsText: rawJSONText(jobData.InvokeParams),
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

func (s *Service) TriggerJob(ctx context.Context, id int64, operator string) (int64, error) {
	if s == nil || s.repo == nil {
		return 0, ErrServiceUnavailable
	}

	job, err := s.GetJob(ctx, id)
	if err != nil {
		return 0, err
	}

	if s.isJobRunning(ctx, job.JobID) && strings.TrimSpace(job.Concurrent) == "1" {
		return 0, ErrJobRunningConflict
	}

	meta := jobRunContext{
		Source:  "manual",
		Message: "手动触发",
	}

	logID, err := s.createRunningLogRecord(ctx, *job, meta)
	if err != nil {
		return 0, err
	}

	s.dispatchJob(*job, meta, jobRunOptions{logID: logID})

	return logID, s.repo.UpdateJob(ctx, id, map[string]interface{}{
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

func jobLogStepFromModel(record *model.SysJobLogStep) JobLogStep {
	if record == nil {
		return JobLogStep{}
	}

	return JobLogStep{
		StepID:     record.StepID,
		JobLogID:   record.JobLogID,
		StepName:   record.StepName,
		StepOrder:  record.StepOrder,
		Status:     record.Status,
		Message:    record.Message,
		Output:     record.Output,
		Error:      record.Error,
		StartTime:  formatTime(record.StartTime),
		EndTime:    formatTime(record.EndTime),
		DurationMs: record.DurationMs,
		CreateTime: formatTime(record.CreateTime),
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

func resolveRunMessage(meta jobRunContext) string {
	message := strings.TrimSpace(meta.Message)
	if message != "" {
		return message
	}

	source := strings.TrimSpace(meta.Source)
	if source == "manual" {
		return "手动触发"
	}
	if source == "cron" {
		return "定时调度"
	}

	return "任务执行"
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
		}, jobRunOptions{})
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

func (s *Service) newCronJob(job Job, meta jobRunContext, opts jobRunOptions) cron.Job {
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
		s.executeJob(ctx, job, opts)
	})

	if strings.TrimSpace(job.Concurrent) == "1" {
		return cron.NewChain(cron.SkipIfStillRunning(s.cronLogger())).Then(runner)
	}
	return runner
}

func (s *Service) dispatchJob(job Job, meta jobRunContext, opts jobRunOptions) {
	if s == nil {
		return
	}
	if strings.TrimSpace(meta.Source) == "" {
		meta.Source = "manual"
	}
	if strings.TrimSpace(meta.Message) == "" {
		meta.Message = "手动触发"
	}
	go s.newCronJob(job, meta, opts).Run()
}

func (s *Service) executeJob(ctx context.Context, job Job, opts jobRunOptions) {
	if s == nil {
		return
	}

	runCtx := runContextFrom(ctx)
	startTime := time.Now()
	var execErr error
	var logID int64 = opts.logID

	var release func(context.Context) error
	var proceed bool = true
	var err error

	if s.redis != nil && strings.TrimSpace(job.Concurrent) == "1" {
		release, proceed, err = s.tryAcquireLock(ctx, job)
		if err != nil {
			execErr = fmt.Errorf("acquire job lock failed: %w", err)
			s.finishJobRun(context.Background(), job, runCtx, logID, startTime, execErr)
			return
		}
		if !proceed {
			count := s.incrementLockMiss(job.JobID)
			if s.logger != nil {
				s.logger.Info("job lock busy", "jobID", job.JobID, "misses", count)
			}
			execErr = fmt.Errorf("job is already running")
			s.finishJobRun(context.Background(), job, runCtx, logID, startTime, execErr)
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

	logID, stepLogger, startErr := s.startJobRun(ctx, job, runCtx, opts)
	if startErr != nil {
		execErr = startErr
		s.finishJobRun(context.Background(), job, runCtx, logID, startTime, execErr)
		return
	}

	if stepLogger != nil {
		defer stepLogger.Close()
	}
	defer func() {
		s.finishJobRun(context.Background(), job, runCtx, logID, startTime, execErr)
	}()

	exec, ok := s.registry.Resolve(job.InvokeTarget)
	if !ok {
		if s.logger != nil {
			s.logger.Warn("no executor registered", "jobID", job.JobID, "target", job.InvokeTarget)
		}
		execErr = fmt.Errorf("no executor registered for %s", job.InvokeTarget)
		return
	}

	payload := ExecutionPayload{
		Job:        job,
		Logger:     s.logger,
		StepLogger: stepLogger,
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

func (s *Service) startJobRun(ctx context.Context, job Job, meta jobRunContext, opts jobRunOptions) (int64, *StepLogger, error) {
	if s == nil || s.repo == nil {
		return 0, nil, ErrServiceUnavailable
	}

	if opts.logID > 0 {
		return opts.logID, s.newStepLogger(opts.logID), nil
	}

	logID, err := s.createRunningLogRecord(ctx, job, meta)
	if err != nil {
		return 0, nil, err
	}

	return logID, s.newStepLogger(logID), nil
}

func (s *Service) finishJobRun(ctx context.Context, job Job, meta jobRunContext, logID int64, startTime time.Time, execErr error) {
	if s == nil {
		return
	}

	if ctx == nil {
		ctx = context.Background()
	}

	status := "0"
	resultLabel := "成功"
	if execErr != nil {
		status = "1"
		resultLabel = "失败"
	}

	if logID > 0 && s.streams != nil {
		s.streams.Publish(logID, &StepEvent{
			Type:      "complete",
			JobLogID:  logID,
			Status:    status,
			Timestamp: time.Now().Format(time.RFC3339),
			Data: map[string]interface{}{
				"durationMs": time.Since(startTime).Milliseconds(),
				"result":     resultLabel,
			},
		})
		s.streams.Close(logID)
	}

	if s.repo == nil || logID == 0 {
		return
	}

	message := resolveRunMessage(meta)
	durationText := time.Since(startTime).Round(time.Millisecond)
	detail := fmt.Sprintf("%s | %s | 用时 %s", message, resultLabel, durationText)

	updates := map[string]interface{}{
		"status":      status,
		"job_message": detail,
	}

	if execErr != nil {
		updates["exception_info"] = truncateString(execErr.Error(), maxExceptionInfoLen)
	}

	if err := s.repo.UpdateJobLog(ctx, logID, updates); err != nil && s.logger != nil {
		s.logger.Error("update job log failed", "jobID", job.JobID, "jobLogID", logID, "error", err)
	}
}

func (s *Service) createRunningLogRecord(ctx context.Context, job Job, meta jobRunContext) (int64, error) {
	if s == nil || s.repo == nil {
		return 0, ErrServiceUnavailable
	}
	if ctx == nil {
		ctx = context.Background()
	}

	message := resolveRunMessage(meta)
	detail := fmt.Sprintf("%s | 执行中", message)

	record := &model.SysJobLog{
		JobID:        job.JobID,
		JobName:      job.JobName,
		JobGroup:     job.JobGroup,
		InvokeTarget: job.InvokeTarget,
		InvokeParams: rawJSONText(job.InvokeParams),
		Status:       "2",
		JobMessage:   &detail,
	}

	now := time.Now()
	record.CreateTime = &now

	if err := s.repo.CreateJobLog(ctx, record); err != nil {
		if s.logger != nil {
			s.logger.Error("create running job log failed", "jobID", job.JobID, "error", err)
		}
		return 0, err
	}

	return record.JobLogID, nil
}

func (s *Service) newStepLogger(jobLogID int64) *StepLogger {
	if s == nil || jobLogID == 0 {
		return nil
	}

	return NewStepLogger(jobLogID, s.repo, func(event *StepEvent) {
		if s.streams != nil && event != nil {
			s.streams.Publish(jobLogID, event)
		}
	})
}

func (s *Service) attachRunningState(ctx context.Context, jobs []Job) {
	if s == nil || s.repo == nil || len(jobs) == 0 {
		return
	}

	if ctx == nil {
		ctx = context.Background()
	}

	ids := make([]int64, 0, len(jobs))
	for i := range jobs {
		ids = append(ids, jobs[i].JobID)
	}

	runningLogs, err := s.repo.GetLatestLogsByStatus(ctx, ids, []string{"2"})
	if err != nil {
		if s.logger != nil {
			s.logger.Warn("load running job logs failed", "error", err)
		}
		return
	}

	for i := range jobs {
		if log, ok := runningLogs[jobs[i].JobID]; ok {
			jobs[i].IsRunning = true
			logID := log.JobLogID
			jobs[i].CurrentLogID = &logID
		}
	}
}

func (s *Service) isJobRunning(ctx context.Context, jobID int64) bool {
	if s == nil || s.repo == nil || jobID == 0 {
		return false
	}

	ids := []int64{jobID}
	if ctx == nil {
		ctx = context.Background()
	}

	logs, err := s.repo.GetLatestLogsByStatus(ctx, ids, []string{"2"})
	if err != nil {
		if s.logger != nil {
			s.logger.Warn("check running job failed", "jobID", jobID, "error", err)
		}
		return false
	}

	_, ok := logs[jobID]
	return ok
}

func (s *Service) SubscribeLogStream(jobLogID int64) (<-chan *StepEvent, func()) {
	if s == nil || s.streams == nil || jobLogID <= 0 {
		return nil, func() {}
	}

	return s.streams.Subscribe(jobLogID)
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
