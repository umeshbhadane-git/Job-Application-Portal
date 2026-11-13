"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleAlert,
  MapPin,
} from "lucide-react";

import { apiRequest } from "@/lib/api";
import {
  formatJobLabel,
  formatJobSalary,
  type PublicJob,
  type PublicJobsResponse,
} from "@/lib/publicJobs";

export default function FeaturedJobs() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadJobs = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiRequest<PublicJobsResponse>("/jobs/public", {
          cache: "no-store",
        });
        if (active) setJobs(response.data.slice(0, 3));
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "We couldn’t load featured jobs."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadJobs();

    return () => {
      active = false;
    };
  }, [retryCount]);

  if (loading) {
    return (
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-52 animate-pulse rounded-2xl border border-[#e7e8e1] bg-white p-5 dark:border-[#303b2b] dark:bg-[#1b2419]"
          >
            <div className="size-10 rounded-xl bg-[#edf4e4] dark:bg-[#2a3823]" />
            <div className="mt-5 h-4 w-3/4 rounded bg-[#edf0e8] dark:bg-[#303b2b]" />
            <div className="mt-3 h-3 w-1/2 rounded bg-[#edf0e8] dark:bg-[#303b2b]" />
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="mt-9 rounded-2xl border border-[#e7e8e1] bg-white p-6 dark:border-[#303b2b] dark:bg-[#1b2419] sm:p-9">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <span
              className={`inline-flex size-12 items-center justify-center rounded-xl ${
                error
                  ? "bg-[#fff1ec] text-[#a34c3d] dark:bg-[#32231f] dark:text-[#f0b5a7]"
                  : "bg-[#edf4e4] text-[#58763d] dark:bg-[#2a3823] dark:text-[#c4e58a]"
              }`}
            >
              {error ? <CircleAlert size={22} /> : <BriefcaseBusiness size={22} />}
            </span>
            <h3 className="mt-5 text-xl font-bold tracking-tight">
              {error
                ? "Featured jobs aren’t available right now."
                : "Your next opportunity could be one search away."}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {error
                ? error
                : "Browse live listings from recruiters. Published jobs are available to explore without signing in."}
            </p>
          </div>
          {error ? (
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#36472e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26351f] dark:bg-[#c4e58a] dark:text-[#25311d] dark:hover:bg-[#d2efa2]"
            >
              Try again <ArrowRight size={16} />
            </button>
          ) : (
            <Link
              href="/jobs"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#36472e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26351f] dark:bg-[#c4e58a] dark:text-[#25311d] dark:hover:bg-[#d2efa2]"
            >
              Explore open jobs <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => (
        <article
          key={job._id}
          className="group flex min-h-56 flex-col rounded-2xl border border-[#e7e8e1] bg-white p-5 transition hover:-translate-y-1 hover:border-[#cbd6bd] hover:shadow-[0_16px_34px_rgba(32,37,31,0.08)] dark:border-[#303b2b] dark:bg-[#1b2419] dark:hover:border-[#596c47]"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4e4] text-[#58763d] dark:bg-[#2a3823] dark:text-[#c4e58a]">
              <BriefcaseBusiness size={19} />
            </span>
            <div className="min-w-0">
              <h3 className="line-clamp-2 font-semibold leading-6 tracking-tight">
                {job.title}
              </h3>
              <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                {job.company}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4ef] px-2.5 py-1 text-[11px] font-medium text-[#687063] dark:bg-[#252f22] dark:text-[#c0c9b8]">
              <MapPin size={12} />
              {job.location}
            </span>
            <span className="rounded-full bg-[#f3f4ef] px-2.5 py-1 text-[11px] font-medium text-[#687063] dark:bg-[#252f22] dark:text-[#c0c9b8]">
              {formatJobLabel(job.employmentType)}
            </span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#eeede7] pt-4 dark:border-[#303b2b]">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Salary range
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-[#4c5940] dark:text-[#c4e58a]">
                {formatJobSalary(job.salary)}
              </p>
            </div>
            <Link
              href={`/jobs/${job._id}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#536b3d] transition hover:bg-[#edf4e4] dark:text-[#c4e58a] dark:hover:bg-[#2a3823]"
            >
              View role <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
