package app

import (
	"context"
	"time"

	"github.com/starter-kit-fe/admin/internal/audit"
	"github.com/starter-kit-fe/admin/internal/system/loginlog"
	"github.com/starter-kit-fe/admin/internal/system/operlog"
	"github.com/starter-kit-fe/admin/internal/system/user"
)

type operationLoggerAdapter struct {
	svc *operlog.Service
}

func (a operationLoggerAdapter) RecordOperation(ctx context.Context, entry audit.OperationEntry) error {
	if a.svc == nil {
		return nil
	}
	payload := operlog.CreateOperLogInput{
		Title:         entry.Title,
		BusinessType:  entry.BusinessType,
		Method:        entry.Method,
		RequestMethod: entry.RequestMethod,
		OperatorType:  entry.OperatorType,
		OperName:      entry.OperatorName,
		DeptName:      entry.DeptName,
		OperURL:       entry.URL,
		OperIP:        entry.IP,
		OperLocation:  entry.Location,
		OperParam:     entry.RequestBody,
		JSONResult:    entry.ResponseBody,
		Status:        entry.Status,
		ErrorMsg:      entry.ErrorMessage,
		CostTime:      entry.CostMillis,
	}
	if entry.OccurredAt > 0 {
		ts := time.UnixMilli(entry.OccurredAt)
		payload.OperTime = &ts
	}
	return a.svc.RecordOperLog(ctx, payload)
}

type loginLoggerAdapter struct {
	svc *loginlog.Service
}

func (a loginLoggerAdapter) RecordLogin(ctx context.Context, entry audit.LoginEntry) error {
	if a.svc == nil {
		return nil
	}
	payload := loginlog.CreateLoginLogInput{
		UserName:      entry.UserName,
		IPAddr:        entry.IP,
		LoginLocation: entry.Location,
		Browser:       entry.Browser,
		OS:            entry.OS,
		Status:        entry.Status,
		Msg:           entry.Message,
	}
	if entry.OccurredAt > 0 {
		ts := time.UnixMilli(entry.OccurredAt)
		payload.LoginTime = &ts
	}
	return a.svc.RecordLoginLog(ctx, payload)
}

type userResolverAdapter struct {
	repo *user.Repository
}

func (r userResolverAdapter) Resolve(ctx context.Context, userID uint) (*audit.UserIdentity, error) {
	if r.repo == nil {
		return nil, nil
	}
	record, err := r.repo.GetUser(ctx, int64(userID))
	if err != nil {
		return nil, err
	}
	identity := &audit.UserIdentity{
		UserName: record.UserName,
	}
	if record.DeptID != nil {
		depts, err := r.repo.GetDepartments(ctx, []int64{*record.DeptID})
		if err == nil {
			if dept, ok := depts[*record.DeptID]; ok {
				identity.DeptName = dept.DeptName
			}
		}
	}
	return identity, nil
}
