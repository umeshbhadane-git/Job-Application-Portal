"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings2,
  UserRound,
  X,
} from "lucide-react";

import ThemeSelector from "@/components/layout/ThemeSelector";

type User = {
  fullName: string;
  role: "jobSeeker" | "recruiter" | "admin";
};

let cachedToken: string | null | undefined;
let cachedStoredUser: string | null | undefined;
let cachedUser: User | null = null;
let cachedExpiresAt = 0;

function isWorkspacePath(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/recruiter/jobs") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

function getUserFromSession(): User | null {
  const token = sessionStorage.getItem("authToken");
  const storedUser = sessionStorage.getItem("authUser");
  if (
    token === cachedToken &&
    storedUser === cachedStoredUser &&
    (cachedUser === null || cachedExpiresAt > Date.now())
  ) {
    return cachedUser;
  }

  cachedToken = token;
  cachedStoredUser = storedUser;
  cachedUser = null;
  cachedExpiresAt = 0;
  if (!token || !storedUser) return cachedUser;

  try {
    const user: unknown = JSON.parse(storedUser);
    const payloadPart = token.split(".")[1];
    if (!payloadPart || !isWorkspaceUser(user)) return null;

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
      return cachedUser;
    }

    cachedUser = user;
    cachedExpiresAt = payload.exp * 1000;
    return cachedUser;
  } catch {
    return cachedUser;
  }
}

function isWorkspaceUser(value: unknown): value is User {
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

function subscribeToSession(callback: () => void) {
  const notify = () => callback();
  window.addEventListener("storage", notify);
  window.addEventListener("focus", notify);
  window.addEventListener("visibilitychange", notify);

  const token = sessionStorage.getItem("authToken");
  let expirationTimer: ReturnType<typeof setTimeout> | undefined;
  const payloadPart = token?.split(".")[1];
  if (payloadPart) {
    try {
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(
        atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
      );
      if (typeof payload.exp === "number") {
        const delay = payload.exp * 1000 - Date.now();
        if (delay > 0) {
          expirationTimer = setTimeout(
            notify,
            Math.min(delay + 1, 2_147_483_647)
          );
        }
      }
    } catch {}
  }

  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("focus", notify);
    window.removeEventListener("visibilitychange", notify);
    if (expirationTimer) clearTimeout(expirationTimer);
  };
}

function subscribeToHydration() {
  return () => {};
}

export default function WorkspaceFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeToSession,
    getUserFromSession,
    () => null
  );
  const workspacePage = isWorkspacePath(pathname);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!workspacePage || !hydrated || user) return;

    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
    const currentPage = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    router.replace(`/login?redirect=${encodeURIComponent(currentPage)}`);
  }, [hydrated, router, user, workspacePage]);

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
    router.replace("/login");
  };

  if (!workspacePage) return children;

  const roleLabel =
    user?.role === "recruiter"
      ? "Recruiter"
      : user?.role === "admin"
        ? "Administrator"
        : "Job seeker";
  const isRecruiter = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";
  const closeMenu = () => setMenuOpen(false);
  const initials =
    user?.fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "";

  const navClass =
    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition";
  const navLinks = (
    <>
      <p className="px-3 pt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-[#899183]">
        Workspace
      </p>
      <Link
        href="/dashboard"
        onClick={closeMenu}
        className={`${navClass} mt-4 ${
          pathname === "/dashboard"
            ? "bg-[#c4e58a] font-semibold text-[#25311d]"
            : "text-[#c2c8bc] hover:bg-white/5 hover:text-white"
        }`}
      >
        <LayoutDashboard size={18} />
        Overview
      </Link>
      <Link
        href={isRecruiter ? "/recruiter/jobs" : isAdmin ? "/admin" : "/jobs"}
        onClick={closeMenu}
        className={`${navClass} mt-1 ${
          (isRecruiter && pathname.startsWith("/recruiter/jobs")) ||
          (isAdmin && pathname.startsWith("/admin")) ||
          (!isRecruiter && !isAdmin && pathname === "/jobs")
            ? "bg-[#c4e58a] font-semibold text-[#25311d]"
            : "text-[#c2c8bc] hover:bg-white/5 hover:text-white"
        }`}
      >
        {isRecruiter || isAdmin ? (
          <BriefcaseBusiness size={18} />
        ) : (
          <Search size={18} />
        )}
        {isRecruiter ? "Job listings" : isAdmin ? "Admin console" : "Find jobs"}
        <ArrowUpRight className="ml-auto" size={15} />
      </Link>

      <p className="px-3 pt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#899183]">
        Your account
      </p>
      <Link
        href="/dashboard/profile"
        onClick={closeMenu}
        className={`${navClass} mt-4 ${
          pathname === "/dashboard/profile"
            ? "bg-[#c4e58a] font-semibold text-[#25311d]"
            : "text-[#c2c8bc] hover:bg-white/5 hover:text-white"
        }`}
      >
        <UserRound size={18} />
        Profile
      </Link>
      {!isRecruiter && !isAdmin && (
        <Link
          href="/dashboard/applications"
          onClick={closeMenu}
          className={`${navClass} mt-1 ${
            pathname === "/dashboard/applications"
              ? "bg-[#c4e58a] font-semibold text-[#25311d]"
              : "text-[#c2c8bc] hover:bg-white/5 hover:text-white"
          }`}
        >
          <ClipboardList size={18} />
          Applications
        </Link>
      )}
      {!isRecruiter && !isAdmin && (
        <Link
          href="/dashboard/resume"
          onClick={closeMenu}
          className={`${navClass} mt-1 ${
            pathname === "/dashboard/resume"
              ? "bg-[#c4e58a] font-semibold text-[#25311d]"
              : "text-[#c2c8bc] hover:bg-white/5 hover:text-white"
          }`}
        >
          <FileText size={18} />
          Resume
        </Link>
      )}
    </>
  );

  const sidebar = (
    <aside className="flex h-full flex-col overflow-y-auto bg-[#20291f] px-5 text-white">
      <Link href="/" onClick={closeMenu} className="flex items-center gap-3 px-2 py-7">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#c4e58a] text-[#25311d]">
          <BriefcaseBusiness size={21} strokeWidth={2.2} />
        </span>
        <span className="text-[17px] font-bold tracking-tight">
          Career<span className="text-[#c4e58a]">Bridge</span>
        </span>
      </Link>

      <nav className="flex-1">{navLinks}</nav>


      <div className="border-t border-white/10 px-1 py-4">
        <Link
          href="/settings/appearance"
          onClick={closeMenu}
          className="mb-3 flex items-center gap-2 px-2 text-xs font-semibold text-[#c2c8bc] transition hover:text-white"
        >
          <Settings2 size={15} />
          Settings · Appearance
        </Link>
        <ThemeSelector compact />
      </div>

      <button
        type="button"
        onClick={() => {
          closeMenu();
          handleLogout();
        }}
        className="flex items-center gap-3 border-t border-white/10 px-3 py-5 text-sm text-[#c2c8bc] transition hover:bg-white/5 hover:text-white"
      >
        <LogOut size={17} />
        Sign out
      </button>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-30 hidden w-[244px] lg:block">
        {sidebar}
      </div>

      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[#e9e8e1] bg-[#fbfbf8] px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          className="flex size-10 items-center justify-center rounded-xl border border-[#e9e8e1] text-[#48533d]"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="text-sm font-bold tracking-tight">
          Career<span className="text-[#718455]">Bridge</span>
        </Link>
        <Link
          href="/dashboard/profile"
          onClick={closeMenu}
          aria-label="Open my profile"
          className="flex size-9 items-center justify-center rounded-full bg-[#e6eadf] text-xs font-bold text-[#3d4c32]"
        >
          <span className="sr-only">{roleLabel}</span>
          {initials || <UserRound size={16} />}
        </Link>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <div className="relative h-full w-[min(84vw,300px)] shadow-2xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-3 top-7 z-10 flex size-9 items-center justify-center rounded-lg text-white hover:bg-white/10"
            >
              <X size={19} />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      {workspacePageContent(children, hydrated && Boolean(user))}
    </>
  );
}

function workspacePageContent(children: React.ReactNode, sessionChecked: boolean) {
  return (
    <div className="min-h-screen pt-14 lg:pl-[244px] lg:pt-0">
      {sessionChecked ? (
        children
      ) : (
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[#f7f7f3] text-sm text-[#73776d] lg:min-h-screen">
          <span className="flex items-center gap-3">
            <span className="size-4 animate-spin rounded-full border-2 border-[#d6ddca] border-t-[#536b3d]" />
            Preparing your workspace…
          </span>
        </main>
      )}
    </div>
  );
}
