import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type {
  OperLogBusinessTypeValue,
  OperLogFilterState,
  OperLogRequestMethodValue,
} from '../../store';

export type OperLogFiltersBarValue = Pick<
  OperLogFilterState,
  'title' | 'operName' | 'businessType' | 'requestMethod'
>;

interface OperLogFiltersBarProps {
  value: OperLogFiltersBarValue;
  onTitleChange: (value: string) => void;
  onOperNameChange: (value: string) => void;
  onBusinessTypeChange: (value: OperLogBusinessTypeValue) => void;
  onRequestMethodChange: (value: OperLogRequestMethodValue) => void;
  businessTypeOptions: ReadonlyArray<{
    value: OperLogBusinessTypeValue;
    label: string;
  }>;
  requestMethodOptions: ReadonlyArray<{
    value: OperLogRequestMethodValue;
    label: string;
  }>;
}

export function OperLogFiltersBar({
  value,
  onTitleChange,
  onOperNameChange,
  onBusinessTypeChange,
  onRequestMethodChange,
  businessTypeOptions,
  requestMethodOptions,
}: OperLogFiltersBarProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="oper-log-title-filter">操作标题</Label>
        <Input
          id="oper-log-title-filter"
          placeholder="按标题模糊查询"
          value={value.title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="oper-log-operator-filter">操作人员</Label>
        <Input
          id="oper-log-operator-filter"
          placeholder="输入操作人员"
          value={value.operName}
          onChange={(event) => onOperNameChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="oper-log-business-filter">业务类型</Label>
        <Select
          value={value.businessType}
          onValueChange={(option) =>
            onBusinessTypeChange(option as OperLogBusinessTypeValue)
          }
        >
          <SelectTrigger id="oper-log-business-filter">
            <SelectValue placeholder="全部业务" />
          </SelectTrigger>
          <SelectContent>
            {businessTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="oper-log-request-filter">请求方式</Label>
        <Select
          value={value.requestMethod}
          onValueChange={(option) =>
            onRequestMethodChange(option as OperLogRequestMethodValue)
          }
        >
          <SelectTrigger id="oper-log-request-filter">
            <SelectValue placeholder="全部请求" />
          </SelectTrigger>
          <SelectContent>
            {requestMethodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
