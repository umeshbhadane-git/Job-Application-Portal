
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import FeaturedJobs from "@/components/home/FeaturedJobs";

const categories = [
  { name: "Engineering", count: "Search open roles", icon: BriefcaseBusiness },
  { name: "Design", count: "Search open roles", icon: Sparkles },
  { name: "Marketing", count: "Search open roles", icon: TrendingUp },
  { name: "Human Resources", count: "Search open roles", icon: Users },
];

export default function HomePage() {
  return (
    <main className="app-theme min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <Navbar />

      <section className="relative isolate overflow-hidden bg-[#f3f5ef] dark:bg-[#151d13]">
        <div className="pointer-events-none absolute -right-24 -top-40 -z-10 size-[520px] rounded-full border border-[#35472e]/[0.06] dark:border-white/[0.05]" />
        <div className="pointer-events-none absolute -bottom-40 left-[14%] -z-10 size-96 rounded-full bg-[#c4e58a]/20 blur-3xl dark:bg-[#c4e58a]/[0.06]" />

        <div className="mx-auto max-w-7xl px-5 py-14 sm:py-18 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dce4d1] bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#536b3d] shadow-sm dark:border-[#35412f] dark:bg-[#1b2419] dark:text-[#c4e58a]">
              <Sparkles size={15} />
              A clearer way to find your next role
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-[#20251f] dark:text-white sm:text-5xl lg:text-[60px]">
              Find a job that
              <span className="block text-[#536b3d] dark:text-[#c4e58a]">
                moves you forward.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#6d7367] dark:text-[#b8c2b0] sm:text-base">
              Search published opportunities, compare the details, and find a
              role that fits your next step.
            </p>

            <form
              action="/jobs"
              method="get"
              className="mx-auto mt-8 grid max-w-4xl gap-2 rounded-2xl border border-[#e4e6de] bg-white p-2.5 shadow-[0_18px_50px_rgba(32,37,31,0.10)] dark:border-[#35412f] dark:bg-[#1b2419] sm:grid-cols-[1fr_1fr_auto] sm:p-3"
            >
              <label className="flex min-w-0 items-center gap-3 rounded-xl px-3">
                <Search size={19} className="shrink-0 text-[#718455] dark:text-[#c4e58a]" />
                <input
                  type="search"
                  name="q"
                  placeholder="Job title, company, or skill"
                  aria-label="Job title, company, or skill"
                  className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#9a9d94] dark:text-[#edf2e8] dark:placeholder:text-[#858e7d]"
                />
              </label>

              <label className="flex min-w-0 items-center gap-3 rounded-xl border-t border-[#eeede7] px-3 sm:border-l sm:border-t-0 dark:border-[#35412f]">
                <MapPin size={18} className="shrink-0 text-[#718455] dark:text-[#c4e58a]" />
                <input
                  type="text"
                  name="location"
                  placeholder="City or remote"
                  aria-label="Job location"
                  className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#9a9d94] dark:text-[#edf2e8] dark:placeholder:text-[#858e7d]"
                />
              </label>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#36472e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#26351f] dark:bg-[#c4e58a] dark:text-[#25311d] dark:hover:bg-[#d2efa2]"
              >
                Search jobs <ArrowRight size={17} />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="mr-1 font-medium text-[#7d8177] dark:text-[#aab2a4]">
                Explore:
              </span>
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={`/jobs?search=${encodeURIComponent(category.name)}`}
                  className="rounded-full border border-[#e0e4d8] bg-white/70 px-3 py-1.5 font-medium text-[#59664b] transition hover:border-[#b6c4a4] hover:bg-white dark:border-[#35412f] dark:bg-[#1b2419] dark:text-[#c0c9b8] dark:hover:text-[#c4e58a]"
                >
                  {category.name}
                </Link>
              ))}
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
                href={`/jobs?search=${encodeURIComponent(category.name)}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
              >
                <span className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950 dark:text-blue-300">
                  <Icon size={23} />
                </span>
                <h3 className="mt-5 font-bold">{category.name}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {category.count}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured jobs */}
      <section className="bg-[#f3f4ef] py-16 dark:bg-[#151d13]">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Fresh from recruiters
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Open opportunities
              </h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400">
                Published roles with deadlines that have not passed.
              </p>
            </div>

            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 self-start font-semibold text-[#536b3d] hover:text-[#26351f] dark:text-[#c4e58a] dark:hover:text-white sm:self-auto"
            >
              Browse all jobs
              <ArrowRight size={18} />
            </Link>
          </div>

          <FeaturedJobs />
        </div>
      </section>

      {/* Employer call to action */}
      <section id="for-employers" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div
          id="how-it-works"
          className="overflow-hidden rounded-3xl bg-[#35472e] px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14"
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
                Create a recruiter account to publish openings and keep your
                job listings up to date.
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
