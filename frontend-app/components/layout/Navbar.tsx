
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Menu,
  Settings2,
  UserRound,
  X,
} from "lucide-react";

type User = {
  fullName: string;
  role: "jobSeeker" | "recruiter" | "admin";
};

function readSignedInUser(): User | null {
  const token = sessionStorage.getItem("authToken");
  const storedUser = sessionStorage.getItem("authUser");
  if (!token || !storedUser) return null;

  try {
    const user: unknown = JSON.parse(storedUser);
    const payloadPart = token.split(".")[1];
    if (!payloadPart || !isNavbarUser(user)) return null;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
    );
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("exp" in payload) ||
      typeof payload.exp !== "number" ||
      payload.exp * 1000 <= Date.now()
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

function isNavbarUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "fullName" in value &&
    typeof value.fullName === "string" &&
    "role" in value &&
    (value.role === "jobSeeker" ||
      value.role === "recruiter" ||
      value.role === "admin")
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setUser(readSignedInUser());
    });

    return () => {
      active = false;
    };
  }, []);

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

        <div className="hidden items-center gap-8 lg:flex">
          <Link
            href="/jobs"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300"
          >
            Find Jobs
          </Link>
          <Link
            href="/#for-employers"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300"
          >
            For employers
          </Link>
          <Link
            href="/settings/appearance"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300"
          >
            <Settings2 size={15} />
            Appearance
          </Link>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <UserRound size={17} />
              {user.fullName}
            </Link>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
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
        <div className="space-y-1 border-t border-slate-200 px-5 py-4 dark:border-slate-800 lg:hidden">
          <Link
            href="/jobs"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Find Jobs
          </Link>
          <Link
            href="/#for-employers"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            For employers
          </Link>
          <Link
            href="/settings/appearance"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Settings2 size={16} />
            Appearance
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <UserRound size={17} />
              {user.fullName}
            </Link>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </header>
  );
}
