"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleAlert,
  Clock3,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { apiRequest } from "@/lib/api";
import {
  formatJobLabel,
  formatJobSalary,
  type PublicJob,
  type PublicJobResponse,
} from "@/lib/publicJobs";

export default function PublicJobDetail({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sessionStatus = useSyncExternalStore(
    subscribeToSession,
    getSessionStatus,
    () => "checking"
  );
  const [applyNotice, setApplyNotice] = useState("");
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNotice, setReportNotice] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const jobPath = `/jobs/${jobId}`;
  const loginUrl = `/login?redirect=${encodeURIComponent(jobPath)}`;

  useEffect(() => {
    if (sessionStatus !== "expired") return;

    const currentPage = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    router.replace(`/login?redirect=${encodeURIComponent(currentPage)}`);
  }, [router, sessionStatus]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      try {
        const response = await apiRequest<PublicJobResponse>(
          `/jobs/public/${encodeURIComponent(jobId)}`,
          { cache: "no-store" }
        );
        if (active) setJob(response.data);
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "This job is no longer available."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [jobId]);

  useEffect(() => {
    if (sessionStatus !== "signed-in") return;
    let active = true;
    void Promise.resolve().then(async () => {
      const token = sessionStorage.getItem("authToken");
      if (!token) return;
      try {
        const response = await apiRequest<{
          success: boolean;
          data: Array<{ jobId?: { _id?: string } | string }>;
        }>("/applications/me", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (active) {
          setAlreadyApplied(
            response.data.some((application) => {
              const applicationJobId = application.jobId;
              return (
                (typeof applicationJobId === "string"
                  ? applicationJobId
                  : applicationJobId?._id) === jobId
              );
            })
          );
        }
      } catch {
        if (active) setApplyNotice("Could not check your application status. Please try again.");
      }
    });
    return () => {
      active = false;
    };
  }, [jobId, sessionStatus]);

  const submitApplication = async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace(loginUrl);
      return;
    }
    setApplying(true);
    setApplyNotice("");
    try {
      await apiRequest("/applications", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId }),
      });
      setAlreadyApplied(true);
      setApplyNotice("Your application has been submitted.");
    } catch (requestError) {
      setApplyNotice(
        requestError instanceof Error
          ? requestError.message
          : "Could not submit your application. Please try again."
      );
    } finally {
      setApplying(false);
    }
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace(loginUrl);
      return;
    }
    setSubmittingReport(true);
    setReportNotice("");
    try {
      await apiRequest(`/reports/jobs/${jobId}`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: JSON.stringify({ reason: reportReason }),
      });
      setReportNotice("Thanks. Your report has been sent to the moderation team.");
      setReporting(false);
      setReportReason("");
    } catch (requestError) {
      setReportNotice(
        requestError instanceof Error
          ? requestError.message
          : "Could not submit this report. Please try again."
      );
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <main className="app-theme min-h-screen bg-[#f7f7f3] text-[#20251f]">
      <Navbar />
      <div className="mx-auto max-w-5xl px-5 py-8 sm:py-11 lg:px-8">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#647b4c] transition hover:text-[#36472e]"
        >
          <ArrowLeft size={16} /> All jobs
        </Link>

        {loading ? (
          <div className="mt-6 animate-pulse rounded-3xl border border-[#e9e8e1] bg-white p-8">
            <div className="size-14 rounded-2xl bg-[#f0f1eb]" />
            <div className="mt-6 h-7 w-1/2 rounded bg-[#f0f1eb]" />
            <div className="mt-4 h-4 w-1/3 rounded bg-[#f0f1eb]" />
            <div className="mt-10 h-40 rounded bg-[#f0f1eb]" />
          </div>
        ) : error || !job ? (
          <div
            role={error ? "alert" : "status"}
            className="mt-6 rounded-3xl border border-[#e9e8e1] bg-white px-6 py-16 text-center"
          >
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f8ece8] text-[#a34c3d]">
              <CircleAlert size={23} />
            </span>
            <h1 className="mt-5 text-xl font-semibold">This role isn’t available</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#85887f]">
              {error || "This listing may have closed or passed its application deadline."}
            </p>
            <Link
              href="/jobs"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#36472e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#26351f]"
            >
              Browse open jobs
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-6 overflow-hidden rounded-3xl border border-[#e9e8e1] bg-white">
              <div className="h-2 bg-[#c4e58a]" />
              <div className="p-6 sm:p-9">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#edf4e4] text-[#58763d]">
                      <Building2 size={25} />
                    </span>
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5e5] px-2.5 py-1 text-[10px] font-semibold text-[#56743d]">
                        <Sparkles size={12} />
                        Published opportunity
                      </span>
                      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                        {job.title}
                      </h1>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-[#777a71]">
                        <Building2 size={15} />
                        {job.company}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#f3f4ef] px-4 py-3 sm:min-w-[180px]">
                    <p className="text-[10px] text-[#85887f]">Salary range</p>
                    <p className="mt-1 text-sm font-semibold text-[#45583a]">
                      {formatJobSalary(job.salary)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <DetailTag icon={<MapPin size={14} />}>{job.location}</DetailTag>
                  <DetailTag icon={<BriefcaseBusiness size={14} />}>
                    {formatJobLabel(job.employmentType)}
                  </DetailTag>
                  <DetailTag>{formatJobLabel(job.workplaceType)}</DetailTag>
                  <DetailTag>{formatJobLabel(job.experienceLevel)} experience</DetailTag>
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#eeede7] pt-5">
                  <p className="flex items-center gap-2 text-xs text-[#85887f]">
                    {job.closingDate ? (
                      <>
                        <CalendarDays size={15} />
                        Apply by{" "}
                        {new Intl.DateTimeFormat("en", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(new Date(job.closingDate))}
                      </>
                    ) : (
                      <>
                        <Clock3 size={15} /> Applications are open
                      </>
                    )}
                  </p>
                  {sessionStatus === "signed-in" ? (
                    <button
                      type="button"
                      onClick={submitApplication}
                      disabled={applying || alreadyApplied}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36472e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26351f]"
                    >
                      <Send size={15} />
                      {alreadyApplied
                        ? "Already applied"
                        : applying
                          ? "Submitting…"
                          : "Apply now"}
                    </button>
                  ) : (sessionStatus === "checking" ||
                    sessionStatus === "expired") ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-wait items-center justify-center gap-2 rounded-xl bg-[#36472e] px-5 py-3 text-sm font-semibold text-white opacity-70"
                    >
                      Checking session…
                    </button>
                  ) : (
                    <Link
                      href={loginUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36472e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26351f]"
                    >
                      <Send size={15} />
                      Sign in to apply
                    </Link>
                  )}
                </div>
                {applyNotice ? (
                  <p
                    role="status"
                    className="mt-3 rounded-xl bg-[#f3f4ef] px-4 py-3 text-sm text-[#62665d]"
                  >
                    {applyNotice}
                  </p>
                ) : (
                  <p className="mt-3 text-right text-[10px] text-[#9a9d94]">
                    Applying requires a job seeker account.
                  </p>
                )}
                <div className="mt-4 flex justify-end">
                  {sessionStatus === "signed-in" ? (
                    <button
                      type="button"
                      onClick={() => setReporting((current) => !current)}
                      className="text-xs font-medium text-[#85887f] underline underline-offset-2 hover:text-[#536b3d]"
                    >
                      Report this listing
                    </button>
                  ) : sessionStatus === "signed-out" ? (
                    <Link
                      href={loginUrl}
                      className="text-xs font-medium text-[#85887f] underline underline-offset-2 hover:text-[#536b3d]"
                    >
                      Sign in to report this listing
                    </Link>
                  ) : null}
                </div>
                {reporting ? (
                  <form onSubmit={(event) => void submitReport(event)} className="mt-3 space-y-3 rounded-xl bg-[#f7f7f3] p-4">
                    <label className="block text-xs font-medium text-[#62665d]">
                      Describe why this listing should be reviewed
                      <textarea
                        required
                        minLength={5}
                        maxLength={1000}
                        value={reportReason}
                        onChange={(event) => setReportReason(event.target.value)}
                        className="mt-1.5 min-h-20 w-full rounded-lg border border-[#e9e8e1] bg-white p-3 text-sm outline-none focus:border-[#91a27a]"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={submittingReport || reportReason.trim().length < 5}
                      className="rounded-lg bg-[#36472e] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {submittingReport ? "Sending…" : "Send report"}
                    </button>
                  </form>
                ) : null}
                {reportNotice ? (
                  <p role="status" className="mt-3 text-right text-xs text-[#62665d]">
                    {reportNotice}
                  </p>
                ) : null}
              </div>
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <section className="rounded-2xl border border-[#e9e8e1] bg-white p-6 sm:p-8">
                <h2 className="text-lg font-semibold">About this role</h2>
                <div className="mt-4 whitespace-pre-line text-sm leading-7 text-[#62665d]">
                  {job.description}
                </div>

                {job.skills.length > 0 && (
                  <div className="mt-8 border-t border-[#eeede7] pt-6">
                    <h3 className="text-sm font-semibold">Required skills</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-[#edf4e4] px-3 py-1.5 text-xs font-medium text-[#536b3d]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {job.optionalSkills?.length ? (
                  <div className="mt-6 border-t border-[#eeede7] pt-6">
                    <h3 className="text-sm font-semibold">Preferred skills</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.optionalSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-[#f3f4ef] px-3 py-1.5 text-xs font-medium text-[#687063]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <aside className="h-fit rounded-2xl border border-[#e9e8e1] bg-white p-5">
                <h2 className="text-sm font-semibold">Role at a glance</h2>
                <dl className="mt-4 space-y-4">
                  <DetailRow label="Company" value={job.company} />
                  <DetailRow label="Location" value={job.location} />
                  <DetailRow
                    label="Workplace"
                    value={formatJobLabel(job.workplaceType)}
                  />
                  <DetailRow
                    label="Employment"
                    value={formatJobLabel(job.employmentType)}
                  />
                  <DetailRow
                    label="Experience"
                    value={formatJobLabel(job.experienceLevel)}
                  />
                  <DetailRow
                    label="Closing date"
                    value={
                      job.closingDate
                        ? new Intl.DateTimeFormat("en", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(job.closingDate))
                        : "Not specified"
                    }
                  />
                </dl>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function getSessionStatus(): "checking" | "signed-in" | "signed-out" | "expired" {
  const token = sessionStorage.getItem("authToken");
  if (!token) return "signed-out";

  const expiresAt = getTokenExpiry(token);
  if (expiresAt === null || expiresAt <= Date.now()) return "expired";

  try {
    const user = sessionStorage.getItem("authUser");
    const parsedUser = user ? JSON.parse(user) : null;
    if (parsedUser?.role !== "jobSeeker") return "signed-out";
  } catch {
    return "signed-out";
  }

  return "signed-in";
}

function getTokenExpiry(token: string) {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;

    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
    );
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function subscribeToSession(callback: () => void) {
  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener("focus", handleChange);
  window.addEventListener("visibilitychange", handleChange);

  const token = sessionStorage.getItem("authToken");
  let expirationTimer: ReturnType<typeof setTimeout> | undefined;
  if (token) {
    const expiresAt = getTokenExpiry(token);
    if (expiresAt && expiresAt > Date.now()) {
      expirationTimer = setTimeout(
        handleChange,
        Math.min(expiresAt - Date.now() + 1, 2_147_483_647)
      );
    }
  }

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("focus", handleChange);
    window.removeEventListener("visibilitychange", handleChange);
    if (expirationTimer) clearTimeout(expirationTimer);
  };
}

function DetailTag({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f4ef] px-3 py-1.5 text-xs font-medium text-[#687063]">
      {icon}
      {children}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wide text-[#999d93]">
        {label}
      </dt>
      <dd className="mt-1 text-xs font-medium text-[#4f554b]">{value}</dd>
    </div>
  );
}
