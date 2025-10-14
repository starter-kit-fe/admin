// pkg/jwt/jwt.go

package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTMaker struct {
}

type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

func NewJWTMaker() *JWTMaker {
	return &JWTMaker{}
}

// CreateToken 使用用户特定的密钥创建token
func (maker *JWTMaker) CreateToken(userID uint, secretKey string, duration time.Duration) (string, error) {
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

// ParseTokenWithoutVerification 不验证签名的情况下解析token以获取UserID
func (maker *JWTMaker) ParseTokenWithoutVerification(tokenStr string) (*Claims, error) {
	token, _, err := new(jwt.Parser).ParseUnverified(tokenStr, &Claims{})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok {
		return claims, nil
	}
	return nil, errors.New("invalid token claims")
}

// VerifyToken 使用指定的密钥验证token
func (maker *JWTMaker) VerifyToken(tokenStr string, secretKey string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		_, ok := token.Method.(*jwt.SigningMethodHMAC)
		if !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}
