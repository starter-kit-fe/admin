package dict

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/middleware"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type listDictsQuery struct {
	Status   string `form:"status"`
	DictName string `form:"dictName"`
	DictType string `form:"dictType"`
}

type createDictTypeRequest struct {
	DictName string  `json:"dictName" binding:"required"`
	DictType string  `json:"dictType" binding:"required"`
	Status   string  `json:"status"`
	Remark   *string `json:"remark"`
}

type updateDictTypeRequest struct {
	DictName *string `json:"dictName"`
	DictType *string `json:"dictType"`
	Status   *string `json:"status"`
	Remark   *string `json:"remark"`
}

type listDictDataQuery struct {
	Status    string `form:"status"`
	DictLabel string `form:"dictLabel"`
	DictValue string `form:"dictValue"`
}

type createDictDataRequest struct {
	DictLabel string  `json:"dictLabel" binding:"required"`
	DictValue string  `json:"dictValue" binding:"required"`
	DictSort  *int    `json:"dictSort"`
	Status    string  `json:"status"`
	IsDefault string  `json:"isDefault"`
	Remark    *string `json:"remark"`
	ListClass *string `json:"listClass"`
	CSSClass  *string `json:"cssClass"`
}

type updateDictDataRequest struct {
	DictLabel *string `json:"dictLabel"`
	DictValue *string `json:"dictValue"`
	DictSort  *int    `json:"dictSort"`
	Status    *string `json:"status"`
	IsDefault *string `json:"isDefault"`
	Remark    *string `json:"remark"`
	ListClass *string `json:"listClass"`
	CSSClass  *string `json:"cssClass"`
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
// @Summary 获取字典类型列表
// @Description 按状态、名称、类型过滤字典类型
// @Tags System/Dict
// @Security BearerAuth
// @Produce json
// @Param status query string false "字典状态"
// @Param dictName query string false "字典名称"
// @Param dictType query string false "字典类型"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/dicts [get]
func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	var query listDictsQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	items, err := h.service.ListDictTypes(ctx.Request.Context(), QueryOptions{
		Status:   query.Status,
		DictName: query.DictName,
		DictType: query.DictType,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load dictionary types"))
		return
	}

	resp.OK(ctx, resp.WithData(items))
}

// Get godoc
// @Summary 获取字典类型详情
// @Description 根据ID查询字典类型
// @Tags System/Dict
// @Security BearerAuth
// @Produce json
// @Param id path int true "字典ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/dicts/{id} [get]
func (h *Handler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	id, err := parseDictID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary id"))
		return
	}

	item, err := h.service.GetDictType(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("dictionary not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load dictionary"))
		return
	}

	resp.OK(ctx, resp.WithData(item))
}

// Create godoc
// @Summary 新增字典类型
// @Description 创建字典类型
// @Tags System/Dict
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body createDictTypeRequest true "字典类型参数"
// @Success 201 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/dicts [post]
func (h *Handler) Create(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	var payload createDictTypeRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary payload"))
		return
	}

	operator := resolveOperator(ctx)
	item, err := h.service.CreateDictType(ctx.Request.Context(), CreateDictTypeInput{
		DictName: payload.DictName,
		DictType: payload.DictType,
		Status:   payload.Status,
		Remark:   payload.Remark,
		Operator: operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrDictNameRequired),
			errors.Is(err, ErrDictTypeRequired),
			errors.Is(err, ErrInvalidDictStatus):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		case errors.Is(err, ErrDuplicateDictType):
			resp.Conflict(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create dictionary"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(item))
}

// Update godoc
// @Summary 修改字典类型
// @Description 更新字典类型信息
// @Tags System/Dict
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "字典ID"
// @Param request body updateDictTypeRequest true "字典类型参数"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/dicts/{id} [put]
func (h *Handler) Update(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	id, err := parseDictID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary id"))
		return
	}

	var payload updateDictTypeRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary payload"))
		return
	}

	operator := resolveOperator(ctx)
	item, err := h.service.UpdateDictType(ctx.Request.Context(), UpdateDictTypeInput{
		ID:       id,
		DictName: payload.DictName,
		DictType: payload.DictType,
		Status:   payload.Status,
		Remark:   payload.Remark,
		Operator: operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("dictionary not found"))
		case errors.Is(err, ErrDictNameRequired),
			errors.Is(err, ErrDictTypeRequired),
			errors.Is(err, ErrInvalidDictStatus):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		case errors.Is(err, ErrDuplicateDictType):
			resp.Conflict(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update dictionary"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(item))
}

// Delete godoc
// @Summary 删除字典类型
// @Description 根据ID删除字典类型
// @Tags System/Dict
// @Security BearerAuth
// @Produce json
// @Param id path int true "字典ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/dicts/{id} [delete]
func (h *Handler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	id, err := parseDictID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary id"))
		return
	}

	if err := h.service.DeleteDictType(ctx.Request.Context(), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("dictionary not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete dictionary"))
		return
	}

	resp.NoContent(ctx)
}

// ListData godoc
// @Summary 获取字典数据列表
// @Description 查询指定字典下的数据项
// @Tags System/Dict
// @Security BearerAuth
// @Produce json
// @Param id path int true "字典ID"
// @Param status query string false "状态"
// @Param dictLabel query string false "数据标签"
// @Param dictValue query string false "数据值"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/dicts/{id}/data [get]
func (h *Handler) ListData(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	dictID, err := parseDictID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary id"))
		return
	}

	var query listDictDataQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	result, err := h.service.ListDictData(ctx.Request.Context(), dictID, DictDataQueryOptions{
		Status:    query.Status,
		DictLabel: query.DictLabel,
		DictValue: query.DictValue,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("dictionary not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load dictionary data"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

// CreateData godoc
// @Summary 新增字典数据
// @Description 在字典下新增数据项
// @Tags System/Dict
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "字典ID"
// @Param request body createDictDataRequest true "字典数据参数"
// @Success 201 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/dicts/{id}/data [post]
func (h *Handler) CreateData(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	dictID, err := parseDictID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary id"))
		return
	}

	var payload createDictDataRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary data payload"))
		return
	}

	sort := 0
	if payload.DictSort != nil {
		sort = *payload.DictSort
	}

	operator := resolveOperator(ctx)
	item, err := h.service.CreateDictData(ctx.Request.Context(), CreateDictDataInput{
		DictID:    dictID,
		DictLabel: payload.DictLabel,
		DictValue: payload.DictValue,
		DictSort:  sort,
		Status:    payload.Status,
		IsDefault: payload.IsDefault,
		Remark:    payload.Remark,
		ListClass: payload.ListClass,
		CSSClass:  payload.CSSClass,
		Operator:  operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("dictionary not found"))
		case errors.Is(err, ErrDictLabelRequired),
			errors.Is(err, ErrDictValueRequired),
			errors.Is(err, ErrInvalidDictDataStatus),
			errors.Is(err, ErrInvalidDictDataSort),
			errors.Is(err, ErrInvalidDefaultFlag):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		case errors.Is(err, ErrDuplicateDictLabel),
			errors.Is(err, ErrDuplicateDictValue):
			resp.Conflict(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create dictionary data"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(item))
}

// UpdateData godoc
// @Summary 修改字典数据
// @Description 更新字典数据项
// @Tags System/Dict
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "字典ID"
// @Param itemId path int true "数据ID"
// @Param request body updateDictDataRequest true "字典数据参数"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/dicts/{id}/data/{itemId} [put]
func (h *Handler) UpdateData(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	dictID, err := parseDictID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary id"))
		return
	}

	dictCode, err := parseDictDataID(ctx.Param("itemId"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary data id"))
		return
	}

	var payload updateDictDataRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary data payload"))
		return
	}

	operator := resolveOperator(ctx)
	item, err := h.service.UpdateDictData(ctx.Request.Context(), UpdateDictDataInput{
		DictID:    dictID,
		DictCode:  dictCode,
		DictLabel: payload.DictLabel,
		DictValue: payload.DictValue,
		DictSort:  payload.DictSort,
		Status:    payload.Status,
		IsDefault: payload.IsDefault,
		Remark:    payload.Remark,
		ListClass: payload.ListClass,
		CSSClass:  payload.CSSClass,
		Operator:  operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("dictionary data not found"))
		case errors.Is(err, ErrDictLabelRequired),
			errors.Is(err, ErrDictValueRequired),
			errors.Is(err, ErrInvalidDictDataStatus),
			errors.Is(err, ErrInvalidDictDataSort),
			errors.Is(err, ErrInvalidDefaultFlag):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		case errors.Is(err, ErrDuplicateDictLabel),
			errors.Is(err, ErrDuplicateDictValue):
			resp.Conflict(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update dictionary data"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(item))
}

// DeleteData godoc
// @Summary 删除字典数据
// @Description 删除指定字典下的数据项
// @Tags System/Dict
// @Security BearerAuth
// @Produce json
// @Param id path int true "字典ID"
// @Param itemId path int true "数据ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/dicts/{id}/data/{itemId} [delete]
func (h *Handler) DeleteData(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("dictionary service unavailable"))
		return
	}

	dictID, err := parseDictID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary id"))
		return
	}

	dictCode, err := parseDictDataID(ctx.Param("itemId"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid dictionary data id"))
		return
	}

	if err := h.service.DeleteDictData(ctx.Request.Context(), dictID, dictCode); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("dictionary data not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete dictionary data"))
		return
	}

	resp.NoContent(ctx)
}

func parseDictID(value string) (int64, error) {
	return strconv.ParseInt(value, 10, 64)
}

func parseDictDataID(value string) (int64, error) {
	return strconv.ParseInt(value, 10, 64)
}

func resolveOperator(ctx *gin.Context) string {
	id, ok := middleware.GetUserID(ctx)
	if !ok {
		return ""
	}
	return strconv.FormatUint(uint64(id), 10)
}
