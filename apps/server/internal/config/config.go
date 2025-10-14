package config

import (
	"errors"
	"fmt"
	"os"
	"sync"

	"github.com/joho/godotenv"

	"github.com/starter-kit-fe/admin/constant"
)

var (
	once    sync.Once
	loadErr error
)

type Config struct {
	DBURL    string
	REDISURL string
}

// Load initialises application configuration by reading env files/config files
// and assigning values into the constant package.
func Load(envFiles ...string) (Config, error) {
	once.Do(func() {
		loadErr = load(envFiles...)
	})
	return Config{
		DBURL:    constant.DBURL,
		REDISURL: constant.REDISURL,
	}, loadErr
}

// MustLoad performs Load and panics if an error occurs.
func MustLoad(envFiles ...string) (Config, error) {
	if config, err := Load(envFiles...); err != nil {
		panic(err)
	} else {
		return config, nil
	}
}

func load(envFiles ...string) error {
	if len(envFiles) == 0 {
		envFiles = []string{".env.local", ".env"}
	}

	if err := loadEnvFiles(envFiles); err != nil {
		return err
	}

	constant.DBURL = os.Getenv("DB_URL")
	constant.REDISURL = os.Getenv("REDIS_URL")
	return nil
}

func loadEnvFiles(files []string) error {
	for _, file := range files {
		if file == "" {
			continue
		}

		if err := godotenv.Overload(file); err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}
			return fmt.Errorf("load env file %s: %w", file, err)
		}
	}
	return nil
}
