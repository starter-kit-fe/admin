package operlog

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/pkg/resp"
)

type listOperLogQuery struct {
	PageNum       int    `form:"pageNum"`
	PageSize      int    `form:"pageSize"`
	Title         string `form:"title"`
	BusinessType  string `form:"businessType"`
	Status        string `form:"status"`
	OperName      string `form:"operName"`
	RequestMethod string `form:"requestMethod"`
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
		resp.ServiceUnavailable(ctx, resp.WithMessage("oper log service unavailable"))
		return
	}

	var query listOperLogQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	result, err := h.service.ListOperLogs(ctx.Request.Context(), ListOptions{
		PageNum:       query.PageNum,
		PageSize:      query.PageSize,
		Title:         query.Title,
		BusinessType:  query.BusinessType,
		Status:        query.Status,
		OperName:      query.OperName,
		RequestMethod: query.RequestMethod,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load operation logs"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

func (h *Handler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("oper log service unavailable"))
		return
	}

	id, err := parseOperLogID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid oper log id"))
		return
	}

	item, err := h.service.GetOperLog(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("operation log not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load operation log"))
		return
	}

	resp.OK(ctx, resp.WithData(item))
}

func (h *Handler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("oper log service unavailable"))
		return
	}

	id, err := parseOperLogID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid oper log id"))
		return
	}

	if err := h.service.DeleteOperLog(ctx.Request.Context(), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("operation log not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete operation log"))
		return
	}

	resp.NoContent(ctx)
}

func parseOperLogID(value string) (int64, error) {
	return strconv.ParseInt(value, 10, 64)
}
