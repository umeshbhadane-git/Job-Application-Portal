
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import JobCard, { type Job } from "../components/home/JobCard";

const jobs: Job[] = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "TechNova",
    location: "Pune, India",
    type: "Full-time",
    salary: "₹6–10 LPA",
    category: "Engineering",
    featured: true,
  },
  {
    id: 2,
    title: "React Developer",
    company: "PixelWorks",
    location: "Bengaluru, India",
    type: "Hybrid",
    salary: "₹8–14 LPA",
    category: "Technology",
  },
  {
    id: 3,
    title: "Product Designer",
    company: "BrightLabs",
    location: "Remote",
    type: "Full-time",
    salary: "₹7–12 LPA",
    category: "Design",
    featured: true,
  },
];

const categories = [
  { name: "Engineering", count: "1,240+", icon: BriefcaseBusiness },
  { name: "Design", count: "580+", icon: Sparkles },
  { name: "Marketing", count: "760+", icon: TrendingUp },
  { name: "Human Resources", count: "320+", icon: Users },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="pointer-events-none absolute -right-20 -top-24 -z-10 size-96 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-900/20" />
        <div className="pointer-events-none absolute -bottom-36 -left-20 -z-10 size-80 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-900/20" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 md:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300">
              <Sparkles size={16} />
              Your next opportunity starts here
            </div>

            <h1 className="mt-7 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Find work that
              <span className="block text-blue-600">
                moves you forward.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              Discover opportunities that match your skills, explore
              companies you admire, and take the next step in your career.
            </p>

            <form
              action="/jobs"
              method="get"
              className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[1fr_1fr_auto]"
            >
              <label className="flex min-w-0 items-center gap-3 px-3">
                <Search size={20} className="shrink-0 text-blue-600" />
                <input
                  type="search"
                  name="q"
                  placeholder="Job title or keyword"
                  aria-label="Job title or keyword"
                  className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="flex min-w-0 items-center gap-3 border-t border-slate-100 px-3 sm:border-l sm:border-t-0 dark:border-slate-800">
                <BriefcaseBusiness
                  size={19}
                  className="shrink-0 text-blue-600"
                />
                <input
                  type="text"
                  name="location"
                  placeholder="City or remote"
                  aria-label="Job location"
                  className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                />
              </label>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Search Jobs
                <ArrowRight size={17} />
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Popular:{" "}
              <Link href="/jobs?q=React" className="hover:text-blue-600">
                React
              </Link>
              {" · "}
              <Link href="/jobs?q=Node.js" className="hover:text-blue-600">
                Node.js
              </Link>
              {" · "}
              <Link href="/jobs?q=UI%2FUX" className="hover:text-blue-600">
                UI/UX
              </Link>
              {" · "}
              <Link href="/jobs?q=Remote" className="hover:text-blue-600">
                Remote
              </Link>
            </p>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-blue-950/10 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Career overview
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    Your next chapter
                  </h2>
                </div>
                <span className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  <TrendingUp size={23} />
                </span>
              </div>

              <div className="mt-7 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Find your best-fit opportunity
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <BriefcaseBusiness size={22} />
                  </div>
                  <div>
                    <p className="font-semibold">Opportunities for you</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Explore roles that fit your goals
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {["Discover relevant jobs", "Explore new companies", "Track your applications"].map(
                    (item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={17} className="text-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {item}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                    Ready for your next move?
                  </p>
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    Create your profile to get started.
                  </p>
                </div>
                <Link
                  href="/register"
                  aria-label="Create your profile"
                  className="shrink-0 rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-700"
                >
                  <ArrowUpRight size={20} />
                </Link>
              </div>
            </div>

          </div> 
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Explore opportunities
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Browse by category
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Start with the field that matches your interests.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.name}
                href={`/jobs?category=${encodeURIComponent(category.name)}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
              >
                <span className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950 dark:text-blue-300">
                  <Icon size={23} />
                </span>
                <h3 className="mt-5 font-bold">{category.name}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {category.count} opportunities
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured jobs */}
      <section className="bg-slate-50 py-16 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Handpicked for discovery
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Featured opportunities
              </h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400">
                A preview of how job listings will appear.
              </p>
            </div>

            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 self-start font-semibold text-blue-600 hover:text-blue-700 sm:self-auto"
            >
              Browse all jobs
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>

      {/* Employer call to action */}
      <section id="for-employers" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div
          id="how-it-works"
          className="overflow-hidden rounded-3xl bg-blue-600 px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14"
        >
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
                For employers
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Find the people who move your business forward.
              </h2>
              <p className="mt-4 leading-7 text-blue-100">
                Create a recruiter account to get ready to publish openings
                and manage applicants.
              </p>
            </div>

            <Link
              href="/register"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-6 py-3.5 font-semibold text-blue-700 transition hover:bg-blue-50 md:self-center"
            >
              Join as a recruiter
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"
          >
            <BriefcaseBusiness size={19} className="text-blue-600" />
            CareerBridge
          </Link>
          <p>
            A better way to discover your next opportunity.
          </p>
          <p>© 2026 CareerBridge</p>
        </div>
      </footer>
    </main>
  );
}
