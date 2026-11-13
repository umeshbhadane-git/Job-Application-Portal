import { Suspense } from "react";

import PublicJobDetail from "@/components/jobs/PublicJobDetail";

export default function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<JobPageFallback />}>
      <ResolvedPublicJobDetail params={params} />
    </Suspense>
  );
}

async function ResolvedPublicJobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicJobDetail jobId={id} />;
}

function JobPageFallback() {
  return (
    <main className="app-theme flex min-h-screen items-center justify-center bg-[#f7f7f3] text-sm text-[#777a71]">
      Loading job details…
    </main>
  );
}
