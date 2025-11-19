import { notFound } from 'next/navigation';

import { JobDetailContent } from '../components/detail/job-detail-content';

interface JobDetailPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId: jobIdParam } = await params;
  const jobId = Number(jobIdParam);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <JobDetailContent jobId={jobId} />
    </div>
  );
}
