package online

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/pkg/resp"
)

type listOnlineQuery struct {
	PageNum  int    `form:"pageNum"`
	PageSize int    `form:"pageSize"`
	UserName string `form:"userName"`
	IPAddr   string `form:"ipaddr"`
	Since    string `form:"since"`
}

type batchLogoutRequest struct {
	IDs []string `json:"ids"`
}

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	if service == nil {
		return nil
	}
	return &Handler{service: service}
}

func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("online service unavailable"))
		return
	}

	var query listOnlineQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	opts := ListOptions{
		PageNum:  query.PageNum,
		PageSize: query.PageSize,
		UserName: query.UserName,
		IPAddr:   query.IPAddr,
	}

	if since := strings.TrimSpace(query.Since); since != "" {
		if ts, err := time.Parse(time.RFC3339, since); err == nil {
			opts.Since = ts
		}
	}

	result, err := h.service.ListOnlineUsers(ctx.Request.Context(), opts)
	if err != nil {
		if errors.Is(err, ErrServiceUnavailable) {
			resp.ServiceUnavailable(ctx, resp.WithMessage("online service unavailable"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load online users"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

func (h *Handler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("online service unavailable"))
		return
	}

	sessionID := strings.TrimSpace(ctx.Param("id"))
	if sessionID == "" {
		resp.BadRequest(ctx, resp.WithMessage("invalid session id"))
		return
	}

	item, err := h.service.GetOnlineUser(ctx.Request.Context(), sessionID)
	if err != nil {
		switch {
		case errors.Is(err, ErrSessionNotFound):
			resp.NotFound(ctx, resp.WithMessage("online user not found"))
		case errors.Is(err, ErrServiceUnavailable):
			resp.ServiceUnavailable(ctx, resp.WithMessage("online service unavailable"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to load online user"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(item))
}

func (h *Handler) ForceLogout(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("online service unavailable"))
		return
	}

	sessionID := strings.TrimSpace(ctx.Param("id"))
	if sessionID == "" {
		resp.BadRequest(ctx, resp.WithMessage("invalid session id"))
		return
	}

	if err := h.service.ForceLogout(ctx.Request.Context(), sessionID); err != nil {
		switch {
		case errors.Is(err, ErrSessionNotFound):
			resp.NotFound(ctx, resp.WithMessage("online user not found"))
		case errors.Is(err, ErrServiceUnavailable):
			resp.ServiceUnavailable(ctx, resp.WithMessage("online service unavailable"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to force logout"))
		}
		return
	}

	resp.Success(ctx, true)
}

func (h *Handler) BatchForceLogout(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("online service unavailable"))
		return
	}

	var payload batchLogoutRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid request payload"))
		return
	}

	ids := normalizeIDs(payload.IDs)
	if len(ids) == 0 {
		resp.BadRequest(ctx, resp.WithMessage("no sessions provided"))
		return
	}

	count, err := h.service.BatchForceLogout(ctx.Request.Context(), ids)
	if err != nil {
		if errors.Is(err, ErrServiceUnavailable) {
			resp.ServiceUnavailable(ctx, resp.WithMessage("online service unavailable"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to batch force logout"))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "操作成功",
		"data": gin.H{
			"count": count,
		},
	})
}

func normalizeIDs(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	normalized := make([]string, 0, len(values))
	for _, value := range values {
		id := strings.TrimSpace(value)
		if id == "" {
			continue
		}
		if _, err := strconv.Atoi(id); err == nil {
			normalized = append(normalized, id)
			continue
		}
		// allow non-numeric identifiers as well
		normalized = append(normalized, id)
	}
	return normalized
}
