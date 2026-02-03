package job

import (
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/config"
	jobasynq "github.com/starter-kit-fe/admin/internal/system/job/asynq"
	jobexec "github.com/starter-kit-fe/admin/internal/system/job/executor"
	jobservice "github.com/starter-kit-fe/admin/internal/system/job/service"
	jobtypes "github.com/starter-kit-fe/admin/internal/system/job/types"
)

// Service types
type Service = jobservice.Service
type ServiceOptions = jobservice.ServiceOptions

// Executor types
type Executor = jobtypes.Executor
type ExecutionPayload = jobtypes.ExecutionPayload
type StepLoggerInterface = jobtypes.StepLoggerInterface
type StepEvent = jobtypes.StepEvent
type StepInterface = jobtypes.StepInterface

// Job data types
type ListResult = jobtypes.ListResult
type Job = jobtypes.Job
type JobLog = jobtypes.JobLog
type JobLogStep = jobtypes.JobLogStep
type JobLogList = jobtypes.JobLogList
type JobDetail = jobtypes.JobDetail
type ListJobLogsOptions = jobtypes.ListJobLogsOptions
type ListJobsOptions = jobtypes.ListJobsOptions
type CreateJobInput = jobtypes.CreateJobInput
type UpdateJobInput = jobtypes.UpdateJobInput

// Executor implementations
type BackupExecutor = jobexec.BackupExecutor
type BackupParams = jobexec.BackupParams

// Asynq types
type AsynqClient = jobasynq.Client
type AsynqServer = jobasynq.Server
type AsynqScheduler = jobasynq.Scheduler
type JobExecutionPayload = jobasynq.JobExecutionPayload

// Errors
var (
	ErrServiceUnavailable = jobservice.ErrServiceUnavailable
	ErrJobRunningConflict = jobservice.ErrJobRunningConflict
	ErrJobRunningActive   = jobservice.ErrJobRunningActive
)

// Asynq task types
const (
	TypeJobExecution = jobasynq.TypeJobExecution
	TypeDBBackup     = jobasynq.TypeDBBackup
)

// NewService creates a new job service
func NewService(repo *Repository, opts ServiceOptions) *Service {
	return jobservice.NewService(repo, opts)
}

// NewBackupExecutor creates a backup executor
func NewBackupExecutor(db *gorm.DB, cfg *config.Config) Executor {
	return jobexec.NewBackupExecutor(db, cfg)
}
