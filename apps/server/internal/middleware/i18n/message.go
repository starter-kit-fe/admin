package i18n

import (
	"github.com/gin-contrib/i18n"
	"github.com/gin-gonic/gin"
	goi18n "github.com/nicksnyder/go-i18n/v2/i18n"
)

// Message returns the localized value for the given messageID.
// Falls back to the original message when no translation is found
// or when the middleware is not attached to the context.
func Message(ctx *gin.Context, messageID string) string {
	if ctx == nil || messageID == "" {
		return messageID
	}

	localizer, ok := ctx.Get("i18n")
	if !ok {
		return messageID
	}

	trans, ok := localizer.(i18n.GinI18n)
	if !ok {
		return messageID
	}

	msg, err := trans.GetMessage(ctx, &goi18n.LocalizeConfig{
		MessageID: messageID,
		DefaultMessage: &goi18n.Message{
			ID:    messageID,
			Other: messageID,
		},
	})
	if err != nil || msg == "" {
		return messageID
	}
	return msg
}
