import { StatusTabs, type StatusTabItem } from '@/components/status-tabs';
import {
  InputGroup,
  InputGroupInput,
} from '@/components/ui/input-group';

import type { JobStatusFilter } from '../../constants';

interface JobManagementFiltersProps {
  jobName: string;
  onJobNameChange: (value: string) => void;
  jobGroup: string;
  onJobGroupChange: (value: string) => void;
  status: JobStatusFilter;
  onStatusChange: (value: JobStatusFilter) => void;
  statusTabs: ReadonlyArray<StatusTabItem>;
  jobNamePlaceholder: string;
  jobGroupPlaceholder: string;
}

export function JobManagementFilters({
  jobName,
  onJobNameChange,
  jobGroup,
  onJobGroupChange,
  status,
  onStatusChange,
  statusTabs,
  jobNamePlaceholder,
  jobGroupPlaceholder,
}: JobManagementFiltersProps) {
  return (
    <div className="rounded-xl bg-card p-4">
      <div className="flex flex-col gap-4">
        <StatusTabs
          value={status}
          onValueChange={(value) => onStatusChange(value as JobStatusFilter)}
          tabs={statusTabs}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="w-full bg-muted/60 sm:w-[280px]">
            <InputGroupInput
              placeholder={jobNamePlaceholder}
              value={jobName}
              onChange={(event) => onJobNameChange(event.target.value)}
            />
          </InputGroup>
          <InputGroup className="w-full bg-muted/60 sm:w-[280px]">
            <InputGroupInput
              placeholder={jobGroupPlaceholder}
              value={jobGroup}
              onChange={(event) => onJobGroupChange(event.target.value)}
            />
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
