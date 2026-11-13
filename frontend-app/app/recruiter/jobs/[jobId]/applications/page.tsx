"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CircleAlert,
  Download,
  FileText,
  MessageSquareText,
  Users,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

type Status =
  | "applied"
  | "under-review"
  | "shortlisted"
  | "interview-scheduled"
  | "selected"
  | "rejected"
  | "withdrawn";

type Application = {
  _id: string;
  status: Status;
  createdAt: string;
  candidateSnapshot: {
    fullName: string;
    email: string;
    headline: string;
    location: string;
    skills: string[];
    experience: number;
    phone?: string;
    bio?: string;
    experienceHistory?: Array<{
      company: string;
      jobTitle: string;
      startDate: string;
      endDate: string | null;
      currentlyWorking: boolean;
      description: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      fieldOfStudy: string;
      startDate: string | null;
      endDate: string | null;
    }>;
    portfolioUrl?: string;
    linkedInUrl?: string;
    githubUrl?: string;
  };
  notes: Array<{ _id: string; body: string; createdAt: string }>;
};

type JobResponse = { data: { title: string } };
type ApplicationsResponse = { data: Application[] };

const nextStatuses: Partial<Record<Status, Status[]>> = {
  applied: ["under-review"],
  "under-review": ["shortlisted", "interview-scheduled", "selected", "rejected"],
  shortlisted: ["interview-scheduled", "selected", "rejected"],
  "interview-scheduled": ["selected", "rejected"],
};

const statusLabel = (status: Status) =>
  ({
    applied: "Applied",
    "under-review": "Under review",
    shortlisted: "Shortlisted",
    "interview-scheduled": "Interview scheduled",
    selected: "Selected",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  })[status];

function RecruiterApplicationsContent() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [skill, setSkill] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [jobResponse, applicationsResponse] = await Promise.all([
        apiRequest<JobResponse>(`/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest<ApplicationsResponse>(
          `/applications/jobs/${jobId}?${new URLSearchParams({
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(skill.trim() ? { skill: skill.trim() } : {}),
            sort,
          })}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }

        ),
      ]);
      setJobTitle(jobResponse.data.title);
      setApplications(applicationsResponse.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load applicants for this job."
      );
    } finally {
      setLoading(false);
    }
  }, [jobId, router, skill, sort, statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const updateStatus = async (application: Application, status: Status) => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    setBusyId(application._id);
    setError("");
    try {
      const response = await apiRequest<{ data: Application }>(
        `/applications/${application._id}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status }),
        }
      );
      setApplications((current) =>
        current.map((item) =>
          item._id === application._id ? response.data : item
        )
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update the candidate status."
      );
    } finally {
      setBusyId("");
    }
  };

  const addNote = async (
    event: FormEvent<HTMLFormElement>,
    application: Application
  ) => {
    event.preventDefault();
    const body = noteDrafts[application._id]?.trim();
    const token = sessionStorage.getItem("authToken");
    if (!body || !token) return;
    setBusyId(application._id);
    setError("");
    try {
      const response = await apiRequest<{ data: Application }>(
        `/applications/${application._id}/notes`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ body }),
        }
      );
      setApplications((current) =>
        current.map((item) =>
          item._id === application._id ? response.data : item
        )
      );
      setNoteDrafts((current) => ({ ...current, [application._id]: "" }));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not save the internal note."
      );
    } finally {
      setBusyId("");
    }
  };

  const downloadResume = async (application: Application) => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    setBusyId(application._id);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("API URL is not configured.");
      const response = await fetch(
        `${apiUrl}/applications/${application._id}/resume`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Could not download the resume.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${application.candidateSnapshot.fullName}-resume.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not download the resume."
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="app-theme min-h-screen bg-[#f7f7f3] px-5 py-8 text-[#20251f] sm:px-8 lg:px-11">
      <div className="mx-auto max-w-[1200px]">
        <Link
          href="/recruiter/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#536b3d]"
        >
          <ArrowLeft size={16} /> Job listings
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#82916f]">
              Candidate pipeline
            </p>
            <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.04em]">
              {jobTitle || "Applicants"}
            </h1>
            <p className="mt-2 text-sm text-[#85887f]">
              Review candidates, update stages, and add private recruiter notes.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#e9e8e1] bg-white px-4 py-2.5 text-sm font-semibold dark:border-[#303b2b] dark:bg-[#1b2419]">
            <Users size={16} className="text-[#718455]" />
            {applications.length} candidates
          </span>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-[#e9e8e1] bg-white p-4 dark:border-[#303b2b] dark:bg-[#1b2419] sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-xs font-medium text-[#777a71]">
            Filter by skill
            <input
              value={skill}
              onChange={(event) => setSkill(event.target.value)}
              placeholder="e.g. React"
              className="mt-1.5 h-10 w-full rounded-lg border border-[#e9e8e1] bg-transparent px-3 text-sm text-[#20251f] outline-none focus:border-[#91a27a] dark:border-[#35412f] dark:text-[#edf2e8]"
            />
          </label>
          <label className="text-xs font-medium text-[#777a71]">
            Application stage
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-[#e9e8e1] bg-white px-3 text-sm text-[#20251f] dark:border-[#35412f] dark:bg-[#1b2419] dark:text-[#edf2e8]"
            >
              <option value="">All stages</option>
              {Object.entries({
                applied: "Applied",
                "under-review": "Under review",
                shortlisted: "Shortlisted",
                "interview-scheduled": "Interview scheduled",
                selected: "Selected",
                rejected: "Rejected",
                withdrawn: "Withdrawn",
              }).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-[#777a71]">
            Sort candidates
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-[#e9e8e1] bg-white px-3 text-sm text-[#20251f] dark:border-[#35412f] dark:bg-[#1b2419] dark:text-[#edf2e8]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="experience">Most experience</option>
            </select>
          </label>
        </div>

        {error && (
          <div role="alert" className="mt-5 flex items-center gap-2 rounded-xl border border-[#efd9d2] bg-[#fff7f4] px-4 py-3 text-sm text-[#a34c3d]">
            <CircleAlert size={16} /> {error}
          </div>
        )}

        <section className="mt-5 space-y-3">
          {loading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-white dark:bg-[#1b2419]" />
          ) : applications.length ? (
            applications.map((application) => (
              <article
                key={application._id}
                className="rounded-2xl border border-[#e9e8e1] bg-white p-5 dark:border-[#303b2b] dark:bg-[#1b2419] sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#edf4e4] text-sm font-bold text-[#536b3d] dark:bg-[#2a3823] dark:text-[#c4e58a]">
                      {application.candidateSnapshot.fullName
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-semibold">{application.candidateSnapshot.fullName}</h2>
                      <p className="mt-1 text-xs text-[#777a71]">
                        {application.candidateSnapshot.headline || "Job seeker"} ·{" "}
                        {application.candidateSnapshot.location || "Location not provided"}
                      </p>
                      <p className="mt-1 text-xs text-[#85887f]">
                        {application.candidateSnapshot.email} ·{" "}
                        {application.candidateSnapshot.experience} years experience
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {application.candidateSnapshot.skills.map((item) => (
                          <span key={item} className="rounded-full bg-[#f3f4ef] px-2.5 py-1 text-[10px] font-medium text-[#687063] dark:bg-[#252f22] dark:text-[#c0c9b8]">
                            {item}
                          </span>
                        ))}
                      </div>
                      <details className="mt-4 text-xs">
                        <summary className="cursor-pointer font-semibold text-[#536b3d]">
                          View candidate profile
                        </summary>
                        <div className="mt-3 space-y-4 rounded-xl bg-[#f7f7f3] p-4 dark:bg-[#20291f]">
                          {application.candidateSnapshot.bio ? (
                            <p className="whitespace-pre-line leading-5 text-[#62665d] dark:text-[#c0c9b8]">
                              {application.candidateSnapshot.bio}
                            </p>
                          ) : null}
                          {application.candidateSnapshot.phone ? (
                            <p className="text-[#62665d] dark:text-[#c0c9b8]">
                              Phone: {application.candidateSnapshot.phone}
                            </p>
                          ) : null}
                          {application.candidateSnapshot.experienceHistory?.length ? (
                            <div>
                              <p className="mb-2 font-semibold">Experience</p>
                              <div className="space-y-2">
                                {application.candidateSnapshot.experienceHistory?.map((item, index) => (
                                  <div key={`${item.company}-${index}`}>
                                    <p className="font-medium">{item.jobTitle} · {item.company}</p>
                                    <p className="mt-0.5 text-[#85887f]">
                                      {new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(item.startDate))}
                                      {" – "}
                                      {item.currentlyWorking || !item.endDate
                                        ? "Present"
                                        : new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(item.endDate))}
                                    </p>
                                    {item.description ? <p className="mt-1 whitespace-pre-line leading-5 text-[#62665d] dark:text-[#c0c9b8]">{item.description}</p> : null}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {application.candidateSnapshot.education?.length ? (
                            <div>
                              <p className="mb-2 font-semibold">Education</p>
                              <div className="space-y-2">
                                {application.candidateSnapshot.education?.map((item, index) => (
                                  <p key={`${item.institution}-${index}`} className="text-[#62665d] dark:text-[#c0c9b8]">
                                    <span className="font-medium">{item.degree}{item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ""}</span>
                                    {" · "}{item.institution}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-3">
                            {[
                              ["Portfolio", application.candidateSnapshot.portfolioUrl],
                              ["LinkedIn", application.candidateSnapshot.linkedInUrl],
                              ["GitHub", application.candidateSnapshot.githubUrl],
                            ].filter(([, url]) => url).map(([label, url]) => (
                              <a key={label} href={url} target="_blank" rel="noreferrer" className="font-semibold text-[#536b3d] underline">
                                {label}
                              </a>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#edf4e4] px-3 py-1.5 text-xs font-semibold text-[#536b3d] dark:bg-[#2a3823] dark:text-[#c4e58a]">
                      {statusLabel(application.status)}
                    </span>
                    <button
                      type="button"
                      disabled={busyId === application._id}
                      onClick={() => void downloadResume(application)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e9e8e1] px-3 py-2 text-xs font-semibold hover:bg-[#f7f7f3] disabled:opacity-50 dark:border-[#35412f]"
                    >
                      <Download size={14} /> Resume
                    </button>
                    {nextStatuses[application.status]?.length ? (
                      <select
                        value=""
                        disabled={busyId === application._id}
                        onChange={(event) => {
                          const nextStatus = event.target.value as Status;
                          if (nextStatus) void updateStatus(application, nextStatus);
                        }}
                        aria-label={`Update status for ${application.candidateSnapshot.fullName}`}
                        className="h-9 rounded-lg border border-[#e9e8e1] bg-white px-2 text-xs font-semibold dark:border-[#35412f] dark:bg-[#1b2419]"
                      >
                        <option value="">Move to…</option>
                        {nextStatuses[application.status]?.map((status) => (
                          <option key={status} value={status}>{statusLabel(status)}</option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 border-t border-[#eeede7] pt-4 dark:border-[#303b2b]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#59664b]">
                    <MessageSquareText size={14} /> Internal notes
                  </div>
                  {application.notes.map((note) => (
                    <p key={note._id} className="mt-2 rounded-lg bg-[#f7f7f3] px-3 py-2 text-xs leading-5 text-[#62665d] dark:bg-[#20291f] dark:text-[#c0c9b8]">
                      {note.body}
                    </p>
                  ))}
                  <form
                    onSubmit={(event) => void addNote(event, application)}
                    className="mt-3 flex flex-col gap-2 sm:flex-row"
                  >
                    <input
                      value={noteDrafts[application._id] || ""}
                      onChange={(event) =>
                        setNoteDrafts((current) => ({
                          ...current,
                          [application._id]: event.target.value,
                        }))
                      }
                      maxLength={2000}
                      placeholder="Add a private note for your recruiting team"
                      aria-label={`Internal note for ${application.candidateSnapshot.fullName}`}
                      className="h-10 min-w-0 flex-1 rounded-lg border border-[#e9e8e1] bg-transparent px-3 text-xs outline-none focus:border-[#91a27a] dark:border-[#35412f]"
                    />
                    <button
                      type="submit"
                      disabled={busyId === application._id || !noteDrafts[application._id]?.trim()}
                      className="h-10 rounded-lg bg-[#36472e] px-4 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Add note
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : !error ? (
            <div className="rounded-2xl border border-[#e9e8e1] bg-white px-6 py-14 text-center dark:border-[#303b2b] dark:bg-[#1b2419]">
              <FileText size={24} className="mx-auto text-[#82916f]" />
              <h2 className="mt-4 font-semibold">No candidates found</h2>
              <p className="mt-2 text-sm text-[#85887f]">Try changing the filters or check again later.</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default function RecruiterApplicationsPage() {
  return (
    <Suspense
      fallback={
        <main className="app-theme min-h-screen animate-pulse bg-[#f7f7f3]" />
      }
    >
      <RecruiterApplicationsContent />
    </Suspense>
  );
}
