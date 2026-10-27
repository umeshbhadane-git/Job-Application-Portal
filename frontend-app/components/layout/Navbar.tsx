
"use client";

import Link from "next/link";
import { useState } from "react";
import { BriefcaseBusiness, Menu, Moon, Sun, X } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem(
      "job-portal-theme",
      nextDark ? "dark" : "light"
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white"
        >
          <span className="rounded-xl bg-blue-600 p-2 text-white">
            <BriefcaseBusiness size={21} />
          </span>
          Career<span className="text-blue-600">Bridge</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/jobs"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300"
          >
            Find Jobs
          </Link>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300"
          >
            How It Works
          </a>
          <a
            href="#for-employers"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300"
          >
            For Employers
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Moon className="block dark:hidden" size={18} />
            <Sun className="hidden dark:block" size={18} />
          </button>

          <Link
            href="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Log in
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-xl border border-slate-200 p-2.5 dark:border-slate-700"
          >
            <Moon className="block dark:hidden" size={18} />
            <Sun className="hidden dark:block" size={18} />
          </button>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-slate-200 p-2.5 dark:border-slate-700"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="space-y-1 border-t border-slate-200 px-5 py-4 dark:border-slate-800 md:hidden">
          <Link
            href="/jobs"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Find Jobs
          </Link>
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Log in
          </Link>
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg bg-blue-600 px-3 py-3 text-center text-sm font-semibold text-white"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
