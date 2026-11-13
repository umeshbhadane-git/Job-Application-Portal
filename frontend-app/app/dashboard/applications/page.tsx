"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CircleAlert } from "lucide-react";

import { apiRequest } from "@/lib/api";

type ApplicationStatus =
  | "applied"
  | "under-review"
  | "shortlisted"
  | "interview-scheduled"
  | "selected"
  | "rejected"
  | "withdrawn";

type Application = {
  _id: string;
  status: ApplicationStatus;
  createdAt: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    location: string;
  } | null;
};

const statusLabels: Record<ApplicationStatus, string> = {
  applied: "Applied",
  "under-review": "Under review",
  shortlisted: "Shortlisted",
  "interview-scheduled": "Interview scheduled",
  selected: "Selected",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

const canWithdraw = (status: ApplicationStatus) =>
  status === "applied" || status === "under-review" || status === "shortlisted" ||
  status === "interview-scheduled";

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadApplications = useCallback(async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace("/login?redirect=%2Fdashboard%2Fapplications");
      return;
    }
    try {
      const response = await apiRequest<{ data: Application[] }>("/applications/me", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      setApplications(response.data);
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load your applications."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(loadApplications);
  }, [loadApplications]);

  const withdraw = async (applicationId: string) => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace("/login?redirect=%2Fdashboard%2Fapplications");
      return;
    }
    setBusyId(applicationId);
    setError("");
    try {
      const response = await apiRequest<{ data: Application }>(
        `/applications/${applicationId}/withdraw`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApplications((current) =>
        current.map((item) =>
          item._id === applicationId ? response.data : item
        )
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not withdraw this application."
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="app-theme min-h-screen bg-[#f7f7f3] px-5 py-8 text-[#20251f] sm:px-8 lg:px-11">
      <div className="mx-auto max-w-[1100px]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#82916f]">
          Job seeker workspace
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">
              My applications
            </h1>
            <p className="mt-2 text-sm text-[#85887f]">
              Follow each application and its latest status.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-xl bg-[#36472e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#26351f]"
          >
            Find jobs <ArrowRight size={15} />
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-center gap-3 rounded-xl border border-[#efd9d2] bg-[#fff7f4] px-4 py-3 text-sm text-[#a34c3d]"
          >
            <CircleAlert size={17} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadApplications()}
              className="ml-auto shrink-0 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <section className="mt-7 overflow-hidden rounded-2xl border border-[#e9e8e1] bg-white dark:border-[#303b2b] dark:bg-[#1b2419]">
          {loading ? (
            <div className="space-y-3 p-6" aria-label="Loading applications">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-xl bg-[#f1f2eb] dark:bg-[#252f22]" />
              ))}
            </div>
          ) : applications.length ? (
            <div className="divide-y divide-[#eeede7] dark:divide-[#303b2b]">
              {applications.map((application) => (
                <article
                  key={application._id}
                  className="flex flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-7"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4e4] text-[#58763d] dark:bg-[#2a3823] dark:text-[#c4e58a]">
                      <BriefcaseBusiness size={18} />
                    </span>
                    <div className="min-w-0">
                      {application.jobId ? (
                        <Link
                          href={`/jobs/${application.jobId._id}`}
                          className="font-semibold hover:text-[#536b3d]"
                        >
                          {application.jobId.title}
                        </Link>
                      ) : (
                        <p className="font-semibold">Job listing unavailable</p>
                      )}
                      {application.jobId && (
                        <p className="mt-1 text-xs text-[#85887f]">
                          {application.jobId.company} · {application.jobId.location}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-[#9a9d94]">
                        Applied{" "}
                        {new Intl.DateTimeFormat("en", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(application.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <span className="rounded-full bg-[#edf4e4] px-3 py-1.5 text-xs font-semibold text-[#536b3d] dark:bg-[#2a3823] dark:text-[#c4e58a]">
                      {statusLabels[application.status]}
                    </span>
                    {canWithdraw(application.status) && (
                      <button
                        type="button"
                        disabled={busyId === application._id}
                        onClick={() => void withdraw(application._id)}
                        className="rounded-lg border border-[#e9e8e1] px-3 py-2 text-xs font-semibold text-[#777a71] transition hover:border-[#d5b9af] hover:text-[#a34c3d] disabled:opacity-50"
                      >
                        {busyId === application._id ? "Withdrawing…" : "Withdraw"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : !error ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#edf4e4] text-[#58763d]">
                <BriefcaseBusiness size={21} />
              </span>
              <h2 className="mt-4 font-semibold">No applications yet</h2>
              <p className="mt-2 text-sm text-[#85887f]">
                When you apply for a role, its status will appear here.
              </p>
              <Link
                href="/jobs"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#536b3d]"
              >
                Explore open jobs <ArrowRight size={14} />
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
