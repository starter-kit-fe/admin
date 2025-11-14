package loginlog

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/pkg/resp"
)

type listLoginLogQuery struct {
	PageNum  int    `form:"pageNum"`
	PageSize int    `form:"pageSize"`
	UserName string `form:"userName"`
	Status   string `form:"status"`
	IPAddr   string `form:"ipaddr"`
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
// @Summary 获取登录日志
// @Description 按用户、状态、IP分页查询登录日志
// @Tags Monitor/LoginLog
// @Security BearerAuth
// @Produce json
// @Param pageNum query int false "页码"
// @Param pageSize query int false "每页数量"
// @Param userName query string false "用户名"
// @Param status query string false "状态"
// @Param ipaddr query string false "IP地址"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/logs/login [get]
func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("login log service unavailable"))
		return
	}

	var query listLoginLogQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	result, err := h.service.ListLoginLogs(ctx.Request.Context(), ListOptions{
		PageNum:  query.PageNum,
		PageSize: query.PageSize,
		UserName: query.UserName,
		Status:   query.Status,
		IPAddr:   query.IPAddr,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load login logs"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

// Get godoc
// @Summary 获取登录日志详情
// @Description 根据ID查看登录日志
// @Tags Monitor/LoginLog
// @Security BearerAuth
// @Produce json
// @Param id path int true "日志ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/logs/login/{id} [get]
func (h *Handler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("login log service unavailable"))
		return
	}

	id, err := parseLoginLogID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid login log id"))
		return
	}

	item, err := h.service.GetLoginLog(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("login log not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load login log"))
		return
	}

	resp.OK(ctx, resp.WithData(item))
}

// Delete godoc
// @Summary 删除登录日志
// @Description 根据ID删除登录日志
// @Tags Monitor/LoginLog
// @Security BearerAuth
// @Produce json
// @Param id path int true "日志ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/monitor/logs/login/{id} [delete]
func (h *Handler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("login log service unavailable"))
		return
	}

	id, err := parseLoginLogID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid login log id"))
		return
	}

	if err := h.service.DeleteLoginLog(ctx.Request.Context(), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("login log not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete login log"))
		return
	}

	resp.NoContent(ctx)
}

func parseLoginLogID(value string) (int64, error) {
	return strconv.ParseInt(value, 10, 64)
}
