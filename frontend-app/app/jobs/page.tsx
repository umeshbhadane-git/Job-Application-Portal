"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CircleAlert,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { apiRequest } from "@/lib/api";
import {
  formatJobLabel,
  formatJobSalary,
  type PublicJob,
  type PublicJobsResponse,
} from "@/lib/publicJobs";

type Filters = {
  search: string;
  location: string;
  employmentType: string;
  skill: string;
  workplaceType: string;
  minExperience: string;
  maxExperience: string;
  sort: string;
};

const emptyFilters: Filters = {
  search: "",
  location: "",
  employmentType: "",
  skill: "",
  workplaceType: "",
  minExperience: "",
  maxExperience: "",
  sort: "newest",
};

function getFiltersFromUrl(): Filters {
  const params = new URLSearchParams(window.location.search);
  return {
    search: params.get("search") || params.get("q") || "",
    location: params.get("location") || "",
    employmentType: params.get("employmentType") || "",
    skill: params.get("skill") || "",
    workplaceType: params.get("workplaceType") || "",
    minExperience: params.get("minExperience") || "",
    maxExperience: params.get("maxExperience") || "",
    sort: params.get("sort") || "newest",
  };
}

function buildQuery(filters: Filters, page: number) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.location.trim()) params.set("location", filters.location.trim());
  if (filters.skill.trim()) params.set("skill", filters.skill.trim());
  if (filters.workplaceType) params.set("workplaceType", filters.workplaceType);
  if (filters.minExperience) params.set("minExperience", filters.minExperience);
  if (filters.maxExperience) params.set("maxExperience", filters.maxExperience);
  if (filters.employmentType) {
    params.set("employmentType", filters.employmentType);
  }
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  params.set("page", String(page));
  return params;
}

function buildEndpoint(filters: Filters, page: number) {
  return `/jobs/public?${buildQuery(filters, page).toString()}`;
}

export default function JobsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PublicJobsResponse["pagination"]>();

  const loadJobs = useCallback(async (nextFilters: Filters, nextPage = 1) => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<PublicJobsResponse>(
        buildEndpoint(nextFilters, nextPage),
        { cache: "no-store" }
      );
      setJobs(response.data);
      setPagination(response.pagination);
      setPage(response.pagination?.page ?? nextPage);
    } catch (requestError) {
      setJobs([]);
      setPagination(undefined);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We couldn’t load job listings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      const initialFilters = getFiltersFromUrl();
      setFilters(initialFilters);
      const initialPage = Math.max(
        1,
        Number(new URLSearchParams(window.location.search).get("page")) || 1
      );
      setPage(initialPage);
      void loadJobs(initialFilters, initialPage);
    });
    return () => {
      active = false;
    };
  }, [loadJobs]);

  const applyFilters = () => {
    setPage(1);
    router.replace(`/jobs?${buildQuery(filters, 1).toString()}`, { scroll: false });
    void loadJobs(filters, 1);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
    router.replace("/jobs", { scroll: false });
    void loadJobs(emptyFilters);
  };

  const searchCategory = (category: string) => {
    const nextFilters = { ...filters, search: category };
    setFilters(nextFilters);
    setPage(1);
    router.replace(`/jobs?${buildQuery(nextFilters, 1).toString()}`, { scroll: false });
    void loadJobs(nextFilters);
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    router.replace(`/jobs?${buildQuery(filters, nextPage).toString()}`, {
      scroll: false,
    });
    void loadJobs(filters, nextPage);
  };

  return (
    <main className="app-theme min-h-screen bg-[#f7f7f3] text-[#20251f]">
      <Navbar />

      <section className="relative isolate overflow-hidden bg-[#263522] text-white dark:bg-[#1a2417]">
        <div className="pointer-events-none absolute -right-24 -top-40 -z-10 size-[520px] rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -right-4 -top-20 -z-10 size-[360px] rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -bottom-40 left-[34%] -z-10 size-96 rounded-full bg-[#c4e58a]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-12 pt-9 sm:pb-14 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:pb-16 lg:pt-14">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[#d9e7ca]">
              <Sparkles size={14} className="text-[#c4e58a]" />
              FIND YOUR NEXT CHAPTER
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-[54px]">
              Find a job that{" "}
              <span className="text-[#c4e58a]">moves you forward.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#d0d9c8] sm:text-base">
              Search current openings by role, skill, location, and work type.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-[#d0d9c8]">
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#c4e58a]" />
                Published opportunities
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#c4e58a]" />
                Clear role details
              </span>
            </div>
          </div>
          <div className="hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm lg:block">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#c4e58a] text-[#283722]">
              <BriefcaseBusiness size={22} />
            </div>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-[#c4e58a]">
              Search with confidence
            </p>
            <p className="mt-3 text-xl font-semibold leading-7 tracking-tight">
              Compare the details before you apply.
            </p>
            <p className="mt-3 text-sm leading-6 text-[#c5d0bd]">
              Every listing includes the location, work type, skills, and
              deadline to help you decide if it fits.
            </p>
            <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-[#d9e7ca]">
                <Search size={16} />
              </span>
              <span className="text-xs font-medium text-[#d0d9c8]">
                Start with a title, skill, or place
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <form
          onSubmit={handleSearch}
          className="relative z-10 -mt-6 grid gap-2 rounded-2xl border border-[#e9e8e1] bg-white p-3 shadow-[0_18px_50px_rgba(32,37,31,0.12)] dark:border-[#35412f] dark:bg-[#1b2419] sm:p-4 md:grid-cols-[1.3fr_1fr_0.85fr_auto]"
        >
          <label className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-1.5 transition focus-within:bg-[#f7f8f4] dark:focus-within:bg-[#20291f]">
            <Search size={18} className="shrink-0 text-[#718455] dark:text-[#c4e58a]" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Job title, company, or skill"
              aria-label="Search jobs"
              className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#a7aaa2] dark:text-[#edf2e8] dark:placeholder:text-[#858e7d]"
            />
          </label>
          <label className="flex min-w-0 items-center gap-3 rounded-xl border-t border-[#eeede7] px-3 py-1.5 transition focus-within:bg-[#f7f8f4] dark:border-[#35412f] dark:focus-within:bg-[#20291f] md:border-l md:border-t-0">
            <MapPin size={17} className="shrink-0 text-[#718455] dark:text-[#c4e58a]" />
            <input
              type="search"
              value={filters.location}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              placeholder="City or remote"
              aria-label="Filter by location"
              className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#a7aaa2] dark:text-[#edf2e8] dark:placeholder:text-[#858e7d]"
            />
          </label>
          <label className="flex min-w-0 items-center gap-3 rounded-xl border-t border-[#eeede7] px-3 py-1.5 transition focus-within:bg-[#f7f8f4] dark:border-[#35412f] dark:focus-within:bg-[#20291f] md:border-l md:border-t-0">
            <SlidersHorizontal size={16} className="shrink-0 text-[#718455] dark:text-[#c4e58a]" />
            <select
              value={filters.employmentType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  employmentType: event.target.value,
                }))
              }
              aria-label="Filter by employment type"
              className="min-w-0 w-full appearance-none bg-transparent py-3 text-sm text-[#62665d] outline-none dark:text-[#d4dccd]"
            >
              <option value="">All employment types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#36472e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26351f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8ba36b]/30 dark:bg-[#c4e58a] dark:text-[#25311d] dark:hover:bg-[#d2efa2]"
          >
            Search jobs <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#82916f] dark:text-[#b7ca9b]">
              Explore opportunities
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em]">
              {loading
                ? "Finding open roles…"
                : error
                  ? "Job listings are unavailable"
                  : `${pagination?.total ?? jobs.length} open ${
                      (pagination?.total ?? jobs.length) === 1 ? "role" : "roles"
                    }`}
            </h2>
            <p className="mt-1 text-sm text-[#85887f] dark:text-[#aab2a4]">
              {error
                ? "Please try again in a moment."
                : "Published roles with open deadlines"}
            </p>
          </div>
          {(filters.search ||
            filters.location ||
            filters.employmentType ||
            filters.skill ||
            filters.workplaceType ||
            filters.minExperience ||
            filters.maxExperience) && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-[#536b3d] transition hover:bg-[#edf4e4] hover:text-[#26351f] dark:text-[#c4e58a] dark:hover:bg-[#2a3823]"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#e9e8e1] bg-white p-5 dark:border-[#303b2b] dark:bg-[#1b2419]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#82916f] dark:text-[#b7ca9b]">
              Browse by field
            </p>
            <div className="mt-3 space-y-1">
              {["Engineering", "Design", "Marketing", "Human Resources"].map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => searchCategory(category)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-[#62665d] transition hover:bg-[#f3f4ef] hover:text-[#36472e] dark:text-[#c0c9b8] dark:hover:bg-[#252f22] dark:hover:text-[#c4e58a]"
                  >
                    {category}
                    <ArrowRight size={14} className="text-[#a2a99a]" />
                  </button>
                )
              )}
            </div>
            <div className="mt-5 space-y-3 border-t border-[#eeede7] pt-5 dark:border-[#303b2b]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#82916f] dark:text-[#b7ca9b]">
                Refine results
              </p>
              <label className="block text-xs font-medium text-[#70766c] dark:text-[#c0c9b8]">
                Required skill
                <input
                  value={filters.skill}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, skill: event.target.value }))
                  }
                  placeholder="e.g. Java"
                  className="mt-1.5 h-9 w-full rounded-lg border border-[#e9e8e1] bg-transparent px-2.5 text-xs outline-none focus:border-[#91a27a] dark:border-[#35412f]"
                />
              </label>
              <label className="block text-xs font-medium text-[#70766c] dark:text-[#c0c9b8]">
                Work mode
                <select
                  value={filters.workplaceType}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      workplaceType: event.target.value,
                    }))
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-[#e9e8e1] bg-white px-2.5 text-xs dark:border-[#35412f] dark:bg-[#1b2419]"
                >
                  <option value="">All work modes</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-[#70766c] dark:text-[#c0c9b8]">
                  Min. years
                  <input
                    type="number"
                    min="0"
                    value={filters.minExperience}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        minExperience: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-9 w-full rounded-lg border border-[#e9e8e1] bg-transparent px-2.5 text-xs dark:border-[#35412f]"
                  />
                </label>
                <label className="block text-xs font-medium text-[#70766c] dark:text-[#c0c9b8]">
                  Max. years
                  <input
                    type="number"
                    min="0"
                    value={filters.maxExperience}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        maxExperience: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-9 w-full rounded-lg border border-[#e9e8e1] bg-transparent px-2.5 text-xs dark:border-[#35412f]"
                  />
                </label>
              </div>
              <label className="block text-xs font-medium text-[#70766c] dark:text-[#c0c9b8]">
                Sort by
                <select
                  value={filters.sort}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, sort: event.target.value }))
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-[#e9e8e1] bg-white px-2.5 text-xs dark:border-[#35412f] dark:bg-[#1b2419]"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="salary-desc">Highest salary</option>
                  <option value="salary-asc">Lowest salary</option>
                </select>
              </label>
              <button
                type="button"
                onClick={applyFilters}
                className="w-full rounded-lg bg-[#36472e] px-3 py-2.5 text-xs font-semibold text-white dark:bg-[#c4e58a] dark:text-[#25311d]"
              >
                Apply filters
              </button>
            </div>
            <div className="mt-5 border-t border-[#eeede7] pt-5 dark:border-[#303b2b]">
              <p className="text-sm font-semibold">Job seeker tip</p>
              <p className="mt-2 text-xs leading-5 text-[#85887f] dark:text-[#aab2a4]">
                Use a job title or skill and a city to narrow your search.
                Review the deadline and required skills before applying.
              </p>
              <Link
                href="/dashboard/profile"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#536b3d] hover:text-[#26351f] dark:text-[#c4e58a] dark:hover:text-white"
              >
                Complete your profile <ArrowRight size={13} />
              </Link>
            </div>
          </aside>

          <div className="min-w-0">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-xl border border-[#efd9d2] bg-[#fff7f4] px-4 py-3 text-sm text-[#a34c3d] dark:border-[#5a3b32] dark:bg-[#32231f] dark:text-[#f0b5a7]"
          >
            <CircleAlert size={17} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadJobs(filters, page)}
              className="ml-auto shrink-0 font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex h-[145px] animate-pulse items-start gap-4 rounded-2xl border border-[#e9e8e1] bg-white p-5 dark:border-[#303b2b] dark:bg-[#1b2419]"
              >
                <div className="size-11 shrink-0 rounded-xl bg-[#f0f1eb] dark:bg-[#303b2b]" />
                <div className="min-w-0 flex-1">
                  <div className="mt-1 h-4 w-2/3 rounded bg-[#f0f1eb] dark:bg-[#303b2b]" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-[#f0f1eb] dark:bg-[#303b2b]" />
                  <div className="mt-5 h-3 w-3/4 rounded bg-[#f0f1eb] dark:bg-[#303b2b]" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobListingCard key={job._id} job={job} />
            ))}
          </div>
        ) : (
          !error && (
            <div className="mt-6 rounded-3xl border border-[#e9e8e1] bg-white px-6 py-16 text-center dark:border-[#303b2b] dark:bg-[#1b2419]">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#edf4e4] text-[#58763d] dark:bg-[#2a3823] dark:text-[#c4e58a]">
                <BriefcaseBusiness size={24} />
              </span>
              <h3 className="mt-5 text-lg font-semibold dark:text-[#edf2e8]">
                No open jobs found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#85887f] dark:text-[#aab2a4]">
                There aren’t any published, unexpired roles matching those
                filters right now. Try a broader search or check back soon.
              </p>
              {(filters.search ||
                filters.location ||
                filters.employmentType ||
                filters.skill ||
                filters.workplaceType ||
                filters.minExperience ||
                filters.maxExperience) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-[#36472e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#26351f] dark:bg-[#c4e58a] dark:text-[#25311d] dark:hover:bg-[#d2efa2]"
                >
                  Show all jobs
                </button>
              )}
            </div>
          )
        )}
            {!loading && pagination && pagination.pages > 1 && (
              <nav
                aria-label="Job result pages"
                className="mt-4 flex items-center justify-between rounded-xl border border-[#e9e8e1] bg-white px-4 py-3 dark:border-[#303b2b] dark:bg-[#1b2419]"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => changePage(page - 1)}
                  className="rounded-lg border border-[#e9e8e1] px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-[#35412f]"
                >
                  Previous
                </button>
                <span className="text-xs text-[#777a71] dark:text-[#aab2a4]">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => changePage(page + 1)}
                  className="rounded-lg border border-[#e9e8e1] px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-[#35412f]"
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function JobListingCard({ job }: { job: PublicJob }) {
  return (
    <article className="group relative flex flex-col gap-5 rounded-2xl border border-[#e9e8e1] bg-white p-5 transition duration-200 hover:border-[#cbd6bd] hover:shadow-[0_12px_30px_rgba(32,37,31,0.07)] dark:border-[#303b2b] dark:bg-[#1b2419] dark:hover:border-[#596c47] sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#edf4e4] text-[#58763d] dark:bg-[#2a3823] dark:text-[#c4e58a]">
          <Building2 size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 text-base font-semibold leading-6 tracking-[-0.02em] text-[#263026] dark:text-[#edf2e8]">
              {job.title}
            </h3>
            <span className="rounded-full bg-[#edf5e5] px-2 py-0.5 text-[10px] font-semibold text-[#56743d] dark:bg-[#2a3823] dark:text-[#c4e58a]">
              Published role
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-[#777a71] dark:text-[#aab2a4]">
            <Building2 size={13} className="mr-1 inline-block" />
            {job.company}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <JobTag icon={<MapPin size={12} />}>{job.location}</JobTag>
            <JobTag>{formatJobLabel(job.employmentType)}</JobTag>
            <JobTag>{formatJobLabel(job.workplaceType)}</JobTag>
            <JobTag>{formatJobLabel(job.experienceLevel)} experience</JobTag>
          </div>

          {job.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-[#edf0e8] px-2 py-1 text-[10px] font-medium text-[#697260] dark:border-[#35412f] dark:text-[#b7c1ae]"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 4 && (
                <span className="px-1 py-1 text-[10px] text-[#85887f] dark:text-[#aab2a4]">
                  +{job.skills.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-end justify-between gap-5 border-t border-[#eeede7] pt-4 dark:border-[#303b2b] sm:min-w-[180px] sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:py-1 sm:pl-5 sm:text-right">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#92958d] dark:text-[#899183]">
            Salary range
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-[#4c5940] dark:text-[#c4e58a]">
            {formatJobSalary(job.salary)}
          </p>
          {job.closingDate && (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-[#85887f] dark:text-[#aab2a4] sm:justify-end">
              <Clock3 size={11} />
              Deadline{" "}
              {new Intl.DateTimeFormat("en", {
                day: "numeric",
                month: "short",
              }).format(new Date(job.closingDate))}
            </p>
          )}
        </div>
        <Link
          href={`/jobs/${job._id}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#36472e] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#26351f] group-hover:gap-2 dark:bg-[#c4e58a] dark:text-[#25311d] dark:hover:bg-[#d2efa2]"
        >
          View role <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}

function JobTag({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4ef] px-2.5 py-1 text-[10px] font-medium text-[#70766c] dark:bg-[#252f22] dark:text-[#c0c9b8]">
      {icon}
      {children}
    </span>
  );
}
