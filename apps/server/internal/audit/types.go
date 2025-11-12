package audit

import (
	"context"
	"log/slog"
)

// OperationEntry captures an operation log payload detached from storage specifics.
type OperationEntry struct {
	Title         string
	BusinessType  int
	Method        string
	RequestMethod string
	OperatorType  int
	OperatorName  string
	DeptName      string
	URL           string
	IP            string
	Location      string
	RequestBody   string
	ResponseBody  string
	Status        int
	ErrorMessage  string
	OccurredAt    int64
	CostMillis    int64
}

// OperationLogger writes operation entries into the persistence layer.
type OperationLogger interface {
	RecordOperation(ctx context.Context, entry OperationEntry) error
}

// LoginEntry captures a login attempt for persistence.
type LoginEntry struct {
	UserName   string
	IP         string
	Location   string
	Browser    string
	OS         string
	Status     string
	Message    string
	OccurredAt int64
}

// LoginLogger persists login entries.
type LoginLogger interface {
	RecordLogin(ctx context.Context, entry LoginEntry) error
}

// UserIdentity represents resolved operator metadata.
type UserIdentity struct {
	UserName string
	DeptName string
}

// UserResolver resolves operator info for the given user ID.
type UserResolver interface {
	Resolve(ctx context.Context, userID uint) (*UserIdentity, error)
}

// OperationOptions tunes the middleware behaviour.
type OperationOptions struct {
	Logger         *slog.Logger
	MaxBodyBytes   int
	MaxResultBytes int
}

// LoginOptions tunes login middleware behaviour.
type LoginOptions struct {
	Logger       *slog.Logger
	MaxBodyBytes int
}
