package handler

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/internal/service/captcha"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type CaptchaHandler struct {
	service *captcha.Service
}

func NewCaptchaHandler(service *captcha.Service) *CaptchaHandler {
	if service == nil {
		return nil
	}
	return &CaptchaHandler{service: service}
}

func (h *CaptchaHandler) Generate(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("captcha service disabled"))
		return
	}

	result, err := h.service.Generate(ctx.Request.Context())
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to generate captcha"))
		return
	}

	resp.OK(ctx, resp.WithData(gin.H{
		"captcha_id": result.ID,
		"image":      result.Image,
		"expires_in": int(result.ExpiresIn / time.Second),
	}))
}

func (h *CaptchaHandler) Verify(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("captcha service disabled"))
		return
	}

	var payload struct {
		ID     string `json:"captcha_id" binding:"required"`
		Answer string `json:"answer" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid request payload"))
		return
	}

	if h.service.Verify(ctx.Request.Context(), payload.ID, payload.Answer, true) {
		resp.OK(ctx, resp.WithMessage("captcha verified"))
		return
	}

	resp.Forbidden(ctx, resp.WithMessage("captcha verification failed"))
}
