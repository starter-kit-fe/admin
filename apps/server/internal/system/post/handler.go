package post

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/middleware"
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

type listPostsQuery struct {
	PageNum  int    `form:"pageNum"`
	PageSize int    `form:"pageSize"`
	Status   string `form:"status"`
	PostName string `form:"postName"`
	PostCode string `form:"postCode"`
}

// List godoc
// @Summary 获取岗位列表
// @Description 按状态、岗位名称或岗位编码过滤
// @Tags System/Post
// @Security BearerAuth
// @Produce json
// @Param pageNum query int false "页码"
// @Param pageSize query int false "每页数量"
// @Param status query string false "岗位状态"
// @Param postName query string false "岗位名称"
// @Param postCode query string false "岗位编码"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/posts [get]
func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("post service unavailable"))
		return
	}

	var query listPostsQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	result, err := h.service.ListPosts(ctx.Request.Context(), QueryOptions{
		PageNum:  query.PageNum,
		PageSize: query.PageSize,
		Status:   query.Status,
		PostName: query.PostName,
		PostCode: query.PostCode,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load posts"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

type createPostRequest struct {
	PostCode string  `json:"postCode" binding:"required"`
	PostName string  `json:"postName" binding:"required"`
	PostSort *int    `json:"postSort"`
	Status   string  `json:"status"`
	Remark   *string `json:"remark"`
}

type updatePostRequest struct {
	PostCode *string `json:"postCode"`
	PostName *string `json:"postName"`
	PostSort *int    `json:"postSort"`
	Status   *string `json:"status"`
	Remark   *string `json:"remark"`
}

// Create godoc
// @Summary 新增岗位
// @Description 创建岗位信息
// @Tags System/Post
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body createPostRequest true "岗位参数"
// @Success 201 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/posts [post]
func (h *Handler) Create(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("post service unavailable"))
		return
	}

	var payload createPostRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid post payload"))
		return
	}

	sort := 0
	if payload.PostSort != nil {
		sort = *payload.PostSort
	}

	operator := resolveOperator(ctx)
	post, err := h.service.CreatePost(ctx.Request.Context(), CreatePostInput{
		PostCode: payload.PostCode,
		PostName: payload.PostName,
		PostSort: sort,
		Status:   payload.Status,
		Remark:   payload.Remark,
		Operator: operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrPostCodeRequired),
			errors.Is(err, ErrPostNameRequired),
			errors.Is(err, ErrInvalidPostSort),
			errors.Is(err, ErrInvalidPostStatus):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		case errors.Is(err, ErrDuplicatePostCode), errors.Is(err, ErrDuplicatePostName):
			resp.Conflict(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create post"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(post))
}

// Update godoc
// @Summary 修改岗位
// @Description 更新岗位信息
// @Tags System/Post
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "岗位ID"
// @Param request body updatePostRequest true "岗位参数"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/posts/{id} [put]
func (h *Handler) Update(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("post service unavailable"))
		return
	}

	id, err := parsePostID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid post id"))
		return
	}

	var payload updatePostRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid post payload"))
		return
	}

	operator := resolveOperator(ctx)
	post, err := h.service.UpdatePost(ctx.Request.Context(), UpdatePostInput{
		ID:       id,
		PostCode: payload.PostCode,
		PostName: payload.PostName,
		PostSort: payload.PostSort,
		Status:   payload.Status,
		Remark:   payload.Remark,
		Operator: operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("post not found"))
		case errors.Is(err, ErrPostCodeRequired),
			errors.Is(err, ErrPostNameRequired),
			errors.Is(err, ErrInvalidPostSort),
			errors.Is(err, ErrInvalidPostStatus):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		case errors.Is(err, ErrDuplicatePostCode), errors.Is(err, ErrDuplicatePostName):
			resp.Conflict(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update post"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(post))
}

// Delete godoc
// @Summary 删除岗位
// @Description 根据ID删除岗位
// @Tags System/Post
// @Security BearerAuth
// @Produce json
// @Param id path int true "岗位ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/posts/{id} [delete]
func (h *Handler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("post service unavailable"))
		return
	}

	id, err := parsePostID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid post id"))
		return
	}

	if err := h.service.DeletePost(ctx.Request.Context(), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("post not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete post"))
		return
	}

	resp.NoContent(ctx)
}

func resolveOperator(ctx *gin.Context) string {
	id, ok := middleware.GetUserID(ctx)
	if !ok {
		return ""
	}
	return strconv.FormatUint(uint64(id), 10)
}

func parsePostID(param string) (int64, error) {
	trimmed := strings.TrimSpace(param)
	return strconv.ParseInt(trimmed, 10, 64)
}
