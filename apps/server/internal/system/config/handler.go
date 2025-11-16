package config

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/middleware"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type listConfigQuery struct {
	ConfigName string `form:"configName"`
	ConfigKey  string `form:"configKey"`
	ConfigType string `form:"configType"`
}

type createConfigRequest struct {
	ConfigName  string  `json:"configName" binding:"required"`
	ConfigKey   string  `json:"configKey" binding:"required"`
	ConfigValue string  `json:"configValue" binding:"required"`
	ConfigType  string  `json:"configType"`
	Remark      *string `json:"remark"`
}

type updateConfigRequest struct {
	ConfigName  *string `json:"configName"`
	ConfigKey   *string `json:"configKey"`
	ConfigValue *string `json:"configValue"`
	ConfigType  *string `json:"configType"`
	Remark      *string `json:"remark"`
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
// @Summary 获取参数配置列表
// @Description 按名称、Key、类型过滤配置
// @Tags System/Config
// @Security BearerAuth
// @Produce json
// @Param configName query string false "参数名称"
// @Param configKey query string false "参数Key"
// @Param configType query string false "参数类型"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/configs [get]
func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("config service unavailable"))
		return
	}

	var query listConfigQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	items, err := h.service.ListConfigs(ctx.Request.Context(), ListOptions{
		ConfigName: query.ConfigName,
		ConfigKey:  query.ConfigKey,
		ConfigType: query.ConfigType,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load configs"))
		return
	}

	resp.OK(ctx, resp.WithData(items))
}

// Get godoc
// @Summary 获取参数配置详情
// @Description 根据ID查询配置
// @Tags System/Config
// @Security BearerAuth
// @Produce json
// @Param id path int true "配置ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/configs/{id} [get]
func (h *Handler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("config service unavailable"))
		return
	}

	id, err := parseConfigID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid config id"))
		return
	}

	item, err := h.service.GetConfig(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("config not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load config"))
		return
	}

	resp.OK(ctx, resp.WithData(item))
}

// Create godoc
// @Summary 新增参数配置
// @Description 创建一条系统配置
// @Tags System/Config
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body createConfigRequest true "配置参数"
// @Success 201 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/configs [post]
func (h *Handler) Create(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("config service unavailable"))
		return
	}

	var payload createConfigRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid config payload"))
		return
	}

	operator := resolveOperator(ctx)
	item, err := h.service.CreateConfig(ctx.Request.Context(), CreateConfigInput{
		ConfigName:  payload.ConfigName,
		ConfigKey:   payload.ConfigKey,
		ConfigValue: payload.ConfigValue,
		ConfigType:  payload.ConfigType,
		Remark:      payload.Remark,
		Operator:    operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrConfigNameRequired),
			errors.Is(err, ErrConfigKeyRequired),
			errors.Is(err, ErrConfigValueRequired),
			errors.Is(err, ErrInvalidConfigType):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		case errors.Is(err, ErrDuplicateConfigKey):
			resp.Conflict(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create config"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(item))
}

// Update godoc
// @Summary 修改参数配置
// @Description 更新配置项
// @Tags System/Config
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "配置ID"
// @Param request body updateConfigRequest true "配置参数"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/configs/{id} [put]
func (h *Handler) Update(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("config service unavailable"))
		return
	}

	id, err := parseConfigID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid config id"))
		return
	}

	var payload updateConfigRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid config payload"))
		return
	}

	operator := resolveOperator(ctx)
	item, err := h.service.UpdateConfig(ctx.Request.Context(), UpdateConfigInput{
		ID:          id,
		ConfigName:  payload.ConfigName,
		ConfigKey:   payload.ConfigKey,
		ConfigValue: payload.ConfigValue,
		ConfigType:  payload.ConfigType,
		Remark:      payload.Remark,
		Operator:    operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("config not found"))
		case errors.Is(err, ErrConfigNameRequired),
			errors.Is(err, ErrConfigKeyRequired),
			errors.Is(err, ErrConfigValueRequired),
			errors.Is(err, ErrInvalidConfigType):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		case errors.Is(err, ErrDuplicateConfigKey):
			resp.Conflict(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update config"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(item))
}

// Delete godoc
// @Summary 删除参数配置
// @Description 根据ID删除配置
// @Tags System/Config
// @Security BearerAuth
// @Produce json
// @Param id path int true "配置ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/configs/{id} [delete]
func (h *Handler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("config service unavailable"))
		return
	}

	id, err := parseConfigID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid config id"))
		return
	}

	if err := h.service.DeleteConfig(ctx.Request.Context(), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("config not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete config"))
		return
	}

	resp.NoContent(ctx)
}

func parseConfigID(value string) (int64, error) {
	return strconv.ParseInt(value, 10, 64)
}

func resolveOperator(ctx *gin.Context) string {
	id, ok := middleware.GetUserID(ctx)
	if !ok {
		return ""
	}
	return strconv.FormatUint(uint64(id), 10)
}
