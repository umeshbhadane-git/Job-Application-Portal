"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  BriefcaseBusiness,
  CircleAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

type AdminStats = {
  users: Record<string, { total: number; active: number }>;
  jobs: Record<string, number>;
  applications: { total: number; byStatus: Record<string, number> };
  pendingReports: number;
};

type AdminUser = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  accountStatus: "active" | "deactivated" | "suspended";
};

type AdminJob = {
  _id: string;
  title: string;
  company: string;
  location: string;
  status: "draft" | "published" | "closed" | "archived";
  recruiterId: { fullName: string; email: string } | null;
};

type JobReport = {
  _id: string;
  reason: string;
  createdAt: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    status: string;
  } | null;
};

type Tab = "overview" | "users" | "jobs" | "reports";

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [reports, setReports] = useState<JobReport[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatus, setJobStatus] = useState("");
  const [jobPage, setJobPage] = useState(1);
  const [jobPages, setJobPages] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const loadData = useCallback(async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    setLoading(true);
    setError("");
    try {
      const [statsResponse, usersResponse, jobsResponse, reportsResponse] =
        await Promise.all([
          apiRequest<{ data: AdminStats }>("/admin/stats", { headers }),
          apiRequest<{ users: AdminUser[]; pages: number }>(
            `/admin/users?${new URLSearchParams({
              limit: "10",
              page: String(userPage),
              ...(userSearch.trim() ? { search: userSearch.trim() } : {}),
              ...(userStatus ? { status: userStatus } : {}),
            })}`,
            { headers }
          ),
          apiRequest<{ jobs: AdminJob[]; pages: number }>(
            `/admin/jobs?${new URLSearchParams({
              limit: "10",
              page: String(jobPage),
              ...(jobSearch.trim() ? { search: jobSearch.trim() } : {}),
              ...(jobStatus ? { status: jobStatus } : {}),
            })}`,
            { headers }
          ),
          apiRequest<{ data: JobReport[] }>("/admin/reports?status=pending", {
            headers,
          }),
        ]);
      setStats(statsResponse.data);
      setUsers(usersResponse.users);
      setJobs(jobsResponse.jobs);
      setUserPages(usersResponse.pages);
      setJobPages(jobsResponse.pages);
      setReports(reportsResponse.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load the admin workspace."
      );
    } finally {
      setLoading(false);
    }
  }, [jobPage, jobSearch, jobStatus, router, userPage, userSearch, userStatus]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const updateAccount = async (
    user: AdminUser,
    status: "active" | "deactivated" | "suspended"
  ) => {
    const token = sessionStorage.getItem("authToken");
    if (!token) return router.replace("/login");
    setBusyId(user._id);
    setError("");
    try {
      const response = await apiRequest<{ data: AdminUser }>(
        `/admin/users/${user._id}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status }),
        }
      );
      setUsers((current) =>
        current.map((item) => item._id === user._id ? response.data : item)
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update this account.");
    } finally {
      setBusyId("");
    }
  };

  const moderateJob = async (
    job: Pick<AdminJob, "_id">,
    status: "closed" | "archived"
  ) => {
    const token = sessionStorage.getItem("authToken");
    if (!token) return router.replace("/login");
    setBusyId(job._id);
    setError("");
    try {
      const response = await apiRequest<{ data: AdminJob }>(
        `/admin/jobs/${job._id}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status }),
        }
      );
      setJobs((current) =>
        current.map((item) =>
          item._id === job._id
            ? { ...item, status: response.data.status }
            : item
        )
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not moderate this listing.");
    } finally {
      setBusyId("");
    }
  };

  const reviewReport = async (report: JobReport, status: "reviewed" | "dismissed") => {
    const token = sessionStorage.getItem("authToken");
    if (!token) return router.replace("/login");
    setBusyId(report._id);
    setError("");
    try {
      await apiRequest(`/admin/reports/${report._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setReports((current) => current.filter((item) => item._id !== report._id));
      setStats((current) => current
        ? { ...current, pendingReports: Math.max(0, current.pendingReports - 1) }
        : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update this report.");
    } finally {
      setBusyId("");
    }
  };

  const tabs: Array<[Tab, string]> = [
    ["overview", "Overview"],
    ["users", "Users"],
    ["jobs", "Job listings"],
    ["reports", "Reports"],
  ];

  return (
    <main className="app-theme min-h-screen bg-[#f7f7f3] px-5 py-8 text-[#20251f] sm:px-8 lg:px-11">
      <div className="mx-auto max-w-[1250px]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#82916f]">
          Administration
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.04em]">
          Platform overview
        </h1>
        <p className="mt-2 text-sm text-[#85887f]">
          Monitor platform activity and review accounts, job listings, and reports.
        </p>

        <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-[#e7e6df]" aria-label="Admin sections">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${
                tab === value
                  ? "border-[#607a45] text-[#425b31]"
                  : "border-transparent text-[#85887f] hover:text-[#36472e]"
              }`}
            >
              {label}
              {value === "reports" && stats?.pendingReports ? (
                <span className="ml-2 rounded-full bg-[#f6f0e2] px-2 py-0.5 text-[10px] text-[#97773d]">
                  {stats.pendingReports}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {error && (
          <div role="alert" className="mt-5 flex items-center gap-2 rounded-xl border border-[#efd9d2] bg-[#fff7f4] px-4 py-3 text-sm text-[#a34c3d]">
            <CircleAlert size={16} /> {error}
            <button type="button" onClick={() => void loadData()} className="ml-auto font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-48 animate-pulse rounded-2xl bg-white dark:bg-[#1b2419]" />
        ) : (
          <>
            {tab === "overview" && stats && (
              <section className="mt-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Job seekers", value: stats.users.jobSeeker?.total ?? 0, Icon: Users },
                    { label: "Recruiters", value: stats.users.recruiter?.total ?? 0, Icon: BriefcaseBusiness },
                    { label: "Active jobs", value: stats.jobs.active ?? 0, Icon: BriefcaseBusiness },
                    { label: "Applications", value: stats.applications.total, Icon: ShieldCheck },
                    { label: "Pending reports", value: stats.pendingReports, Icon: CircleAlert },
                    { label: "Shortlisted", value: stats.applications.byStatus.shortlisted ?? 0, Icon: Users },
                    { label: "Selected", value: stats.applications.byStatus.selected ?? 0, Icon: ShieldCheck },
                    { label: "Inactive accounts", value: (stats.users.jobSeeker?.total ?? 0) + (stats.users.recruiter?.total ?? 0) - (stats.users.jobSeeker?.active ?? 0) - (stats.users.recruiter?.active ?? 0), Icon: Archive },
                  ].map(({ label, value, Icon }) => {
                    return (
                      <article key={label} className="rounded-2xl border border-[#e9e8e1] bg-white p-5 dark:border-[#303b2b] dark:bg-[#1b2419]">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-[#7d8177]">{label}</p>
                            <p className="mt-4 text-3xl font-semibold">{value}</p>
                          </div>
                          <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf4e4] text-[#58763d]">
                            <Icon size={18} />
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <SummaryList
                    title="Recent users"
                    empty="No accounts yet."
                    items={users.slice(0, 5).map((user) => `${user.fullName} · ${user.role}`)}
                    onClick={() => setTab("users")}
                  />
                  <SummaryList
                    title="Recent job listings"
                    empty="No job listings yet."
                    items={jobs.slice(0, 5).map((job) => `${job.title} · ${job.status}`)}
                    onClick={() => setTab("jobs")}
                  />
                </div>
              </section>
            )}

            {tab === "users" && (
              <section className="mt-6 overflow-hidden rounded-2xl border border-[#e9e8e1] bg-white dark:border-[#303b2b] dark:bg-[#1b2419]">
                <div className="flex flex-col gap-3 border-b border-[#eeede7] px-5 py-4 sm:flex-row">
                  <input
                    value={userSearch}
                    onChange={(event) => {
                      setUserSearch(event.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Search users by name or email"
                    aria-label="Search users"
                    className="h-10 min-w-0 flex-1 rounded-lg border border-[#e9e8e1] bg-transparent px-3 text-sm"
                  />
                  <select
                    value={userStatus}
                    onChange={(event) => {
                      setUserStatus(event.target.value);
                      setUserPage(1);
                    }}
                    aria-label="Filter users by account status"
                    className="h-10 rounded-lg border border-[#e9e8e1] bg-white px-3 text-sm dark:bg-[#1b2419]"
                  >
                    <option value="">All account states</option>
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                {users.map((user) => (
                  <div key={user._id || user.email} className="flex flex-col justify-between gap-3 border-b border-[#f0efe9] px-5 py-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{user.fullName}</p>
                      <p className="mt-1 truncate text-xs text-[#85887f]">{user.email} · {user.role}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs capitalize text-[#777a71]">{user.accountStatus || "active"}</span>
                      <select
                        value={user.accountStatus || "active"}
                        disabled={busyId === user._id || user.role === "admin"}
                        onChange={(event) =>
                          void updateAccount(
                            user,
                            event.target.value as "active" | "deactivated" | "suspended"
                          )
                        }
                        aria-label={`Set account status for ${user.fullName}`}
                        className="rounded-lg border border-[#e9e8e1] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:bg-[#1b2419]"
                      >
                        <option value="active">Active</option>
                        <option value="deactivated">Deactivated</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-3 text-xs text-[#85887f]">
                  <span>Page {userPage} of {userPages}</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={userPage <= 1} onClick={() => setUserPage((page) => page - 1)} className="rounded border border-[#e9e8e1] px-3 py-1.5 disabled:opacity-40">Previous</button>
                    <button type="button" disabled={userPage >= userPages} onClick={() => setUserPage((page) => page + 1)} className="rounded border border-[#e9e8e1] px-3 py-1.5 disabled:opacity-40">Next</button>
                  </div>
                </div>
              </section>
            )}

            {tab === "jobs" && (
              <section className="mt-6 overflow-hidden rounded-2xl border border-[#e9e8e1] bg-white dark:border-[#303b2b] dark:bg-[#1b2419]">
                <div className="flex flex-col gap-3 border-b border-[#eeede7] px-5 py-4 sm:flex-row">
                  <input
                    value={jobSearch}
                    onChange={(event) => {
                      setJobSearch(event.target.value);
                      setJobPage(1);
                    }}
                    placeholder="Search jobs by title, company, location"
                    aria-label="Search job listings"
                    className="h-10 min-w-0 flex-1 rounded-lg border border-[#e9e8e1] bg-transparent px-3 text-sm"
                  />
                  <select
                    value={jobStatus}
                    onChange={(event) => {
                      setJobStatus(event.target.value);
                      setJobPage(1);
                    }}
                    aria-label="Filter listings by status"
                    className="h-10 rounded-lg border border-[#e9e8e1] bg-white px-3 text-sm dark:bg-[#1b2419]"
                  >
                    <option value="">All job statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                {jobs.map((job) => (
                  <div key={job._id} className="flex flex-col justify-between gap-3 border-b border-[#f0efe9] px-5 py-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{job.title}</p>
                      <p className="mt-1 truncate text-xs text-[#85887f]">{job.company} · {job.location} · {job.recruiterId?.fullName ?? "Recruiter unavailable"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs capitalize text-[#777a71]">{job.status}</span>
                      {job.status !== "archived" && job.status !== "closed" && (
                        <button
                          type="button"
                          disabled={busyId === job._id}
                          onClick={() => void moderateJob(job, "closed")}
                          className="rounded-lg border border-[#e9e8e1] px-3 py-2 text-xs font-semibold"
                        >
                          Close
                        </button>
                      )}
                      {job.status === "closed" && (
                        <button
                          type="button"
                          disabled={busyId === job._id}
                          onClick={() => void moderateJob(job, "archived")}
                          className="rounded-lg border border-[#e9e8e1] px-3 py-2 text-xs font-semibold"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-3 text-xs text-[#85887f]">
                  <span>Page {jobPage} of {jobPages}</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={jobPage <= 1} onClick={() => setJobPage((page) => page - 1)} className="rounded border border-[#e9e8e1] px-3 py-1.5 disabled:opacity-40">Previous</button>
                    <button type="button" disabled={jobPage >= jobPages} onClick={() => setJobPage((page) => page + 1)} className="rounded border border-[#e9e8e1] px-3 py-1.5 disabled:opacity-40">Next</button>
                  </div>
                </div>
              </section>
            )}

            {tab === "reports" && (
              <section className="mt-6 space-y-3">
                {reports.length ? reports.map((report) => (
                  <article key={report._id} className="rounded-2xl border border-[#e9e8e1] bg-white p-5 dark:border-[#303b2b] dark:bg-[#1b2419]">
                    <p className="text-sm font-semibold">{report.jobId?.title ?? "Unavailable listing"}</p>
                    <p className="mt-1 text-xs text-[#85887f]">{report.jobId?.company ?? "Job no longer available"}</p>
                    <p className="mt-3 rounded-lg bg-[#f7f7f3] px-3 py-2 text-sm leading-6 dark:bg-[#20291f]">{report.reason}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === report._id}
                        onClick={async () => {
                          if (report.jobId && report.jobId.status !== "archived") {
                            await moderateJob(
                              { _id: report.jobId._id },
                              "closed"
                            );
                          }
                          await reviewReport(report, "reviewed");
                        }}
                        className="rounded-lg bg-[#36472e] px-3 py-2 text-xs font-semibold text-white"
                      >
                        Close listing and resolve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === report._id}
                        onClick={() => void reviewReport(report, "dismissed")}
                        className="rounded-lg border border-[#e9e8e1] px-3 py-2 text-xs font-semibold"
                      >
                        Dismiss report
                      </button>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-2xl border border-[#e9e8e1] bg-white px-6 py-14 text-center dark:border-[#303b2b] dark:bg-[#1b2419]">
                    <ShieldCheck size={24} className="mx-auto text-[#718455]" />
                    <h2 className="mt-3 font-semibold">No pending reports</h2>
                    <p className="mt-1 text-sm text-[#85887f]">Reported listings will appear here for review.</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function SummaryList({
  title,
  empty,
  items,
  onClick,
}: {
  title: string;
  empty: string;
  items: string[];
  onClick: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[#e9e8e1] bg-white p-5 dark:border-[#303b2b] dark:bg-[#1b2419]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button type="button" onClick={onClick} className="text-xs font-semibold text-[#536b3d]">
          View all
        </button>
      </div>
      {items.length ? (
        <ul className="mt-3 divide-y divide-[#eeede7] dark:divide-[#303b2b]">
          {items.map((item) => <li key={item} className="py-2.5 text-xs text-[#62665d] dark:text-[#c0c9b8]">{item}</li>)}
        </ul>
      ) : <p className="mt-4 text-xs text-[#85887f]">{empty}</p>}
    </section>
  );
}
