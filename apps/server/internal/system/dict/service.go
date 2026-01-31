package dict

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable = errors.New("dictionary service is not initialized")

	ErrDictNameRequired  = errors.New("dictionary name is required")
	ErrDictTypeRequired  = errors.New("dictionary type is required")
	ErrInvalidDictStatus = errors.New("invalid dictionary status")
	ErrDuplicateDictType = errors.New("duplicate dictionary type")

	ErrDictLabelRequired     = errors.New("dictionary label is required")
	ErrDictValueRequired     = errors.New("dictionary value is required")
	ErrInvalidDictDataStatus = errors.New("invalid dictionary data status")
	ErrInvalidDictDataSort   = errors.New("invalid dictionary data sort")
	ErrInvalidDefaultFlag    = errors.New("invalid dictionary default flag")
	ErrDuplicateDictLabel    = errors.New("duplicate dictionary label")
	ErrDuplicateDictValue    = errors.New("duplicate dictionary value")
)

var validStatuses = map[string]struct{}{
	"0": {},
	"1": {},
}

var validDefaultFlags = map[string]struct{}{
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

type QueryOptions struct {
	Status   string
	DictName string
	DictType string
}

type DictType struct {
	ID       int64   `json:"id"`
	DictName string  `json:"dictName"`
	DictType string  `json:"dictType"`
	Status   string  `json:"status"`
	Remark   *string `json:"remark,omitempty"`
}

type DictData struct {
	ID        int64   `json:"id"`
	DictSort  int     `json:"dictSort"`
	DictLabel string  `json:"dictLabel"`
	DictValue string  `json:"dictValue"`
	DictType  string  `json:"dictType"`
	Status    string  `json:"status"`
	IsDefault string  `json:"isDefault"`
	ListClass *string `json:"listClass,omitempty"`
	CSSClass  *string `json:"cssClass,omitempty"`
	Remark    *string `json:"remark,omitempty"`
}

type DictDataList struct {
	Type *DictType  `json:"type"`
	List []DictData `json:"list"`
}

type DictDataQueryOptions struct {
	Status    string
	DictLabel string
	DictValue string
}

type CreateDictTypeInput struct {
	DictName string
	DictType string
	Status   string
	Remark   *string
	Operator string
}

type UpdateDictTypeInput struct {
	ID       int64
	DictName *string
	DictType *string
	Status   *string
	Remark   *string
	Operator string
}

type CreateDictDataInput struct {
	DictID    int64
	DictLabel string
	DictValue string
	DictSort  int
	Status    string
	IsDefault string
	Remark    *string
	ListClass *string
	CSSClass  *string
	Operator  string
}

type UpdateDictDataInput struct {
	DictID    int64
	ID        int64
	DictLabel *string
	DictValue *string
	DictSort  *int
	Status    *string
	IsDefault *string
	Remark    *string
	ListClass *string
	CSSClass  *string
	Operator  string
}

func (s *Service) ListDictTypes(ctx context.Context, opts QueryOptions) ([]DictType, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	records, err := s.repo.ListDictTypes(ctx, ListOptions{
		Status:   opts.Status,
		DictName: opts.DictName,
		DictType: opts.DictType,
	})
	if err != nil {
		return nil, err
	}

	result := make([]DictType, 0, len(records))
	for i := range records {
		result = append(result, *dictTypeFromModel(&records[i]))
	}
	return result, nil
}

func (s *Service) GetDictType(ctx context.Context, id int64) (*DictType, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	record, err := s.repo.GetDictType(ctx, id)
	if err != nil {
		return nil, err
	}
	return dictTypeFromModel(record), nil
}

func (s *Service) CreateDictType(ctx context.Context, input CreateDictTypeInput) (*DictType, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	name := strings.TrimSpace(input.DictName)
	if name == "" {
		return nil, ErrDictNameRequired
	}

	dictTypeValue := strings.TrimSpace(input.DictType)
	if dictTypeValue == "" {
		return nil, ErrDictTypeRequired
	}

	status := normalizeStatus(input.Status)
	if _, ok := validStatuses[status]; !ok {
		return nil, ErrInvalidDictStatus
	}

	if exists, err := s.repo.ExistsDictType(ctx, dictTypeValue, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrDuplicateDictType
	}

	remark := normalizeRemark(input.Remark)
	operator := sanitizeOperator(input.Operator)

	record := &model.SysDictType{
		DictName: name,
		DictType: dictTypeValue,
		Status:   status,
		Remark:   remark,
		CreateBy: operator,
		UpdateBy: operator,
	}

	if err := s.repo.CreateDictType(ctx, record); err != nil {
		return nil, err
	}

	return dictTypeFromModel(record), nil
}

func (s *Service) UpdateDictType(ctx context.Context, input UpdateDictTypeInput) (*DictType, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	record, err := s.repo.GetDictType(ctx, input.ID)
	if err != nil {
		return nil, err
	}

	if input.DictName != nil {
		name := strings.TrimSpace(*input.DictName)
		if name == "" {
			return nil, ErrDictNameRequired
		}
		record.DictName = name
	}

	if input.DictType != nil {
		dictTypeValue := strings.TrimSpace(*input.DictType)
		if dictTypeValue == "" {
			return nil, ErrDictTypeRequired
		}
		if exists, err := s.repo.ExistsDictType(ctx, dictTypeValue, int64(record.ID)); err != nil {
			return nil, err
		} else if exists {
			return nil, ErrDuplicateDictType
		}
		record.DictType = dictTypeValue
	}

	if input.Status != nil {
		status := normalizeStatus(*input.Status)
		if _, ok := validStatuses[status]; !ok {
			return nil, ErrInvalidDictStatus
		}
		record.Status = status
	}

	if input.Remark != nil {
		record.Remark = normalizeRemark(input.Remark)
	}

	operator := sanitizeOperator(input.Operator)
	record.UpdateBy = operator

	if err := s.repo.SaveDictType(ctx, record); err != nil {
		return nil, err
	}

	return dictTypeFromModel(record), nil
}

func (s *Service) DeleteDictType(ctx context.Context, id int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}

	record, err := s.repo.GetDictType(ctx, id)
	if err != nil {
		return err
	}

	return s.repo.DeleteDictType(ctx, int64(record.ID), record.DictType)
}

func (s *Service) ListDictData(ctx context.Context, dictID int64, opts DictDataQueryOptions) (*DictDataList, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	dictTypeRecord, err := s.repo.GetDictType(ctx, dictID)
	if err != nil {
		return nil, err
	}

	items, err := s.repo.ListDictData(ctx, ListDataOptions{
		DictType:  dictTypeRecord.DictType,
		Status:    opts.Status,
		DictLabel: opts.DictLabel,
		DictValue: opts.DictValue,
	})
	if err != nil {
		return nil, err
	}

	result := make([]DictData, 0, len(items))
	for i := range items {
		result = append(result, *dictDataFromModel(&items[i]))
	}

	return &DictDataList{
		Type: dictTypeFromModel(dictTypeRecord),
		List: result,
	}, nil
}

func (s *Service) CreateDictData(ctx context.Context, input CreateDictDataInput) (*DictData, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	dictTypeRecord, err := s.repo.GetDictType(ctx, input.DictID)
	if err != nil {
		return nil, err
	}

	label := strings.TrimSpace(input.DictLabel)
	if label == "" {
		return nil, ErrDictLabelRequired
	}

	value := strings.TrimSpace(input.DictValue)
	if value == "" {
		return nil, ErrDictValueRequired
	}

	if input.DictSort < 0 {
		return nil, ErrInvalidDictDataSort
	}

	status := normalizeStatus(input.Status)
	if _, ok := validStatuses[status]; !ok {
		return nil, ErrInvalidDictDataStatus
	}

	defaultFlag := normalizeDefaultFlag(input.IsDefault)
	if _, ok := validDefaultFlags[defaultFlag]; !ok {
		return nil, ErrInvalidDefaultFlag
	}

	if exists, err := s.repo.ExistsDictDataByLabel(ctx, dictTypeRecord.DictType, label, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrDuplicateDictLabel
	}

	if exists, err := s.repo.ExistsDictDataByValue(ctx, dictTypeRecord.DictType, value, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrDuplicateDictValue
	}

	remark := normalizeRemark(input.Remark)
	listClass := normalizeOptionalString(input.ListClass)
	cssClass := normalizeOptionalString(input.CSSClass)
	operator := sanitizeOperator(input.Operator)

	record := &model.SysDictData{
		DictSort:  input.DictSort,
		DictLabel: label,
		DictValue: value,
		DictType:  dictTypeRecord.DictType,
		Status:    status,
		IsDefault: defaultFlag,
		Remark:    remark,
		ListClass: listClass,
		CSSClass:  cssClass,
		CreateBy:  operator,
		UpdateBy:  operator,
	}

	if err := s.repo.CreateDictData(ctx, record); err != nil {
		return nil, err
	}

	return dictDataFromModel(record), nil
}

func (s *Service) UpdateDictData(ctx context.Context, input UpdateDictDataInput) (*DictData, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	dictTypeRecord, err := s.repo.GetDictType(ctx, input.DictID)
	if err != nil {
		return nil, err
	}

	record, err := s.repo.GetDictData(ctx, input.ID)
	if err != nil {
		return nil, err
	}

	if record.DictType != dictTypeRecord.DictType {
		return nil, gorm.ErrRecordNotFound
	}

	if input.DictLabel != nil {
		label := strings.TrimSpace(*input.DictLabel)
		if label == "" {
			return nil, ErrDictLabelRequired
		}
		if !strings.EqualFold(label, record.DictLabel) {
			if exists, err := s.repo.ExistsDictDataByLabel(ctx, dictTypeRecord.DictType, label, int64(record.ID)); err != nil {
				return nil, err
			} else if exists {
				return nil, ErrDuplicateDictLabel
			}
		}
		record.DictLabel = label
	}

	if input.DictValue != nil {
		value := strings.TrimSpace(*input.DictValue)
		if value == "" {
			return nil, ErrDictValueRequired
		}
		if value != record.DictValue {
			if exists, err := s.repo.ExistsDictDataByValue(ctx, dictTypeRecord.DictType, value, int64(record.ID)); err != nil {
				return nil, err
			} else if exists {
				return nil, ErrDuplicateDictValue
			}
		}
		record.DictValue = value
	}

	if input.DictSort != nil {
		if *input.DictSort < 0 {
			return nil, ErrInvalidDictDataSort
		}
		record.DictSort = *input.DictSort
	}

	if input.Status != nil {
		status := normalizeStatus(*input.Status)
		if _, ok := validStatuses[status]; !ok {
			return nil, ErrInvalidDictDataStatus
		}
		record.Status = status
	}

	if input.IsDefault != nil {
		flag := normalizeDefaultFlag(*input.IsDefault)
		if _, ok := validDefaultFlags[flag]; !ok {
			return nil, ErrInvalidDefaultFlag
		}
		record.IsDefault = flag
	}

	if input.Remark != nil {
		record.Remark = normalizeRemark(input.Remark)
	}

	if input.ListClass != nil {
		record.ListClass = normalizeOptionalString(input.ListClass)
	}

	if input.CSSClass != nil {
		record.CSSClass = normalizeOptionalString(input.CSSClass)
	}

	operator := sanitizeOperator(input.Operator)
	record.UpdateBy = operator

	if err := s.repo.SaveDictData(ctx, record); err != nil {
		return nil, err
	}

	return dictDataFromModel(record), nil
}

func (s *Service) DeleteDictData(ctx context.Context, dictID, id int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}

	dictTypeRecord, err := s.repo.GetDictType(ctx, dictID)
	if err != nil {
		return err
	}

	record, err := s.repo.GetDictData(ctx, id)
	if err != nil {
		return err
	}

	if record.DictType != dictTypeRecord.DictType {
		return gorm.ErrRecordNotFound
	}

	return s.repo.DeleteDictData(ctx, id)
}

func normalizeStatus(status string) string {
	trimmed := strings.TrimSpace(status)
	if trimmed == "" {
		return "0"
	}
	return trimmed
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

func normalizeDefaultFlag(flag string) string {
	trimmed := strings.TrimSpace(flag)
	if trimmed == "" {
		return "N"
	}
	return strings.ToUpper(trimmed)
}

func normalizeOptionalString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func dictTypeFromModel(record *model.SysDictType) *DictType {
	if record == nil {
		return nil
	}
	return &DictType{
		ID:       int64(record.ID),
		DictName: record.DictName,
		DictType: record.DictType,
		Status:   record.Status,
		Remark:   record.Remark,
	}
}

func dictDataFromModel(record *model.SysDictData) *DictData {
	if record == nil {
		return nil
	}
	return &DictData{
		ID:        int64(record.ID),
		DictSort:  record.DictSort,
		DictLabel: record.DictLabel,
		DictValue: record.DictValue,
		DictType:  record.DictType,
		Status:    record.Status,
		IsDefault: record.IsDefault,
		ListClass: record.ListClass,
		CSSClass:  record.CSSClass,
		Remark:    record.Remark,
	}
}
