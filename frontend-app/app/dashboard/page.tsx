"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Compass,
  LayoutDashboard,
  MessageSquareText,
  Search,
  Settings2,
  Sparkles,
  UserRound,
  UserRoundPen,
  Upload,
  XCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: "jobSeeker" | "recruiter" | "admin";
};

type DashboardApplicationStats = {
  total: number;
  byStatus: Record<string, number>;
  recent: Array<{
    _id: string;
    status: string;
    createdAt: string;
    jobId: { _id: string; title: string; company: string } | null;
  }>;
};

type RecruiterStats = {
  publishedJobs: number;
  totalApplications: number;
  byStatus: Record<string, number>;
  byJob: Array<{
    jobId: string;
    title: string;
    applications: number;
    shortlisted: number;
    selected: number;
    rejected: number;
  }>;
};

const parseUser = (storedUser: string | null): User | null => {
  if (!storedUser) return null;

  try {
    const user: unknown = JSON.parse(storedUser);

    if (
      typeof user === "object" &&
      user !== null &&
      "id" in user &&
      typeof user.id === "string" &&
      "fullName" in user &&
      typeof user.fullName === "string" &&
      "email" in user &&
      typeof user.email === "string" &&
      "role" in user &&
      (user.role === "jobSeeker" ||
        user.role === "recruiter" ||
        user.role === "admin")
    ) {
      return user as User;
    }
  } catch {
    return null;
  }

  return null;
};

const roleDetails = {
  jobSeeker: {
    label: "Job seeker",
    greeting: "Your next chapter starts here.",
    description:
      "Keep your career story ready, discover roles that fit, and take your next step with confidence.",
    action: "Explore opportunities",
    href: "/jobs",
    icon: Search,
    highlight: "Make your next move",
    highlightText:
      "A thoughtful profile helps employers see more than a resume. Keep your experience and skills current.",
  },
  recruiter: {
    label: "Recruiter",
    greeting: "Let’s find your next great hire.",
    description:
      "Create a welcoming first impression, keep roles up to date, and bring the right people closer to your team.",
    action: "Manage job listings",
    href: "/recruiter/jobs",
    icon: BriefcaseBusiness,
    highlight: "A great hire starts with a great brief",
    highlightText:
      "Clear expectations and a salary range help the right candidates understand why they belong on your team.",
  },
  admin: {
    label: "Administrator",
    greeting: "Your platform, at a glance.",
    description:
      "Welcome to your CareerBridge workspace. Use the quick links to explore the platform.",
    action: "Browse opportunities",
    href: "/jobs",
    icon: Compass,
    highlight: "Everything starts with connection",
    highlightText:
      "CareerBridge brings employers and job seekers together. Explore the experience from either side.",
  },
} as const;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [applicationStats, setApplicationStats] =
    useState<DashboardApplicationStats | null>(null);
  const [recruiterStats, setRecruiterStats] = useState<RecruiterStats | null>(
    null
  );
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => {
      const token = sessionStorage.getItem("authToken");
      const storedUser = sessionStorage.getItem("authUser");
      const currentUser = parseUser(storedUser);

      if (!token || !currentUser) {
        if (token || storedUser) {
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("authUser");
        }
        router.replace("/login");
        return;
      }

      if (active) setUser(currentUser);
    });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!user || (user.role !== "jobSeeker" && user.role !== "recruiter")) {
      return;
    }

    let active = true;
    void Promise.resolve().then(async () => {
      const token = sessionStorage.getItem("authToken");
      if (!token) return;
      try {
        if (user.role === "jobSeeker") {
          const response = await apiRequest<{
            success: boolean;
            data: DashboardApplicationStats;
          }>("/applications/me/stats", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (active) setApplicationStats(response.data);
        } else {
          const response = await apiRequest<{
            success: boolean;
            data: RecruiterStats;
          }>("/applications/recruiter/stats", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (active) setRecruiterStats(response.data);
        }
        if (active) setStatsError("");
      } catch (requestError) {
        if (active) {
          setStatsError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load your dashboard statistics."
          );
        }
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return (
      <main className="app-theme flex min-h-screen items-center justify-center bg-[#f7f7f3] text-sm text-[#73776d]">
        <span className="flex items-center gap-3">
          <span className="size-4 animate-spin rounded-full border-2 border-[#d6ddca] border-t-[#536b3d]" />
          Preparing your workspace…
        </span>
      </main>
    );
  }

  const content = roleDetails[user.role];
  const ActionIcon = content.icon;
  const initials = user.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const quickActions =
    user.role === "recruiter"
      ? [
          {
            title: "Manage job listings",
            description:
              "Create a role, refine a draft, or see what’s already live.",
            label: "Open job management",
            href: "/recruiter/jobs",
            icon: BriefcaseBusiness,
            tone: "sage",
          },
          {
            title: "Your profile",
            description:
              "Keep your personal details and professional information current.",
            label: "Update profile",
            href: "/dashboard/profile",
            icon: UserRoundPen,
            tone: "sand",
          },
        ]
      : [
          {
            title: "Explore open roles",
            description:
              "Browse current openings and compare the role requirements.",
            label: "Find jobs",
            href: "/jobs",
            icon: Search,
            tone: "sage",
          },
          {
            title: "Build your profile",
            description:
              "Share your experience, skills, and the work you’re proud of.",
            label: "Update profile",
            href: "/dashboard/profile",
            icon: UserRoundPen,
            tone: "sage",
          },
          {
            title: "Keep your resume ready",
            description:
              "Upload or update the resume you’ll use for your next opportunity.",
            label: "Manage resume",
            href: "/dashboard/resume",
            icon: Upload,
            tone: "sand",
          },
        ];

  return (
    <main className="app-theme min-h-screen bg-[#f7f7f3] text-[#20251f]">
      <section className="min-w-0">
          <header className="flex h-[76px] items-center justify-between border-b border-[#e9e8e1] bg-[#fbfbf8] px-5 sm:px-8 lg:px-11">
            <div>
              <p className="text-xs font-medium text-[#85887f]">
                {content.label} workspace
              </p>
              <p className="mt-0.5 text-sm font-semibold">Dashboard</p>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <Link
                href="/settings/appearance"
                aria-label="Appearance settings"
                className="flex size-9 items-center justify-center rounded-xl border border-[#e9e8e1] text-[#777a71] transition hover:bg-white lg:hidden"
              >
                <Settings2 size={16} />
              </Link>
              <span className="hidden items-center gap-2 rounded-full border border-[#e7e9df] bg-[#f3f5ed] px-3 py-1.5 text-xs font-medium text-[#5f7148] sm:inline-flex">
                <span className="size-1.5 rounded-full bg-[#81a44e]" />
                {content.label}
              </span>
              <Link
                href="/dashboard/profile"
                className="flex size-9 items-center justify-center rounded-full bg-[#e6eadf] text-xs font-bold text-[#3d4c32] ring-2 ring-white"
                aria-label="Open my profile"
              >
                {initials || <UserRound size={16} />}
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-[1420px] px-5 py-7 sm:px-8 sm:py-9 lg:px-11">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#85887f]">
                <LayoutDashboard size={14} />
                <span>Workspace</span>
                <span className="text-[#c5c7bf]">/</span>
                <span className="text-[#48533d]">Overview</span>
              </div>
              <p className="text-xs font-medium text-[#85887f]">{today}</p>
            </div>

            <section className="relative isolate overflow-hidden rounded-[26px] bg-[#35472e] px-6 py-7 text-white sm:px-9 sm:py-9 lg:px-11 lg:py-10 xl:min-h-[340px]">
              <div className="pointer-events-none absolute -right-20 -top-32 -z-10 size-[360px] rounded-full border border-white/[0.08]" />
              <div className="pointer-events-none absolute -right-5 -top-20 -z-10 size-[250px] rounded-full border border-white/[0.08]" />
              <div className="pointer-events-none absolute -bottom-36 right-[17%] -z-10 size-[300px] rounded-full bg-[#c4e58a]/[0.07] blur-[1px]" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[11px] font-medium text-[#dce8cf]">
                  <Sparkles size={13} className="text-[#c4e58a]" />
                  Your CareerBridge space
                </div>
                <p className="mt-6 text-sm font-medium text-[#d2ddc7]">
                  Good to see you, {user.fullName.split(" ")[0]}.
                </p>
                <h1 className="mt-2 max-w-xl text-[32px] font-semibold leading-[1.12] tracking-[-0.045em] sm:text-[42px] lg:text-[48px]">
                  {content.greeting}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[#d0d9c8] sm:text-[15px] sm:leading-7">
                  {content.description}
                </p>
                <Link
                  href={content.href}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#c4e58a] px-4 py-3 text-sm font-semibold text-[#26331f] shadow-sm transition hover:bg-[#d2efa2]"
                >
                  <ActionIcon size={17} />
                  {content.action}
                  <ArrowRight size={15} className="ml-1" />
                </Link>
              </div>

              <div className="mt-8 hidden w-[290px] rounded-2xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-sm xl:absolute xl:right-10 xl:top-1/2 xl:mt-0 xl:block xl:-translate-y-1/2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c4e58a]">
                  Your account
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#c4e58a] text-sm font-bold text-[#26331f]">
                    {initials || <UserRound size={17} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.fullName}</p>
                    <p className="mt-1 truncate text-xs text-[#d0d9c8]">
                      {content.label}
                    </p>
                  </div>
                </div>
                <p className="mt-4 truncate border-t border-white/10 pt-4 text-xs text-[#d0d9c8]">
                  {user.email}
                </p>
                <Link
                  href="/dashboard/profile"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#c4e58a] transition hover:text-white"
                >
                  Review your profile <ArrowRight size={13} />
                </Link>
              </div>
            </section>

            {user.role === "jobSeeker" && (
              <section className="mt-8">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#82916f]">
                      Application activity
                    </p>
                    <h2 className="mt-1.5 text-lg font-semibold tracking-tight">
                      Your application snapshot
                    </h2>
                  </div>
                  <Link
                    href="/dashboard/applications"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#536b3d] hover:text-[#26351f] dark:text-[#c4e58a]"
                  >
                    View applications <ArrowRight size={13} />
                  </Link>
                </div>

                {statsError && (
                  <p role="alert" className="mt-3 text-xs text-[#a34c3d]">
                    {statsError}
                  </p>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Total applications", key: "total", icon: BriefcaseBusiness, tone: "bg-[#edf4e4] text-[#58763d]" },
                    { label: "Applied", key: "applied", icon: BriefcaseBusiness, tone: "bg-[#edf4e4] text-[#58763d]" },
                    { label: "Under review", key: "under-review", icon: Search, tone: "bg-[#f6f0e2] text-[#99783e]" },
                    { label: "Shortlisted", key: "shortlisted", icon: CheckCircle2, tone: "bg-[#eaf2e8] text-[#4f7650]" },
                    { label: "Interviews", key: "interview-scheduled", icon: MessageSquareText, tone: "bg-[#f6f0e2] text-[#99783e]" },
                    { label: "Selected", key: "selected", icon: CheckCircle2, tone: "bg-[#eaf2e8] text-[#4f7650]" },
                    { label: "Not selected", key: "rejected", icon: XCircle, tone: "bg-[#f4ece8] text-[#9a6554]" },
                    { label: "Withdrawn", key: "withdrawn", icon: XCircle, tone: "bg-[#eff0ee] text-[#73776f]" },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    const value =
                      stat.key === "total"
                        ? applicationStats?.total
                        : applicationStats?.byStatus[stat.key] ?? 0;
                    return (
                      <article
                        key={stat.label}
                        className="rounded-2xl border border-[#e9e8e1] bg-white p-5 dark:border-[#303b2b] dark:bg-[#1b2419]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium text-[#7d8177] dark:text-[#aab2a4]">
                              {stat.label}
                            </p>
                            <p className="mt-4 text-3xl font-semibold leading-none tracking-[-0.045em]">
                              {value ?? "—"}
                            </p>
                          </div>
                          <span
                            className={`flex size-10 items-center justify-center rounded-xl ${stat.tone}`}
                          >
                            <Icon size={18} />
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {applicationStats?.recent.length ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#e9e8e1] bg-white dark:border-[#303b2b] dark:bg-[#1b2419]">
                    <div className="flex items-center justify-between border-b border-[#eeede7] px-5 py-4 dark:border-[#303b2b]">
                      <h3 className="text-sm font-semibold">Recent applications</h3>
                      <Link
                        href="/dashboard/applications"
                        className="text-xs font-semibold text-[#536b3d] dark:text-[#c4e58a]"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="divide-y divide-[#eeede7] dark:divide-[#303b2b]">
                      {applicationStats.recent.slice(0, 3).map((application) => (
                        <div
                          key={application._id}
                          className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {application.jobId?.title ?? "Job listing unavailable"}
                            </p>
                            <p className="mt-1 text-xs text-[#85887f]">
                              {application.jobId?.company ?? "CareerBridge"} ·{" "}
                              {new Intl.DateTimeFormat("en", {
                                day: "numeric",
                                month: "short",
                              }).format(new Date(application.createdAt))}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#edf4e4] px-2.5 py-1 text-[10px] font-semibold capitalize text-[#536b3d] dark:bg-[#2a3823] dark:text-[#c4e58a]">
                            {application.status.replace("-", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            {user.role === "recruiter" && (
              <section className="mt-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#82916f]">
                    Recruitment activity
                  </p>
                  <h2 className="mt-1.5 text-lg font-semibold tracking-tight">
                    Your hiring snapshot
                  </h2>
                </div>
                {statsError && (
                  <p role="alert" className="mt-3 text-xs text-[#a34c3d]">
                    {statsError}
                  </p>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Published jobs", recruiterStats?.publishedJobs],
                    ["Applications", recruiterStats?.totalApplications],
                    ["Under review", recruiterStats?.byStatus["under-review"] ?? 0],
                    ["Interviews", recruiterStats?.byStatus["interview-scheduled"] ?? 0],
                    ["Shortlisted", recruiterStats?.byStatus.shortlisted ?? 0],
                    ["Selected", recruiterStats?.byStatus.selected ?? 0],
                    ["Rejected", recruiterStats?.byStatus.rejected ?? 0],
                  ].map(([label, value]) => (
                    <article
                      key={label}
                      className="rounded-2xl border border-[#e9e8e1] bg-white p-5 dark:border-[#303b2b] dark:bg-[#1b2419]"
                    >
                      <p className="text-xs font-medium text-[#7d8177] dark:text-[#aab2a4]">
                        {label}
                      </p>
                      <p className="mt-4 text-3xl font-semibold leading-none tracking-[-0.045em]">
                        {value ?? "—"}
                      </p>
                    </article>
                  ))}
                </div>
                {!!recruiterStats?.byJob.length && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#e9e8e1] bg-white dark:border-[#303b2b] dark:bg-[#1b2419]">
                    <div className="border-b border-[#eeede7] px-5 py-4 dark:border-[#303b2b]">
                      <h3 className="text-sm font-semibold">Applications by job</h3>
                    </div>
                    <div className="divide-y divide-[#eeede7] dark:divide-[#303b2b]">
                      {recruiterStats.byJob.map((item) => (
                        <Link
                          key={item.jobId}
                          href={`/recruiter/jobs/${item.jobId}/applications`}
                          className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-[#fbfbf8] dark:hover:bg-[#20291f]"
                        >
                          <span className="truncate">{item.title || "Job listing"}</span>
                          <span className="shrink-0 text-xs text-[#777a71]">
                            {item.applications} applicants · {item.shortlisted} shortlisted
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_0.72fr]">
              <div>
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#82916f]">
                    Keep the momentum
                  </p>
                  <h2 className="mt-1.5 text-lg font-semibold tracking-tight">
                    A few good next steps
                  </h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.title}
                        href={action.href}
                        className="group rounded-2xl border border-[#e9e8e1] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#d3dac9] hover:shadow-[0_12px_30px_rgba(32,37,31,0.05)] sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`flex size-11 items-center justify-center rounded-xl ${
                              action.tone === "sage"
                                ? "bg-[#edf4e4] text-[#58763d]"
                                : "bg-[#f6f0e2] text-[#99783e]"
                            }`}
                          >
                            <Icon size={20} />
                          </span>
                          <span className="flex size-8 items-center justify-center rounded-lg text-[#9a9d94] transition group-hover:bg-[#f1f4eb] group-hover:text-[#536b3d]">
                            <ArrowUpRight size={16} />
                          </span>
                        </div>
                        <h3 className="mt-5 text-sm font-semibold">
                          {action.title}
                        </h3>
                        <p className="mt-2 min-h-10 text-xs leading-5 text-[#85887f]">
                          {action.description}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#536b3d]">
                          {action.label}
                          <ChevronRight
                            size={14}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <aside className="relative isolate overflow-hidden rounded-2xl border border-[#e9e8e1] bg-[#efeee6] p-6 sm:p-7">
                <div className="pointer-events-none absolute -bottom-12 -right-10 -z-10 size-44 rounded-full border-[24px] border-[#dfe4d4]/70" />
                <div className="flex size-10 items-center justify-center rounded-xl bg-white text-[#62764a] shadow-sm">
                  <Sparkles size={18} />
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#82916f]">
                  A thought for today
                </p>
                <h2 className="mt-2 max-w-sm text-xl font-semibold leading-7 tracking-[-0.025em]">
                  {content.highlight}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-[#72776b]">
                  {content.highlightText}
                </p>
                <Link
                  href={
                    user.role === "recruiter"
                      ? "/recruiter/jobs"
                      : "/dashboard/profile"
                  }
                  className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#536b3d] transition hover:text-[#273820]"
                >
                  {user.role === "recruiter"
                    ? "Review your listings"
                    : "Take a look at your profile"}
                  <ArrowRight size={14} />
                </Link>
              </aside>
            </section>

            <footer className="mt-8 flex flex-col gap-3 border-t border-[#e7e6df] py-5 text-[11px] text-[#92958d] sm:flex-row sm:items-center sm:justify-between">
              <p>CareerBridge · Make room for what’s next.</p>
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 hover:text-[#536b3d]"
                >
                  <Compass size={13} /> Explore CareerBridge
                </Link>
              </div>
            </footer>
          </div>
      </section>
    </main>
  );
}
