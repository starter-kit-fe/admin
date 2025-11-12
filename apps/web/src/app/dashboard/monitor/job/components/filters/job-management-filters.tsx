import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { JobStatusFilter } from '../../constants';

interface JobManagementFiltersProps {
  jobName: string;
  onJobNameChange: (value: string) => void;
  jobGroup: string;
  onJobGroupChange: (value: string) => void;
  status: JobStatusFilter;
  onStatusChange: (value: JobStatusFilter) => void;
  statusOptions: ReadonlyArray<{ value: JobStatusFilter; label: string }>;
}

export function JobManagementFilters({
  jobName,
  onJobNameChange,
  jobGroup,
  onJobGroupChange,
  status,
  onStatusChange,
  statusOptions,
}: JobManagementFiltersProps) {
  return (
    <div className="rounded-xl bg-card p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="job-name-filter">任务名称</Label>
          <Input
            id="job-name-filter"
            placeholder="按名称筛选"
            value={jobName}
            onChange={(event) => onJobNameChange(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="job-group-filter">任务分组</Label>
          <Input
            id="job-group-filter"
            placeholder="按分组筛选"
            value={jobGroup}
            onChange={(event) => onJobGroupChange(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="job-status-filter">状态</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              onStatusChange(value as JobStatusFilter)
            }
          >
            <SelectTrigger id="job-status-filter">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
