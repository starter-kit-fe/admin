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

// Generate godoc
// @Summary 获取验证码
// @Description 生成一次性验证码图片
// @Tags Captcha
// @Produce json
// @Success 200 {object} CaptchaResponse
// @Failure 503 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Router /v1/auth/captcha [get]
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

// Verify godoc
// @Summary 校验验证码
// @Description 验证一次性验证码是否正确
// @Tags Captcha
// @Accept json
// @Produce json
// @Param request body CaptchaVerifyRequest true "验证码校验请求"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 403 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/auth/captcha/verify [post]
func (h *CaptchaHandler) Verify(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("captcha service disabled"))
		return
	}

	var payload CaptchaVerifyRequest

	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid request payload"))
		return
	}

	if h.service.Verify(ctx.Request.Context(), payload.CaptchaID, payload.Answer, true) {
		resp.OK(ctx, resp.WithMessage("captcha verified"))
		return
	}

	resp.Forbidden(ctx, resp.WithMessage("captcha verification failed"))
}
