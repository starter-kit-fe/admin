package post

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/middleware"
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
