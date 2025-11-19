import { notFound } from 'next/navigation';

import { JobDetailContent } from '../components/detail/job-detail-content';

interface JobDetailPageProps {
  params: { jobId: string };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const jobId = Number(params.jobId);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <JobDetailContent jobId={jobId} />
    </div>
  );
}
