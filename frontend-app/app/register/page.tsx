
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import { apiRequest } from "../../lib/api";

type RegisterResponse = {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      fullName: string;
      email: string;
      role: "jobSeeker" | "recruiter";
    };
    token: string;
  };
};

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"jobSeeker" | "recruiter">("jobSeeker");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest<RegisterResponse>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            role,
          }),
        }
      );

      setSuccess(response.message || "Registration successful!");

      // Registration is complete. Continue to the login page.
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to register. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-14">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-xl font-bold tracking-tight"
        >
          <span className="rounded-xl bg-blue-600 p-2 text-white">
            <BriefcaseBusiness size={22} />
          </span>
          Career<span className="text-blue-600">Bridge</span>
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create your account
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Join CareerBridge and take the next step in your career.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold"
              >
                Full name
              </label>
              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-semibold"
              >
                I want to
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "jobSeeker" | "recruiter")
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="jobSeeker">Find a job</option>
                <option value="recruiter">Hire candidates</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>
              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  maxLength={72}
                  required
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold"
              >
                Confirm password
              </label>
              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                {error}
              </p>
            )}

            {success && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Log in
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          By creating an account, you agree to use CareerBridge responsibly.
        </p>
      </div>
    </main>
  );
}
