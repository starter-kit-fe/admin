'use client';

import { notFound, useSearchParams } from 'next/navigation';

import { JobDetailContent } from '../job-detail-content';

export function JobDetailPage() {
  const searchParams = useSearchParams();

  const jobIdStr = searchParams.get('id');
  const jobId = jobIdStr ? Number(jobIdStr) : NaN;
  if (!Number.isFinite(jobId) || jobId <= 0) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6">
      <JobDetailContent id={jobId} />
    </div>
  );
}
