package cache

import (
	"strconv"
	"strings"

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

func (h *Handler) Overview(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("cache monitor unavailable"))
		return
	}

	status, err := h.service.Overview(ctx.Request.Context())
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to fetch cache overview"))
		return
	}

	resp.OK(ctx, resp.WithData(status))
}

func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("cache monitor unavailable"))
		return
	}

	pageNum := parseQueryInt(ctx.Query("pageNum"), 1)
	pageSize := parseQueryInt(ctx.Query("pageSize"), defaultPageSize)
	pattern := strings.TrimSpace(ctx.Query("pattern"))
	db := parseQueryInt(ctx.Query("db"), 0)

	result, err := h.service.ListKeys(ctx.Request.Context(), ListOptions{
		PageNum:  pageNum,
		PageSize: pageSize,
		Pattern:  pattern,
		DB:       db,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to fetch cache keys"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

func parseQueryInt(raw string, fallback int) int {
	if strings.TrimSpace(raw) == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}
