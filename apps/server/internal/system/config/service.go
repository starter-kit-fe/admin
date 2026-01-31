package config

import (
	"context"
	"errors"
	"strings"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable = errors.New("config service is not initialized")

	ErrConfigNameRequired  = errors.New("config name is required")
	ErrConfigKeyRequired   = errors.New("config key is required")
	ErrConfigValueRequired = errors.New("config value is required")
	ErrInvalidConfigType   = errors.New("invalid config type")
	ErrDuplicateConfigKey  = errors.New("duplicate config key")
)

var validConfigTypes = map[string]struct{}{
	"Y": {},
	"N": {},
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	if repo == nil {
		return nil
	}
	return &Service{repo: repo}
}

type Config struct {
	ConfigID    int64   `json:"configId"`
	ConfigName  string  `json:"configName"`
	ConfigKey   string  `json:"configKey"`
	ConfigValue string  `json:"configValue"`
	ConfigType  string  `json:"configType"`
	Remark      *string `json:"remark,omitempty"`
}

type CreateConfigInput struct {
	ConfigName  string
	ConfigKey   string
	ConfigValue string
	ConfigType  string
	Remark      *string
	Operator    string
}

type UpdateConfigInput struct {
	ID          int64
	ConfigName  *string
	ConfigKey   *string
	ConfigValue *string
	ConfigType  *string
	Remark      *string
	Operator    string
}

func (s *Service) ListConfigs(ctx context.Context, opts ListOptions) ([]Config, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	records, err := s.repo.ListConfigs(ctx, opts)
	if err != nil {
		return nil, err
	}

	result := make([]Config, 0, len(records))
	for i := range records {
		result = append(result, *configFromModel(&records[i]))
	}
	return result, nil
}

func (s *Service) GetConfig(ctx context.Context, id int64) (*Config, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	record, err := s.repo.GetConfig(ctx, id)
	if err != nil {
		return nil, err
	}
	return configFromModel(record), nil
}

func (s *Service) CreateConfig(ctx context.Context, input CreateConfigInput) (*Config, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	name := strings.TrimSpace(input.ConfigName)
	if name == "" {
		return nil, ErrConfigNameRequired
	}

	key := strings.TrimSpace(input.ConfigKey)
	if key == "" {
		return nil, ErrConfigKeyRequired
	}

	value := strings.TrimSpace(input.ConfigValue)
	if value == "" {
		return nil, ErrConfigValueRequired
	}

	cfgType := normalizeConfigType(input.ConfigType)
	if _, ok := validConfigTypes[cfgType]; !ok {
		return nil, ErrInvalidConfigType
	}

	if exists, err := s.repo.ExistsByKey(ctx, key, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrDuplicateConfigKey
	}

	operator := sanitizeOperator(input.Operator)

	record := &model.SysConfig{
		ConfigName:  name,
		ConfigKey:   key,
		ConfigValue: value,
		ConfigType:  cfgType,
		Remark:      normalizeRemark(input.Remark),
		CreateBy:    operator,
		UpdateBy:    operator,
	}

	if err := s.repo.CreateConfig(ctx, record); err != nil {
		return nil, err
	}

	return configFromModel(record), nil
}

func (s *Service) UpdateConfig(ctx context.Context, input UpdateConfigInput) (*Config, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	record, err := s.repo.GetConfig(ctx, input.ID)
	if err != nil {
		return nil, err
	}

	if input.ConfigName != nil {
		name := strings.TrimSpace(*input.ConfigName)
		if name == "" {
			return nil, ErrConfigNameRequired
		}
		record.ConfigName = name
	}

	if input.ConfigKey != nil {
		key := strings.TrimSpace(*input.ConfigKey)
		if key == "" {
			return nil, ErrConfigKeyRequired
		}
		if !strings.EqualFold(key, record.ConfigKey) {
			if exists, err := s.repo.ExistsByKey(ctx, key, int64(record.ID)); err != nil {
				return nil, err
			} else if exists {
				return nil, ErrDuplicateConfigKey
			}
		}
		record.ConfigKey = key
	}

	if input.ConfigValue != nil {
		value := strings.TrimSpace(*input.ConfigValue)
		if value == "" {
			return nil, ErrConfigValueRequired
		}
		record.ConfigValue = value
	}

	if input.ConfigType != nil {
		cfgType := normalizeConfigType(*input.ConfigType)
		if _, ok := validConfigTypes[cfgType]; !ok {
			return nil, ErrInvalidConfigType
		}
		record.ConfigType = cfgType
	}

	if input.Remark != nil {
		record.Remark = normalizeRemark(input.Remark)
	}

	record.UpdateBy = sanitizeOperator(input.Operator)

	if err := s.repo.SaveConfig(ctx, record); err != nil {
		return nil, err
	}

	return configFromModel(record), nil
}

func (s *Service) DeleteConfig(ctx context.Context, id int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	return s.repo.DeleteConfig(ctx, id)
}

func normalizeConfigType(cfgType string) string {
	trimmed := strings.TrimSpace(cfgType)
	if trimmed == "" {
		return "N"
	}
	return strings.ToUpper(trimmed)
}

func normalizeRemark(remark *string) *string {
	if remark == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*remark)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func sanitizeOperator(operator string) string {
	return strings.TrimSpace(operator)
}

func configFromModel(record *model.SysConfig) *Config {
	if record == nil {
		return nil
	}
	return &Config{
		ConfigID:    int64(record.ID),
		ConfigName:  record.ConfigName,
		ConfigKey:   record.ConfigKey,
		ConfigValue: record.ConfigValue,
		ConfigType:  record.ConfigType,
		Remark:      record.Remark,
	}
}
