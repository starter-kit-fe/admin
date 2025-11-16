'use client';

import { StatusTabs, type StatusTabItem } from '@/components/status-tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';

import type { JobStatusFilter } from '../../constants';

interface JobManagementFiltersProps {
  jobName: string;
  onJobNameChange: (value: string) => void;
  jobGroup: string;
  onJobGroupChange: (value: string) => void;
  status: JobStatusFilter;
  onStatusChange: (value: JobStatusFilter) => void;
  statusTabs: ReadonlyArray<StatusTabItem>;
}

export function JobManagementFilters({
  jobName,
  onJobNameChange,
  jobGroup,
  onJobGroupChange,
  status,
  onStatusChange,
  statusTabs,
}: JobManagementFiltersProps) {
  const tFilters = useTranslations('JobManagement.filters');

  return (
    <div className="rounded-xl bg-card p-4">
      <div className="flex flex-col gap-4">
        <StatusTabs
          value={status}
          onValueChange={(value) => onStatusChange(value as JobStatusFilter)}
          tabs={statusTabs}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="job-name-filter">{tFilters('jobNameLabel')}</Label>
            <Input
              id="job-name-filter"
              placeholder={tFilters('jobNamePlaceholder')}
              value={jobName}
              onChange={(event) => onJobNameChange(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="job-group-filter">
              {tFilters('jobGroupLabel')}
            </Label>
            <Input
              id="job-group-filter"
              placeholder={tFilters('jobGroupPlaceholder')}
              value={jobGroup}
              onChange={(event) => onJobGroupChange(event.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
