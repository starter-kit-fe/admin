package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/starter-kit-fe/admin/internal/model"
	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

// validateOptions holds validation parameters
type validateOptions struct {
	isCreate bool
	create   *types.CreateJobInput
	update   *types.UpdateJobInput
}

// validateAndBuildRecord validates input and builds a job record
func (s *Service) validateAndBuildRecord(ctx context.Context, opts validateOptions) (*model.SysJob, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

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
			UpdateBy:       operator,
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

// Unused function kept for compatibility
func formatTimeValue(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.Format("2006-01-02 15:04:05")
}
