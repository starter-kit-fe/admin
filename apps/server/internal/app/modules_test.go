package app

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseAsynqRedisOptions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name         string
		redisURL     string
		wantAddr     string
		wantUsername string
		wantPassword string
		wantDB       int
		wantTLS      bool
	}{
		{
			name:         "keeps password and db from redis url",
			redisURL:     "redis://:secret@127.0.0.1:6380/5",
			wantAddr:     "127.0.0.1:6380",
			wantPassword: "secret",
			wantDB:       5,
		},
		{
			name:         "keeps acl username and tls from rediss url",
			redisURL:     "rediss://worker:secret@example.com:6380/6",
			wantAddr:     "example.com:6380",
			wantUsername: "worker",
			wantPassword: "secret",
			wantDB:       6,
			wantTLS:      true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			opt := parseAsynqRedisOptions(tt.redisURL)
			require.NotNil(t, opt)

			assert.Equal(t, tt.wantAddr, opt.Addr)
			assert.Equal(t, tt.wantUsername, opt.Username)
			assert.Equal(t, tt.wantPassword, opt.Password)
			assert.Equal(t, tt.wantDB, opt.DB)
			if tt.wantTLS {
				require.NotNil(t, opt.TLSConfig)
			} else {
				assert.Nil(t, opt.TLSConfig)
			}
		})
	}
}
