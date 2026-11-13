"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FilePlus2,
  Filter,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Settings2,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

type JobStatus = "draft" | "published" | "closed" | "archived";
type EmploymentType = "full-time" | "part-time" | "contract" | "internship";
type WorkplaceType = "onsite" | "remote" | "hybrid";
type ExperienceLevel = "entry" | "junior" | "mid" | "senior" | "lead";

type Job = {
  _id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  minExperience: number;
  maxExperience: number | null;
  openings: number;
  salary?: { min?: number; max?: number; currency?: string };
  skills: string[];
  optionalSkills: string[];
  status: JobStatus;
  publishedAt?: string | null;
  closingDate?: string | null;
  createdAt: string;
};

type JobsResponse = {
  success: boolean;
  data: Job[];
  pagination: { total: number; pages: number; page: number; limit: number };
  counts: Record<JobStatus, number>;
};

type JobResponse = {
  success: boolean;
  data: Job;
};

type JobForm = {
  title: string;
  company: string;
  description: string;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  minExperience: string;
  maxExperience: string;
  openings: string;
  salaryMin: string;
  salaryMax: string;
  skills: string;
  optionalSkills: string;
  closingDate: string;
};

type StatusFilter = "all" | JobStatus;

const emptyForm: JobForm = {
  title: "",
  company: "",
  description: "",
  location: "",
  workplaceType: "onsite",
  employmentType: "full-time",
  experienceLevel: "mid",
  minExperience: "0",
  maxExperience: "",
  openings: "1",
  salaryMin: "",
  salaryMax: "",
  skills: "",
  optionalSkills: "",
  closingDate: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#e7e5df] bg-white px-4 py-3 text-sm text-[#20251f] outline-none transition placeholder:text-[#a7aaa2] focus:border-[#657b45] focus:ring-4 focus:ring-[#657b45]/10";

const formatDate = (date?: string | null) => {
  if (!date) return "No deadline";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatSalary = (salary?: Job["salary"]) => {
  if (!salary || (salary.min == null && salary.max == null)) {
    return "Salary not listed";
  }
  const currency = salary.currency || "INR";
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (salary.min != null && salary.max != null) {
    return `${formatter.format(salary.min)} – ${formatter.format(salary.max)}`;
  }
  return formatter.format(salary.min ?? salary.max ?? 0);
};

const statusLabel: Record<JobStatus, string> = {
  published: "Live",
  draft: "Draft",
  closed: "Closed",
  archived: "Archived",
};

const isRecruiter = (storedUser: string | null) => {
  if (!storedUser) return false;
  try {
    const user: unknown = JSON.parse(storedUser);
    return (
      typeof user === "object" &&
      user !== null &&
      "role" in user &&
      user.role === "recruiter"
    );
  } catch {
    return false;
  }
};

function jobToForm(job: Job): JobForm {
  return {
    title: job.title,
    company: job.company,
    description: job.description,
    location: job.location,
    workplaceType: job.workplaceType,
    employmentType: job.employmentType,
    experienceLevel: job.experienceLevel,
    minExperience: job.minExperience.toString(),
    maxExperience: job.maxExperience?.toString() ?? "",
    openings: job.openings.toString(),
    salaryMin: job.salary?.min?.toString() ?? "",
    salaryMax: job.salary?.max?.toString() ?? "",
    skills: job.skills.join(", "),
    optionalSkills: job.optionalSkills?.join(", ") ?? "",
    closingDate: job.closingDate?.slice(0, 10) ?? "",
  };
}

function toPayload(form: JobForm) {
  const min = form.salaryMin === "" ? undefined : Number(form.salaryMin);
  const max = form.salaryMax === "" ? undefined : Number(form.salaryMax);

  return {
    title: form.title.trim(),
    company: form.company.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
    workplaceType: form.workplaceType,
    employmentType: form.employmentType,
    experienceLevel: form.experienceLevel,
    minExperience: Number(form.minExperience),
    maxExperience: form.maxExperience === "" ? null : Number(form.maxExperience),
    openings: Number(form.openings),
    ...(min !== undefined || max !== undefined
      ? { salary: { min, max, currency: "INR" } }
      : {}),
    skills: form.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
    optionalSkills: form.optionalSkills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
    closingDate: form.closingDate || null,
  };
}

export default function RecruiterJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [recruiterName, setRecruiterName] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [jobCounts, setJobCounts] = useState<Record<JobStatus, number>>({
    draft: 0,
    published: 0,
    closed: 0,
    archived: 0,
  });
  const jobsRequestId = useRef(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadJobs = useCallback(async (token: string) => {
    const requestId = ++jobsRequestId.current;
    setLoading(true);
    try {
      const response = await apiRequest<JobsResponse>(
        `/jobs?${new URLSearchParams({
          page: String(page),
          limit: "12",
          sort,
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        })}`,
        {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }      );
      if (requestId !== jobsRequestId.current) return;
      setError("");
      setJobs(response.data);
      setPages(response.pagination.pages);
      setTotalJobs(response.pagination.total);
      setJobCounts(response.counts);
    } catch (requestError) {
      if (requestId !== jobsRequestId.current) return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load your job listings."
      );
    } finally {
      if (requestId === jobsRequestId.current) setLoading(false);
    }
  }, [page, search, sort, statusFilter]);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => {
      if (!active) return;

      const token = sessionStorage.getItem("authToken");
      const storedUser = sessionStorage.getItem("authUser");

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      if (!isRecruiter(storedUser)) {
        router.replace("/dashboard");
        return;
      }

      const currentUser: unknown = JSON.parse(storedUser);
      if (
        typeof currentUser === "object" &&
        currentUser !== null &&
        "fullName" in currentUser &&
        typeof currentUser.fullName === "string"
      ) {
        setRecruiterName(currentUser.fullName);
      }

      setAuthorized(true);
      void loadJobs(token);
    });

    return () => {
      active = false;
    };
  }, [loadJobs, router]);

  const filteredJobs = jobs;
  const publishedCount = jobCounts.published;
  const draftCount = jobCounts.draft;
  const closedCount = jobCounts.closed + jobCounts.archived;
  const recruiterInitials = recruiterName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const openCreateModal = () => {
    setEditingJob(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setForm(jobToForm(job));
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingJob(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (
      form.salaryMin !== "" &&
      form.salaryMax !== "" &&
      Number(form.salaryMin) > Number(form.salaryMax)
    ) {
      setError("The minimum salary cannot be higher than the maximum.");
      return;
    }

    setSaving(true);
    try {
      const endpoint = editingJob ? `/jobs/${editingJob._id}` : "/jobs";
      const response = await apiRequest<JobResponse>(endpoint, {
        method: editingJob ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(toPayload(form)),
      });

      setJobs((current) =>
        editingJob
          ? current.map((job) =>
              job._id === editingJob._id ? response.data : job
            )
          : [response.data, ...current]
      );
      setModalOpen(false);
      setEditingJob(null);
      setNotice(editingJob ? "Your listing has been updated." : "Draft saved. Publish it when you’re ready.");
      window.setTimeout(() => setNotice(""), 4000);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not save this job listing."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (job: Job, status: JobStatus) => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    setBusyJobId(job._id);
    setError("");
    try {
      const response = await apiRequest<JobResponse>(`/jobs/${job._id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setJobs((current) =>
        current.map((item) =>
          item._id === job._id ? response.data : item
        )
      );
      setNotice(`Listing ${status === "published" ? "published" : status === "closed" ? "closed" : "moved to drafts"}.`);
      window.setTimeout(() => setNotice(""), 4000);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update this listing."
      );
    } finally {
      setBusyJobId(null);
    }
  };

  const deleteJob = async (job: Job) => {
    if (!window.confirm(`Delete “${job.title}”? This cannot be undone.`)) {
      return;
    }

    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    setBusyJobId(job._id);
    setError("");
    try {
      await apiRequest<{ success: boolean }>(`/jobs/${job._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs((current) => current.filter((item) => item._id !== job._id));
      setNotice("Job listing deleted.");
      window.setTimeout(() => setNotice(""), 4000);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not delete this listing."
      );
    } finally {
      setBusyJobId(null);
    }
  };

  if (!authorized) {
    return (
      <main className="app-theme flex min-h-screen items-center justify-center bg-[#f7f7f3] text-sm text-[#777a71]">
        Preparing your workspace…
      </main>
    );
  }

  return (
    <main className="app-theme min-h-screen bg-[#f7f7f3] text-[#20251f]">
      <section className="min-w-0">
          <header className="flex h-[76px] items-center justify-between border-b border-[#e9e8e1] bg-[#fbfbf8] px-5 sm:px-8 lg:px-11">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                aria-label="Back to dashboard"
                className="flex size-9 items-center justify-center rounded-xl border border-[#e9e8e1] text-[#73776d] hover:bg-white lg:hidden"
              >
                <ArrowLeft size={17} />
              </Link>
              <div>
                <p className="text-xs font-medium text-[#85887f]">
                  Recruiter workspace
                </p>
                <p className="mt-0.5 text-sm font-semibold">Job management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/settings/appearance"
                aria-label="Appearance settings"
                className="flex size-9 items-center justify-center rounded-xl border border-[#e9e8e1] text-[#777a71] transition hover:bg-white lg:hidden"
              >
                <Settings2 size={16} />
              </Link>
              <span className="hidden items-center gap-2 rounded-full border border-[#e7e9df] bg-[#f3f5ed] px-3 py-1.5 text-xs font-medium text-[#5f7148] sm:inline-flex">
                <span className="size-1.5 rounded-full bg-[#81a44e]" />
                {recruiterName || "Recruiter account"}
              </span>
              <Link
                href="/dashboard"
                className="flex size-9 items-center justify-center rounded-full bg-[#e6eadf] text-xs font-bold text-[#3d4c32]"
                aria-label="Go to dashboard"
              >
                {recruiterInitials || "R"}
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-[1420px] px-5 py-8 sm:px-8 sm:py-10 lg:px-11">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#85887f]">
                  <span>Workspace</span>
                  <span>/</span>
                  <span className="text-[#48533d]">Job listings</span>
                </div>
                <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] sm:text-[38px]">
                  Your open doors<span className="text-[#87986a]">.</span>
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#777a71]">
                  Create thoughtful listings and find the people who will move your team forward.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36472e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#26351f] focus:outline-none focus:ring-4 focus:ring-[#657b45]/20"
              >
                <Plus size={17} />
                Create a job
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Published listings"
                value={publishedCount}
                detail="Visible to job seekers"
                icon={Send}
                tone="green"
              />
              <MetricCard
                label="Drafts in progress"
                value={draftCount}
                detail="Ready when you are"
                icon={FilePlus2}
                tone="sand"
              />
              <MetricCard
                label="Closed listings"
                value={closedCount}
                detail="No longer accepting applications"
                icon={Check}
                tone="gray"
              />
            </div>

            <section className="mt-8 overflow-hidden rounded-2xl border border-[#e9e8e1] bg-white shadow-[0_8px_30px_rgba(32,37,31,0.025)]">
              <div className="flex flex-col gap-5 border-b border-[#eeede7] px-5 py-5 sm:px-7 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">All listings</h2>
                  <p className="mt-1 text-xs text-[#8a8d84]">
                    A clear view of every role you’re shaping.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative block sm:w-[250px]">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999d93]"
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Search title, team, location"
                      aria-label="Search job listings"
                      className="h-10 w-full rounded-xl border border-[#e9e8e1] bg-[#fbfbf9] pl-10 pr-3 text-xs outline-none transition placeholder:text-[#a6a99f] focus:border-[#91a27a] focus:bg-white focus:ring-4 focus:ring-[#657b45]/10"
                    />
                  </label>
                  <div className="flex h-10 items-center gap-1 overflow-x-auto rounded-xl border border-[#e9e8e1] bg-[#fbfbf9] p-1">
                    {(
                      [
                        ["all", "All"],
                        ["published", "Live"],
                        ["draft", "Drafts"],
                        ["closed", "Closed"],
                        ["archived", "Archived"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(value);
                          setPage(1);
                        }}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          statusFilter === value
                            ? "bg-[#36472e] text-white shadow-sm"
                            : "text-[#767a70] hover:bg-white hover:text-[#30382a]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as "newest" | "oldest");
                      setPage(1);
                    }}
                    aria-label="Sort job listings"
                    className="h-10 rounded-xl border border-[#e9e8e1] bg-[#fbfbf9] px-3 text-xs"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>

              {notice && (
                <div
                  role="status"
                  className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-[#dce8ca] bg-[#f3f8e9] px-4 py-3 text-sm text-[#4f6734] sm:mx-7"
                >
                  <Check size={16} />
                  {notice}
                </div>
              )}
              {error && !modalOpen && (
                <div
                  role="alert"
                  className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-[#efd9d2] bg-[#fff7f4] px-4 py-3 text-sm text-[#a34c3d] sm:mx-7"
                >
                  <CircleAlert size={16} />
                  {error}
                  <button
                    type="button"
                    onClick={() => {
                      const token = sessionStorage.getItem("authToken");
                      if (token) void loadJobs(token);
                    }}
                    className="ml-auto font-semibold underline underline-offset-2"
                  >
                    Try again
                  </button>
                </div>
              )}

              {loading ? (
                <div className="space-y-3 p-5 sm:p-7" aria-label="Loading jobs">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-[106px] animate-pulse rounded-xl bg-[#f5f5f1]"
                    />
                  ))}
                </div>
              ) : filteredJobs.length > 0 ? (
                <div className="divide-y divide-[#f0efe9]">
                  {filteredJobs.map((job) => (
                    <JobRow
                      key={job._id}
                      job={job}
                      busy={busyJobId === job._id}
                      onEdit={() => openEditModal(job)}
                      onStatusChange={(status) => void updateStatus(job, status)}
                      onDelete={() => void deleteJob(job)}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-6 py-16 text-center sm:py-20">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f0f3e9] text-[#687d4e]">
                    {jobs.length ? <Filter size={23} /> : <BriefcaseBusiness size={23} />}
                  </div>
                  <h3 className="mt-5 text-base font-semibold">
                    {jobs.length ? "No listings match those filters" : "Your next great hire starts here"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#85887f]">
                    {jobs.length
                      ? "Try another search or status filter to find what you’re looking for."
                      : "Create your first job listing and give talented people a reason to find you."}
                  </p>
                  {jobs.length ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                        setPage(1);
                      }}
                      className="mt-5 text-sm font-semibold text-[#536b3d] hover:text-[#303e27]"
                    >
                      Clear filters
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#36472e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#26351f]"
                    >
                      <Plus size={16} /> Create a job
                    </button>
                  )}
                </div>
              )}

              {!loading && filteredJobs.length > 0 && (
                <div className="flex items-center justify-between border-t border-[#eeede7] bg-[#fbfbf9] px-5 py-3.5 text-xs text-[#898c83] sm:px-7">
                  <span>
                    Showing <span className="font-semibold text-[#4a5046]">{filteredJobs.length}</span> of{" "}
                    <span className="font-semibold text-[#4a5046]">{totalJobs}</span> listings
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="hidden items-center gap-1 sm:inline-flex">
                      <ArrowDownUp size={13} /> {sort === "newest" ? "Newest first" : "Oldest first"}
                    </span>
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                      className="rounded-lg border border-[#e9e8e1] px-3 py-1.5 font-semibold disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span>{page} / {pages}</span>
                    <button
                      type="button"
                      disabled={page >= pages}
                      onClick={() => setPage((current) => current + 1)}
                      className="rounded-lg border border-[#e9e8e1] px-3 py-1.5 font-semibold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>

            <div className="mt-5 flex items-center gap-2 px-1 text-xs text-[#92958d]">
              <Clock3 size={14} />
              Tip: add a closing date to keep your opportunities current.
            </div>
          </div>
      </section>

      {modalOpen && (
        <JobModal
          form={form}
          setForm={setForm}
          editing={Boolean(editingJob)}
          saving={saving}
          error={error}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Send;
  tone: "green" | "sand" | "gray";
}) {
  const toneClass = {
    green: "bg-[#edf4e4] text-[#58763d]",
    sand: "bg-[#f6f0e2] text-[#99783e]",
    gray: "bg-[#eeefec] text-[#70766c]",
  }[tone];

  return (
    <article className="rounded-2xl border border-[#e9e8e1] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#7d8177]">{label}</p>
          <p className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.04em]">
            {value.toString().padStart(2, "0")}
          </p>
          <p className="mt-2 text-[11px] text-[#9a9d94]">{detail}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon size={18} />
        </span>
      </div>
    </article>
  );
}

function JobRow({
  job,
  busy,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  job: Job;
  busy: boolean;
  onEdit: () => void;
  onStatusChange: (status: JobStatus) => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusClass = {
    published: "bg-[#edf5e5] text-[#56743d]",
    draft: "bg-[#f6f0e2] text-[#97773d]",
    closed: "bg-[#eff0ee] text-[#73776f]",
    archived: "bg-[#eff0ee] text-[#73776f]",
  }[job.status];

  return (
    <article className="group px-5 py-5 transition hover:bg-[#fdfdfa] sm:px-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-[#ecebe4] bg-[#f7f7f2] text-[#687b50] sm:flex">
            <Building2 size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-[#262c24] sm:text-[15px]">
                {job.title}
              </h3>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass}`}>
                {statusLabel[job.status]}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#85887f]">
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={13} /> {job.company}
              </span>
              <span className="hidden text-[#d1d2cc] sm:inline">·</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} /> {job.location}
              </span>
              <span className="hidden text-[#d1d2cc] sm:inline">·</span>
              <span className="capitalize">{job.employmentType.replace("-", " ")}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#f1f0eb] pt-3 text-xs text-[#85887f] md:border-0 md:pt-0">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            {job.status === "published" ? "Closes" : "Added"}{" "}
            {formatDate(job.status === "published" ? job.closingDate : job.createdAt)}
          </span>
          <span className="hidden items-center gap-1.5 lg:inline-flex">
            <Users size={14} />
            {formatSalary(job.salary)}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/recruiter/jobs/${job._id}/applications`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e9e8e1] px-3 text-xs font-semibold text-[#59664b] transition hover:border-[#cbd4bf] hover:bg-[#f4f7ef] hover:text-[#3e5830]"
          >
            <Users size={14} /> Candidates
          </Link>
          {job.status === "draft" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onStatusChange("published")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#36472e] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#26351f] disabled:opacity-50"
            >
              <Send size={13} /> Publish
            </button>
          )}
          {job.status === "published" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onStatusChange("closed")}
              className="rounded-lg border border-[#e9e8e1] px-3 py-2 text-xs font-semibold text-[#62665d] transition hover:border-[#d9d7cd] hover:bg-white disabled:opacity-50"
            >
              Close role
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onEdit}
            aria-label={`Edit ${job.title}`}
            className="flex size-9 items-center justify-center rounded-lg border border-[#e9e8e1] text-[#71766b] transition hover:border-[#cbd4bf] hover:bg-[#f4f7ef] hover:text-[#3e5830] disabled:opacity-50"
          >
            <Pencil size={15} />
          </button>
          <div className="relative">
            <button
              type="button"
              disabled={busy}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={`More actions for ${job.title}`}
              aria-expanded={menuOpen}
              className="flex size-9 items-center justify-center rounded-lg border border-[#e9e8e1] text-[#71766b] transition hover:bg-[#f7f7f2] disabled:opacity-50"
            >
              <MoreHorizontal size={17} />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close actions menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-[#e9e8e1] bg-white p-1 shadow-xl shadow-[#20251f]/10">
                  {job.status !== "draft" && job.status !== "archived" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange("draft");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-[#596052] hover:bg-[#f6f7f3]"
                    >
                      <FilePlus2 size={14} /> Move to drafts
                    </button>
                  )}
                  {job.status === "closed" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange("archived");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-[#596052] hover:bg-[#f6f7f3]"
                    >
                      <FilePlus2 size={14} /> Archive listing
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-[#a34c3d] hover:bg-[#fff5f2]"
                  >
                    <Trash2 size={14} /> Delete listing
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function JobModal({
  form,
  setForm,
  editing,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  form: JobForm;
  setForm: (update: (current: JobForm) => JobForm) => void;
  editing: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const updateField = <K extends keyof JobForm>(field: K, value: JobForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#172016]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-modal-title"
        className="max-h-[94vh] w-full max-w-[760px] overflow-y-auto rounded-t-3xl bg-[#fbfbf8] shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e9e8e1] bg-[#fbfbf8]/95 px-5 py-5 backdrop-blur sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#81906e]">
              {editing ? "Refine your listing" : "A new opportunity"}
            </p>
            <h2 id="job-modal-title" className="mt-1.5 text-xl font-semibold tracking-tight">
              {editing ? "Edit job details" : "Create a job listing"}
            </h2>
            <p className="mt-1 text-xs text-[#85887f]">
              {editing
                ? "Make sure the details are up to date."
                : "Start with the essentials. You can save it as a draft."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="flex size-9 items-center justify-center rounded-xl border border-[#e9e8e1] text-[#73776d] hover:bg-white"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-7 px-5 py-6 sm:px-8">
          <div>
            <SectionHeading number="01" title="The role" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#54594f] sm:col-span-2">
                Job title <span className="text-[#b45c4b]">*</span>
                <input
                  required
                  minLength={3}
                  maxLength={100}
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="e.g. Senior Product Designer"
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-semibold text-[#54594f]">
                Company <span className="text-[#b45c4b]">*</span>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.company}
                  onChange={(event) => updateField("company", event.target.value)}
                  placeholder="Your company name"
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-semibold text-[#54594f]">
                Location <span className="text-[#b45c4b]">*</span>
                <input
                  required
                  minLength={2}
                  maxLength={150}
                  value={form.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  placeholder="City, country or Remote"
                  className={inputClass}
                />
              </label>
              <SelectField
                label="Workplace"
                value={form.workplaceType}
                onChange={(value) => updateField("workplaceType", value as WorkplaceType)}
                options={[
                  ["onsite", "On-site"],
                  ["remote", "Remote"],
                  ["hybrid", "Hybrid"],
                ]}
              />
              <SelectField
                label="Employment type"
                value={form.employmentType}
                onChange={(value) => updateField("employmentType", value as EmploymentType)}
                options={[
                  ["full-time", "Full-time"],
                  ["part-time", "Part-time"],
                  ["contract", "Contract"],
                  ["internship", "Internship"],
                ]}
              />
              <SelectField
                label="Experience level"
                value={form.experienceLevel}
                onChange={(value) => updateField("experienceLevel", value as ExperienceLevel)}
                options={[
                  ["entry", "Entry level"],
                  ["junior", "Junior"],
                  ["mid", "Mid-level"],
                  ["senior", "Senior"],
                  ["lead", "Lead"],
                ]}
              />
              <label className="text-xs font-semibold text-[#54594f]">
                Minimum experience (years)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.minExperience}
                  onChange={(event) => updateField("minExperience", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-semibold text-[#54594f]">
                Maximum experience (years)
                <input
                  type="number"
                  min={form.minExperience || "0"}
                  step="0.5"
                  value={form.maxExperience}
                  onChange={(event) => updateField("maxExperience", event.target.value)}
                  placeholder="No maximum"
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-semibold text-[#54594f]">
                Number of openings
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={form.openings}
                  onChange={(event) => updateField("openings", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-semibold text-[#54594f]">
                Application deadline
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={form.closingDate}
                  onChange={(event) => updateField("closingDate", event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          <div>
            <SectionHeading number="02" title="Make it compelling" />
            <div className="mt-4 space-y-4">
              <label className="block text-xs font-semibold text-[#54594f]">
                Job description <span className="text-[#b45c4b]">*</span>
                <textarea
                  required
                  minLength={30}
                  rows={5}
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Describe the role, the team, and what success looks like…"
                  className={`${inputClass} resize-y leading-6`}
                />
                <span className="mt-1 block text-right text-[10px] font-normal text-[#9a9d94]">
                  {form.description.length} characters
                </span>
              </label>
              <label className="block text-xs font-semibold text-[#54594f]">
                Required skills <span className="font-normal text-[#92958d]">(separate with commas)</span>
                <input
                  value={form.skills}
                  onChange={(event) => updateField("skills", event.target.value)}
                  placeholder="e.g. React, TypeScript, UX research"
                  className={inputClass}
                />
              </label>
              <label className="block text-xs font-semibold text-[#54594f]">
                Preferred skills <span className="font-normal text-[#92958d]">(optional, separate with commas)</span>
                <input
                  value={form.optionalSkills}
                  onChange={(event) => updateField("optionalSkills", event.target.value)}
                  placeholder="e.g. AWS, Kubernetes"
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          <div>
            <SectionHeading number="03" title="Compensation" />
            <div className="mt-4">
              <p className="text-xs text-[#85887f]">
                Optional, but listings with salary ranges help candidates decide faster.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#54594f]">
                  Minimum salary <span className="font-normal text-[#92958d]">(INR / year)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.salaryMin}
                    onChange={(event) => updateField("salaryMin", event.target.value)}
                    placeholder="600000"
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-semibold text-[#54594f]">
                  Maximum salary <span className="font-normal text-[#92958d]">(INR / year)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.salaryMax}
                    onChange={(event) => updateField("salaryMax", event.target.value)}
                    placeholder="1000000"
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#efd9d2] bg-[#fff7f4] px-4 py-3 text-sm text-[#a34c3d]">
              <CircleAlert size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[#e9e8e1] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[#e5e4dc] px-5 py-3 text-sm font-semibold text-[#65695f] transition hover:bg-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36472e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26351f] disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving…
                </>
              ) : (
                <>
                  {editing ? <Check size={16} /> : <Plus size={16} />}
                  {editing ? "Save changes" : "Save as draft"}
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-7 items-center justify-center rounded-lg bg-[#edf1e6] text-[10px] font-bold text-[#62764a]">
        {number}
      </span>
      <h3 className="text-sm font-semibold text-[#343a30]">{title}</h3>
      <span className="h-px flex-1 bg-[#eeede7]" />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block text-xs font-semibold text-[#54594f]">
      {label}
      <span className="relative mt-2 block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} mt-0 appearance-none pr-10`}
        >
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#85887f]"
        />
      </span>
    </label>
  );
}
