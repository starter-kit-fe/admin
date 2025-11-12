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

// List godoc
// @Summary 获取操作日志
// @Description 按标题、业务类型、状态等分页查询
// @Tags Monitor/OperLog
// @Security BearerAuth
// @Produce json
// @Param pageNum query int false "页码"
// @Param pageSize query int false "每页数量"
// @Param title query string false "模块标题"
// @Param businessType query string false "业务类型"
// @Param status query string false "状态"
// @Param operName query string false "操作人员"
// @Param requestMethod query string false "请求方法"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/logs/operations [get]
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

// Get godoc
// @Summary 获取操作日志详情
// @Description 根据ID查看操作日志
// @Tags Monitor/OperLog
// @Security BearerAuth
// @Produce json
// @Param id path int true "日志ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/logs/operations/{id} [get]
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

// Delete godoc
// @Summary 删除操作日志
// @Description 根据ID删除操作日志
// @Tags Monitor/OperLog
// @Security BearerAuth
// @Produce json
// @Param id path int true "日志ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/logs/operations/{id} [delete]
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
