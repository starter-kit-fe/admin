'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect } from 'react';

import {
  DEFAULT_DEBOUNCE_MS,
  OPER_LOG_BUSINESS_TYPE_OPTIONS,
  OPER_LOG_REQUEST_METHOD_OPTIONS,
  OPER_LOG_STATUS_OPTIONS,
} from '../constants';
import {
  type OperLogBusinessTypeValue,
  type OperLogRequestMethodValue,
  type OperLogStatusValue,
  useOperLogManagementStore,
} from '../store';

export function OperLogFiltersSection() {
  const { filterForm, setFilterForm, applyFilters, resetFilters } =
    useOperLogManagementStore();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyFilters({
        ...filterForm,
        title: filterForm.title.trim(),
        operName: filterForm.operName.trim(),
      });
    }, DEFAULT_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyFilters, filterForm.operName, filterForm.title]);

  const handleSelectChange = (
    patch: Partial<{
      businessType: OperLogBusinessTypeValue;
      status: OperLogStatusValue;
      requestMethod: OperLogRequestMethodValue;
    }>,
  ) => {
    const next = { ...filterForm, ...patch };
    setFilterForm(next);
    applyFilters(
      {
        ...next,
        title: next.title.trim(),
        operName: next.operName.trim(),
      },
      { force: true },
    );
  };

  return (
    <section className="rounded-xl border border-border/60 bg-background/90 p-4  sm:p-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label>操作标题</Label>
          <Input
            placeholder="按标题模糊查询"
            value={filterForm.title}
            onChange={(event) =>
              setFilterForm((prev) => ({
                ...prev,
                title: event.target.value,
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>操作人员</Label>
          <Input
            placeholder="输入操作人员"
            value={filterForm.operName}
            onChange={(event) =>
              setFilterForm((prev) => ({
                ...prev,
                operName: event.target.value,
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>业务类型</Label>
          <Select
            value={filterForm.businessType}
            onValueChange={(value) =>
              handleSelectChange({
                businessType: value as OperLogBusinessTypeValue,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部业务" />
            </SelectTrigger>
            <SelectContent>
              {OPER_LOG_BUSINESS_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>执行结果</Label>
          <Select
            value={filterForm.status}
            onValueChange={(value) =>
              handleSelectChange({ status: value as OperLogStatusValue })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              {OPER_LOG_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>请求方式</Label>
          <Select
            value={filterForm.requestMethod}
            onValueChange={(value) =>
              handleSelectChange({
                requestMethod: value as OperLogRequestMethodValue,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="全部请求" />
            </SelectTrigger>
            <SelectContent>
              {OPER_LOG_REQUEST_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetFilters()}
          >
            重置
          </Button>
        </div>
      </div>
    </section>
  );
}
