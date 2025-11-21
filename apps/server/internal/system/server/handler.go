package server

import (
	"encoding/json"
	"net/http"
	"time"

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

// Status godoc
// @Summary 服务器监控
// @Description 获取 CPU、内存、磁盘等服务器指标
// @Tags Monitor/Server
// @Security BearerAuth
// @Produce json
// @Success 200 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/server [get]
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

// Stream godoc
// @Summary 服务器监控流
// @Description 使用 SSE 推送服务器指标，首次返回完整数据，后续仅返回有变动的字段
// @Tags Monitor/Server
// @Security BearerAuth
// @Produce text/event-stream
// @Success 200 {string} string "event stream"
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/server/stream [get]
func (h *Handler) Stream(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("server monitor service unavailable"))
		return
	}

	flusher, ok := ctx.Writer.(http.Flusher)
	if !ok {
		resp.InternalServerError(ctx, resp.WithMessage("streaming unsupported"))
		return
	}

	ctx.Writer.Header().Set("Content-Type", "text/event-stream")
	ctx.Writer.Header().Set("Cache-Control", "no-cache")
	ctx.Writer.Header().Set("Connection", "keep-alive")

	status, _, err := h.service.SnapAndDiff(ctx.Request.Context())
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to collect server metrics"))
		return
	}

	if err := writeSSE(ctx, "snapshot", status); err != nil {
		return
	}
	flusher.Flush()

	for {
		if ctx.Err() != nil {
			return
		}
		_, patch, err := h.service.SnapAndDiff(ctx.Request.Context())
		if err == nil && patch != nil {
			if err := writeSSE(ctx, "update", patch); err != nil {
				return
			}
			flusher.Flush()
		}
		time.Sleep(time.Second)
	}
}

func writeSSE(ctx *gin.Context, event string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	if _, err := ctx.Writer.Write([]byte("event: " + event + "\n")); err != nil {
		return err
	}
	if _, err := ctx.Writer.Write([]byte("data: ")); err != nil {
		return err
	}
	if _, err := ctx.Writer.Write(data); err != nil {
		return err
	}
	_, err = ctx.Writer.Write([]byte("\n\n"))
	return err
}
