package job

import (
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/config"
	jobexec "github.com/starter-kit-fe/admin/internal/system/job/executor"
	jobservice "github.com/starter-kit-fe/admin/internal/system/job/service"
	jobtypes "github.com/starter-kit-fe/admin/internal/system/job/types"
)

type Service = jobservice.Service
type ServiceOptions = jobservice.ServiceOptions
type Executor = jobtypes.Executor
type ExecutionPayload = jobtypes.ExecutionPayload
type StepLoggerInterface = jobtypes.StepLoggerInterface
type StepEvent = jobtypes.StepEvent
type StepInterface = jobtypes.StepInterface

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

type BackupExecutor = jobexec.BackupExecutor
type BackupParams = jobexec.BackupParams

var (
	ErrServiceUnavailable = jobservice.ErrServiceUnavailable
	ErrJobRunningConflict = jobservice.ErrJobRunningConflict
	ErrJobRunningActive   = jobservice.ErrJobRunningActive
)

func NewService(repo *Repository, opts ServiceOptions) *Service {
	return jobservice.NewService(repo, opts)
}

func NewBackupExecutor(db *gorm.DB, cfg *config.Config) Executor {
	return jobexec.NewBackupExecutor(db, cfg)
}
