package notice

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/middleware"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type listNoticesQuery struct {
	NoticeTitle string `form:"noticeTitle"`
	NoticeType  string `form:"noticeType"`
	Status      string `form:"status"`
}

type createNoticeRequest struct {
	NoticeTitle   string  `json:"noticeTitle" binding:"required"`
	NoticeType    string  `json:"noticeType" binding:"required"`
	NoticeContent string  `json:"noticeContent" binding:"required"`
	Status        string  `json:"status"`
	Remark        *string `json:"remark"`
}

type updateNoticeRequest struct {
	NoticeTitle   *string `json:"noticeTitle"`
	NoticeType    *string `json:"noticeType"`
	NoticeContent *string `json:"noticeContent"`
	Status        *string `json:"status"`
	Remark        *string `json:"remark"`
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
		resp.ServiceUnavailable(ctx, resp.WithMessage("notice service unavailable"))
		return
	}

	var query listNoticesQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	items, err := h.service.ListNotices(ctx.Request.Context(), ListOptions{
		NoticeTitle: query.NoticeTitle,
		NoticeType:  query.NoticeType,
		Status:      query.Status,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load notices"))
		return
	}

	resp.OK(ctx, resp.WithData(items))
}

func (h *Handler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("notice service unavailable"))
		return
	}

	id, err := parseNoticeID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid notice id"))
		return
	}

	item, err := h.service.GetNotice(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("notice not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load notice"))
		return
	}

	resp.OK(ctx, resp.WithData(item))
}

func (h *Handler) Create(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("notice service unavailable"))
		return
	}

	var payload createNoticeRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid notice payload"))
		return
	}

	operator := resolveOperator(ctx)
	item, err := h.service.CreateNotice(ctx.Request.Context(), CreateNoticeInput{
		NoticeTitle:   payload.NoticeTitle,
		NoticeType:    payload.NoticeType,
		NoticeContent: payload.NoticeContent,
		Status:        payload.Status,
		Remark:        payload.Remark,
		Operator:      operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrTitleRequired),
			errors.Is(err, ErrTypeRequired),
			errors.Is(err, ErrContentRequired),
			errors.Is(err, ErrInvalidType),
			errors.Is(err, ErrInvalidStatus):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create notice"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(item))
}

func (h *Handler) Update(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("notice service unavailable"))
		return
	}

	id, err := parseNoticeID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid notice id"))
		return
	}

	var payload updateNoticeRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid notice payload"))
		return
	}

	operator := resolveOperator(ctx)
	item, err := h.service.UpdateNotice(ctx.Request.Context(), UpdateNoticeInput{
		ID:            id,
		NoticeTitle:   payload.NoticeTitle,
		NoticeType:    payload.NoticeType,
		NoticeContent: payload.NoticeContent,
		Status:        payload.Status,
		Remark:        payload.Remark,
		Operator:      operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("notice not found"))
		case errors.Is(err, ErrTitleRequired),
			errors.Is(err, ErrTypeRequired),
			errors.Is(err, ErrContentRequired),
			errors.Is(err, ErrInvalidType),
			errors.Is(err, ErrInvalidStatus):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update notice"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(item))
}

func (h *Handler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("notice service unavailable"))
		return
	}

	id, err := parseNoticeID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid notice id"))
		return
	}

	if err := h.service.DeleteNotice(ctx.Request.Context(), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("notice not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete notice"))
		return
	}

	resp.NoContent(ctx)
}

func parseNoticeID(value string) (int64, error) {
	return strconv.ParseInt(value, 10, 64)
}

func resolveOperator(ctx *gin.Context) string {
	id, ok := middleware.GetUserID(ctx)
	if !ok {
		return ""
	}
	return strconv.FormatUint(uint64(id), 10)
}
