package captcha

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/pkg/resp"
)

type CaptchaResponseData struct {
	CaptchaID string `json:"captcha_id" example:"edbf2c533e8e44e4986b98f785bd40a4"`
	Image     string `json:"image" example:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."`
	ExpiresIn int    `json:"expires_in" example:"120"`
}

type CaptchaResponse struct {
	Code int                 `json:"code" example:"200"`
	Msg  string              `json:"msg" example:"OK"`
	Data CaptchaResponseData `json:"data"`
}

type CaptchaVerifyRequest struct {
	CaptchaID string `json:"captcha_id" example:"edbf2c533e8e44e4986b98f785bd40a4"`
	Answer    string `json:"answer" example:"8"`
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

// Generate godoc
// @Summary 获取验证码
// @Description 生成一次性验证码图片
// @Tags Captcha
// @Produce json
// @Success 200 {object} CaptchaResponse
// @Failure 503 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Router /v1/auth/captcha [get]
func (h *Handler) Generate(ctx *gin.Context) {
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
func (h *Handler) Verify(ctx *gin.Context) {
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
