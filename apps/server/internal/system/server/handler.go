package server

import (
	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/pkg/resp"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	if service == nil {
		return nil
	}
	return &Handler{service: service}
}

func (h *Handler) Status(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("server monitor service unavailable"))
		return
	}

	status, err := h.service.GetStatus(ctx.Request.Context())
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to collect server metrics"))
		return
	}

	resp.OK(ctx, resp.WithData(status))
}
