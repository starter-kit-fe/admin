package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/starter-kit-fe/admin/internal/app"
	"github.com/starter-kit-fe/admin/internal/model"
	"golang.org/x/crypto/bcrypt"
)

// CreateUser creates a user with system permissions in the database
func CreateUser(t *testing.T, a *app.App, username, password string) *model.SysUser {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	user := &model.SysUser{
		UserName: username,
		Password: string(hash),
		NickName: username,
		Status:   "0",  // Enabled
		UserType: "00", // System user
		Email:    username + "@example.com",
		Sex:      "0",
	}

	if err := a.DB().Create(user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	return user
}

// Login performs login and returns access token
func Login(t *testing.T, a *app.App, mr *miniredis.Miniredis, username, password string) string {
	// 1. Generate Captcha
	reqCaptcha := httptest.NewRequest(http.MethodGet, "/v1/auth/captcha", nil)
	wCaptcha := httptest.NewRecorder()
	a.Handler().ServeHTTP(wCaptcha, reqCaptcha)

	var captchaResp struct {
		Data struct {
			CaptchaID string `json:"captcha_id"`
		} `json:"data"`
	}
	if wCaptcha.Code == 200 {
		_ = json.Unmarshal(wCaptcha.Body.Bytes(), &captchaResp)
	}

	code := "1234"
	captchaID := captchaResp.Data.CaptchaID
	// Retrieve code from miniredis
	if captchaID != "" {
		// Key format: "captcha:" + id
		key := "captcha:" + captchaID
		val, err := mr.Get(key)
		if err == nil {
			code = val
		}
	}

	// 2. Login
	payload := map[string]string{
		"username":   username,
		"password":   password,
		"uuid":       captchaID,
		"code":       code,
		"captcha_id": captchaID,
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	a.Handler().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("login failed: %d %s", w.Code, w.Body.String())
	}

	var resp struct {
		Data struct {
			AccessToken string `json:"access_token"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal login response: %v", err)
	}
	return resp.Data.AccessToken
}
