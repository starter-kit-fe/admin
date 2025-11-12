'use client';

import { useEffect, useRef } from 'react';

import { STATUS_FILTER_OPTIONS, type JobFilterState } from '../../constants';
import { useJobManagementStore } from '../../store';
import { JobManagementFilters } from '../filters/job-management-filters';

export function JobFiltersSection() {
  const { filterForm, setFilterForm, appliedFilters, applyFilters } =
    useJobManagementStore();
  const debounceRef = useRef<number | null>(null);

  const clearDebounce = () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearDebounce();
    };
  }, []);

  useEffect(() => {
    setFilterForm({ ...appliedFilters });
  }, [appliedFilters, setFilterForm]);

  const scheduleApply = (nextFilters: JobFilterState) => {
    clearDebounce();
    debounceRef.current = window.setTimeout(() => {
      applyFilters(nextFilters);
    }, 350);
  };

  const handleJobNameChange = (value: string) => {
    const next: JobFilterState = { ...filterForm, jobName: value };
    setFilterForm(next);
    scheduleApply(next);
  };

  const handleJobGroupChange = (value: string) => {
    const next: JobFilterState = { ...filterForm, jobGroup: value };
    setFilterForm(next);
    scheduleApply(next);
  };

  const handleStatusChange = (value: JobFilterState['status']) => {
    const next: JobFilterState = {
      ...filterForm,
      status: value,
    };
    setFilterForm(next);
    clearDebounce();
    applyFilters(next, { force: true });
  };

  return (
    <JobManagementFilters
      jobName={filterForm.jobName}
      onJobNameChange={handleJobNameChange}
      jobGroup={filterForm.jobGroup}
      onJobGroupChange={handleJobGroupChange}
      status={filterForm.status}
      onStatusChange={handleStatusChange}
      statusOptions={STATUS_FILTER_OPTIONS}
    />
  );
}
