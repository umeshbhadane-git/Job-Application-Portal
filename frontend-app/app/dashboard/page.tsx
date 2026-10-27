
"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Users,
} from "lucide-react";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: "jobSeeker" | "recruiter" | "admin";
};

const subscribeToAuthChanges = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

const getAuthSnapshot = () =>
  JSON.stringify([
    sessionStorage.getItem("authToken"),
    sessionStorage.getItem("authUser"),
  ]);

const getServerAuthSnapshot = () => "[]";

const parseUser = (storedUser: string | null): User | null => {
  if (!storedUser) {
    return null;
  }

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

export default function DashboardPage() {
  const router = useRouter();
  const authSnapshot = useSyncExternalStore(
    subscribeToAuthChanges,
    getAuthSnapshot,
    getServerAuthSnapshot
  );
  const [token, storedUser] = JSON.parse(authSnapshot) as [
    string | null,
    string | null,
  ];
  const user = useMemo(() => parseUser(storedUser), [storedUser]);

  useEffect(() => {
    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    if (!user) {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("authUser");
      router.replace("/login");
    }
  }, [router, storedUser, token, user]);

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
    router.replace("/login");
  };

  if (!token || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Loading dashboard...
      </main>
    );
  }

  const roleContent = {
    jobSeeker: {
      title: "Your job search starts here",
      description: "Explore opportunities and keep track of your applications.",
      action: "Find jobs",
      href: "/jobs",
      icon: Search,
      stats: [
        { label: "Applications", value: "—", icon: FileText },
        { label: "Saved jobs", value: "—", icon: BriefcaseBusiness },
        { label: "Profile completion", value: "—", icon: Users },
      ],
    },
    recruiter: {
      title: "Find your next great hire",
      description: "Manage your job postings and discover talented candidates.",
      action: "Manage jobs",
      href: "/recruiter/jobs",
      icon: BriefcaseBusiness,
      stats: [
        { label: "Active jobs", value: "—", icon: BriefcaseBusiness },
        { label: "Applications received", value: "—", icon: FileText },
        { label: "Candidates", value: "—", icon: Users },
      ],
    },
    admin: {
      title: "Platform overview",
      description: "Manage platform activity and monitor user accounts.",
      action: "Manage users",
      href: "/admin/users",
      icon: Users,
      stats: [
        { label: "Total users", value: "—", icon: Users },
        { label: "Job postings", value: "—", icon: BriefcaseBusiness },
        { label: "Applications", value: "—", icon: FileText },
      ],
    },
  };

  const content = roleContent[user.role];
  const ActionIcon = content.icon;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="rounded-xl bg-blue-600 p-2 text-white">
              <BriefcaseBusiness size={20} />
            </span>
            Career<span className="text-blue-600">Bridge</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:block">
              {user.fullName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <LayoutDashboard size={16} />
          Dashboard
          <span>·</span>
          <span className="capitalize">{user.role.replace(/([A-Z])/g, " $1")}</span>
        </div>

        <section className="mt-6 rounded-3xl bg-blue-600 p-7 text-white sm:p-10">
          <p className="text-sm font-medium text-blue-100">
            Welcome back, {user.fullName}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-100">
            {content.description}
          </p>
          <Link
            href={content.href}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            <ActionIcon size={18} />
            {content.action}
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Your overview</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {content.stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <span className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                      <Icon size={20} />
                    </span>
                  </div>
                  <p className="mt-5 text-3xl font-bold">{stat.value}</p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
