package service

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
	"github.com/hibiken/asynq"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	jobasynq "github.com/starter-kit-fe/admin/internal/system/job/asynq"
	"github.com/starter-kit-fe/admin/internal/system/job/repository"
	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

var (
	ErrServiceUnavailable = errors.New("job service is not initialized")
	ErrJobRunningConflict = errors.New("job is running and concurrency is disabled")
	ErrJobRunningActive   = errors.New("job is running; stop it before clearing logs")
	errInvalidJSON        = errors.New("invoke params must be valid JSON")

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

// Service manages scheduled jobs with Asynq-based task queue
type Service struct {
	repo           *repository.Repository
	registry       *executorRegistry
	logger         *slog.Logger
	redis          *redis.Client
	defaultLockTTL time.Duration
	streams        *logStreamHub

	// Asynq components
	asynqClient    *jobasynq.Client
	asynqServer    *jobasynq.Server
	asynqScheduler *jobasynq.Scheduler
	redisOpt       asynq.RedisClientOpt

	mu         sync.RWMutex
	jobs       map[int64]*jobScheduleEntry
	lockMisses map[int64]uint64
	started    bool
}

// ServiceOptions configures the job service
type ServiceOptions struct {
	Logger         *slog.Logger
	Redis          *redis.Client
	RedisAddr      string
	RedisPassword  string
	RedisDB        int
	DefaultLockTTL time.Duration
	Concurrency    int
}

// jobScheduleEntry tracks a scheduled job
type jobScheduleEntry struct {
	job     types.Job
	entryID string
}

// jobRunContext holds metadata about a job run
type jobRunContext struct {
	Source  string
	Message string
}

type jobRunContextKey struct{}

// jobRunOptions holds options for a job run
type jobRunOptions struct {
	logID int64
}

// NewService creates a new job service with Asynq integration
func NewService(repo *repository.Repository, opts ServiceOptions) *Service {
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

	// Build Redis connection options for Asynq
	redisAddr := opts.RedisAddr
	if redisAddr == "" && opts.Redis != nil {
		// Try to get from Redis client options
		redisAddr = "localhost:6379"
	}

	redisOpt := asynq.RedisClientOpt{
		Addr:     redisAddr,
		Password: opts.RedisPassword,
		DB:       opts.RedisDB,
	}

	concurrency := opts.Concurrency
	if concurrency <= 0 {
		concurrency = 10
	}

	return &Service{
		repo:           repo,
		registry:       newExecutorRegistry(),
		logger:         logger,
		redis:          opts.Redis,
		defaultLockTTL: lockTTL,
		streams:        newLogStreamHub(),
		redisOpt:       redisOpt,
		asynqClient:    jobasynq.NewClientFromRedisOpt(redisOpt),
		asynqServer:    jobasynq.NewServerFromRedisOpt(redisOpt, concurrency, logger),
		asynqScheduler: jobasynq.NewSchedulerFromRedisOpt(redisOpt, logger),
		jobs:           make(map[int64]*jobScheduleEntry),
		lockMisses:     make(map[int64]uint64),
	}
}

// RegisterExecutor registers an executor for a job type
func (s *Service) RegisterExecutor(key string, exec types.Executor) error {
	if s == nil {
		return ErrServiceUnavailable
	}
	return s.registry.Register(key, exec)
}

// GetAsynqServer returns the Asynq server for external handler registration
func (s *Service) GetAsynqServer() *jobasynq.Server {
	if s == nil {
		return nil
	}
	return s.asynqServer
}

// GetAsynqClient returns the Asynq client for enqueueing tasks
func (s *Service) GetAsynqClient() *jobasynq.Client {
	if s == nil {
		return nil
	}
	return s.asynqClient
}

// ListJobs returns a paginated list of jobs
func (s *Service) ListJobs(ctx context.Context, opts types.ListJobsOptions) (*types.ListResult, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	records, total, err := s.repo.ListJobs(ctx, opts)
	if err != nil {
		return nil, err
	}

	items := make([]types.Job, 0, len(records))
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

	return &types.ListResult{
		List:     items,
		Total:    total,
		PageNum:  pageNum,
		PageSize: pageSize,
	}, nil
}

// GetJob returns a single job by ID
func (s *Service) GetJob(ctx context.Context, id int64) (*types.Job, error) {
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

// GetJobLog returns a single job log by ID
func (s *Service) GetJobLog(ctx context.Context, id int64) (*types.JobLog, error) {
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

// GetJobLogSteps returns the steps for a job log
func (s *Service) GetJobLogSteps(ctx context.Context, logID int64) ([]types.JobLogStep, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	if _, err := s.repo.GetJobLog(ctx, logID); err != nil {
		return nil, err
	}

	records, err := s.repo.GetJobLogSteps(ctx, logID)
	if err != nil {
		return nil, err
	}

	steps := make([]types.JobLogStep, 0, len(records))
	for i := range records {
		steps = append(steps, jobLogStepFromModel(&records[i]))
	}

	return steps, nil
}

// GetJobDetail returns a job with its logs
func (s *Service) GetJobDetail(ctx context.Context, id int64, opts types.ListJobLogsOptions) (*types.JobDetail, error) {
	job, err := s.GetJob(ctx, id)
	if err != nil {
		return nil, err
	}

	jobData := *job
	jobSlice := []types.Job{jobData}
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
		logIDs = append(logIDs, int64(records[i].ID))
	}

	stepsMap, stepsErr := s.repo.ListJobLogSteps(ctx, logIDs)
	if stepsErr != nil && s.logger != nil {
		s.logger.Warn("load job log steps failed", "jobID", id, "error", stepsErr)
	}

	logs := make([]types.JobLog, 0, len(records))
	for i := range records {
		log := jobLogFromModel(&records[i])
		if stepRecords, ok := stepsMap[log.JobLogID]; ok {
			for j := range stepRecords {
				log.Steps = append(log.Steps, jobLogStepFromModel(&stepRecords[j]))
			}
		}
		logs = append(logs, log)
	}

	return &types.JobDetail{
		Job:              jobData,
		InvokeParamsText: rawJSONText(jobData.InvokeParams),
		Logs: types.JobLogList{
			List:     logs,
			Total:    total,
			PageNum:  opts.PageNum,
			PageSize: opts.PageSize,
		},
	}, nil
}

// CreateJob creates a new scheduled job
func (s *Service) CreateJob(ctx context.Context, input types.CreateJobInput) (*types.Job, error) {
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

	job, err := s.GetJob(ctx, int64(record.ID))
	if err != nil {
		return nil, err
	}
	if err := s.configureSchedule(*job); err != nil && s.logger != nil {
		s.logger.Error("configure job schedule failed", "jobID", job.JobID, "error", err)
	}
	return job, nil
}

// UpdateJob updates an existing job
func (s *Service) UpdateJob(ctx context.Context, input types.UpdateJobInput) (*types.Job, error) {
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
	values["updated_at"] = now

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

// DeleteJob removes a job
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

// ClearJobLogs removes all logs for a job
func (s *Service) ClearJobLogs(ctx context.Context, id int64, operator string) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}

	if _, err := s.GetJob(ctx, id); err != nil {
		return err
	}

	if s.isJobRunning(ctx, id) {
		return ErrJobRunningActive
	}

	if err := s.repo.DeleteJobLogs(ctx, id); err != nil {
		return err
	}

	return s.repo.UpdateJob(ctx, id, map[string]interface{}{
		"update_by":  sanitizeOperator(operator),
		"updated_at": time.Now(),
	})
}

// ChangeStatus changes a job's status
func (s *Service) ChangeStatus(ctx context.Context, id int64, status, operator string) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	status = strings.TrimSpace(status)
	if _, ok := validStatusValues[status]; !ok {
		return errors.New("invalid job status")
	}
	if err := s.repo.UpdateJob(ctx, id, map[string]interface{}{
		"status":     status,
		"update_by":  sanitizeOperator(operator),
		"updated_at": time.Now(),
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

// TriggerJob manually triggers a job execution
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

	// Enqueue task via Asynq
	payload := jobasynq.JobExecutionPayload{
		JobID:        job.JobID,
		JobName:      job.JobName,
		JobGroup:     job.JobGroup,
		InvokeTarget: job.InvokeTarget,
		InvokeParams: job.InvokeParams,
		Source:       "manual",
		Message:      "手动触发",
		LogID:        logID,
	}

	if s.asynqClient != nil {
		_, err := s.asynqClient.EnqueueTask(ctx, jobasynq.TypeJobExecution, payload,
			asynq.Queue(jobasynq.QueueDefault),
			asynq.MaxRetry(0), // No retry for manual triggers
		)
		if err != nil {
			s.logger.Error("enqueue job task failed", "jobID", job.JobID, "error", err)
			// Fall back to direct execution
			s.dispatchJob(*job, meta, jobRunOptions{logID: logID})
		}
	} else {
		s.dispatchJob(*job, meta, jobRunOptions{logID: logID})
	}

	return logID, s.repo.UpdateJob(ctx, id, map[string]interface{}{
		"update_by":  sanitizeOperator(operator),
		"updated_at": time.Now(),
	})
}

// Start starts the job scheduler
func (s *Service) Start(ctx context.Context) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}

	s.mu.Lock()
	if s.started {
		s.mu.Unlock()
		return nil
	}
	s.started = true
	s.mu.Unlock()

	// Register job execution handler
	s.asynqServer.HandleFunc(jobasynq.TypeJobExecution, s.handleJobExecution)
	s.asynqServer.Use(jobasynq.LoggingMiddleware(s.logger))
	s.asynqServer.Use(jobasynq.RecoveryMiddleware(s.logger))

	// Start Asynq server
	if err := s.asynqServer.Start(); err != nil {
		s.logger.Error("failed to start asynq server", "error", err)
		return err
	}

	// Start Asynq scheduler
	if err := s.asynqScheduler.Start(); err != nil {
		s.logger.Error("failed to start asynq scheduler", "error", err)
		return err
	}

	// Load enabled jobs into scheduler
	if err := s.loadEnabledJobs(ctx); err != nil {
		return err
	}

	s.logger.Info("job scheduler started with Asynq")
	return nil
}

// Stop stops the job scheduler
func (s *Service) Stop() {
	if s == nil {
		return
	}

	s.mu.Lock()
	s.started = false
	s.jobs = make(map[int64]*jobScheduleEntry)
	s.lockMisses = make(map[int64]uint64)
	s.mu.Unlock()

	if s.asynqScheduler != nil {
		_ = s.asynqScheduler.Stop()
	}

	if s.asynqServer != nil {
		s.asynqServer.Stop()
	}

	if s.asynqClient != nil {
		_ = s.asynqClient.Close()
	}

	s.logger.Info("job scheduler stopped")
}

// handleJobExecution is the Asynq handler for job execution tasks
func (s *Service) handleJobExecution(ctx context.Context, task *asynq.Task) error {
	payload, err := jobasynq.ParseJobExecutionPayload(task)
	if err != nil {
		return fmt.Errorf("parse job execution payload: %w", err)
	}

	job := types.Job{
		JobID:        payload.JobID,
		JobName:      payload.JobName,
		JobGroup:     payload.JobGroup,
		InvokeTarget: payload.InvokeTarget,
		InvokeParams: payload.InvokeParams,
	}

	meta := jobRunContext{
		Source:  payload.Source,
		Message: payload.Message,
	}

	opts := jobRunOptions{
		logID: payload.LogID,
	}

	runCtx := withRunContext(ctx, meta)
	s.executeJob(runCtx, job, opts)
	return nil
}

// loadEnabledJobs loads all enabled jobs into the scheduler
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

// configureSchedule adds or removes a job from the scheduler
func (s *Service) configureSchedule(job types.Job) error {
	if s == nil {
		return nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.detachLocked(job.JobID)

	entry := &jobScheduleEntry{job: job}

	// Only schedule if job is enabled (status = "0")
	if job.Status == "0" && s.asynqScheduler != nil {
		payload := jobasynq.JobExecutionPayload{
			JobID:        job.JobID,
			JobName:      job.JobName,
			JobGroup:     job.JobGroup,
			InvokeTarget: job.InvokeTarget,
			InvokeParams: job.InvokeParams,
			Source:       "cron",
			Message:      "定时调度",
		}

		err := s.asynqScheduler.ScheduleJob(job.JobID, job.CronExpression, payload,
			asynq.Queue(jobasynq.QueueDefault),
		)
		if err != nil {
			return err
		}

		if entryID, ok := s.asynqScheduler.GetEntryID(job.JobID); ok {
			entry.entryID = entryID
		}

		if s.logger != nil {
			s.logger.Info("job scheduled", "jobID", job.JobID, "spec", job.CronExpression)
		}
	}

	s.jobs[job.JobID] = entry
	return nil
}

// detachLocked removes a job from the scheduler (must hold lock)
func (s *Service) detachLocked(jobID int64) {
	if entry, ok := s.jobs[jobID]; ok {
		if s.asynqScheduler != nil {
			_ = s.asynqScheduler.UnscheduleJob(jobID)
		}
		entry.entryID = ""
		delete(s.jobs, jobID)
	}
}

// dispatchJob runs a job directly (fallback when Asynq is unavailable)
func (s *Service) dispatchJob(job types.Job, meta jobRunContext, opts jobRunOptions) {
	if s == nil {
		return
	}
	if strings.TrimSpace(meta.Source) == "" {
		meta.Source = "manual"
	}
	if strings.TrimSpace(meta.Message) == "" {
		meta.Message = "手动触发"
	}
	go func() {
		ctx := withRunContext(context.Background(), meta)
		s.executeJob(ctx, job, opts)
	}()
}

// tryAcquireLock attempts to acquire a distributed lock for a job
func (s *Service) tryAcquireLock(ctx context.Context, job types.Job) (func(context.Context) error, bool, error) {
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

// resolveLockTTL determines the lock TTL for a job
func (s *Service) resolveLockTTL(job types.Job) time.Duration {
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

// incrementLockMiss tracks lock miss counts
func (s *Service) incrementLockMiss(jobID int64) uint64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	next := s.lockMisses[jobID] + 1
	s.lockMisses[jobID] = next
	return next
}

// withRunContext adds run context to a context
func withRunContext(ctx context.Context, meta jobRunContext) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}
	return context.WithValue(ctx, jobRunContextKey{}, meta)
}

// runContextFrom extracts run context from a context
func runContextFrom(ctx context.Context) jobRunContext {
	if ctx == nil {
		return jobRunContext{}
	}
	if meta, ok := ctx.Value(jobRunContextKey{}).(jobRunContext); ok {
		return meta
	}
	return jobRunContext{}
}

// resolveRunMessage determines the message for a job run
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
