package job

import (
	jobhandler "github.com/starter-kit-fe/admin/internal/system/job/handler"
)

type Handler = jobhandler.Handler

func NewHandler(service *Service) *Handler {
	return jobhandler.NewHandler(service)
}
