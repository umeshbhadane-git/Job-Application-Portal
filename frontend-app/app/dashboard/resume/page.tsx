
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  Clock3,
  Download,
  FileText,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ResumeInfo = {
  fileName: string;
  fileUrl: string;
  storageKey: string;
  uploadedAt: string;
};

type ResumeResponse = {
  success: boolean;
  message: string;
  data?: ResumeInfo;
};

type ResumeLoadResult =
  | { success: true; resume: ResumeInfo | null }
  | { success: false; message: string };

export default function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resume, setResume] = useState<ResumeInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function showMessage(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  function getToken() {
    return sessionStorage.getItem("authToken");
  }

  async function readError(response: Response) {
    const data = await response.json().catch(() => ({}));
    return data.message || `Request failed (${response.status})`;
  }

  async function loadResume(): Promise<ResumeLoadResult> {
    const token = getToken();

    if (!token) {
      return {
        success: false,
        message: "Please log in to manage your resume.",
      };
    }

    if (!API_URL) {
      return {
        success: false,
        message: "NEXT_PUBLIC_API_URL is not configured.",
      };
    }

    try {
      // The backend GET endpoint downloads the file, so use
      // the profile API to check whether a resume exists.
      const response = await fetch(`${API_URL}/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const result = await response.json();
      const savedResume = result.data?.resume;

      return {
        success: true,
        resume: savedResume?.storageKey
          ? {
              fileName: savedResume.fileName,
              fileUrl: savedResume.fileUrl ?? "",
              storageKey: savedResume.storageKey,
              uploadedAt: savedResume.uploadedAt,
            }
          : null,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unable to load resume.",
      };
    }
  }

  useEffect(() => {
    let isCurrent = true;

    async function initializeResume() {
      const result = await loadResume();
      if (!isCurrent) {
        return;
      }

      if (result.success) {
        setResume(result.resume);
      } else {
        showMessage(result.message, true);
      }
      setLoading(false);
    }

    void initializeResume();

    return () => {
      isCurrent = false;
    };
    // Load the current user's resume when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      fileInputRef.current?.click();
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      showMessage("Only PDF and DOCX files are allowed.", true);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      showMessage("The resume must be 5 MB or smaller.", true);
      return;
    }

    const token = getToken();

    if (!token || !API_URL) {
      showMessage(
        !token ? "Please log in again." : "API URL is not configured.",
        true
      );
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);

      const response = await fetch(`${API_URL}/resumes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Do not set Content-Type manually. The browser adds
        // the multipart boundary required by Multer.
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const result: ResumeResponse = await response.json();
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (result.data?.storageKey) {
        setResume(result.data);
        showMessage(result.message || "Resume uploaded successfully.");
      } else {
        const refreshedResume = await loadResume();
        if (refreshedResume.success) {
          setResume(refreshedResume.resume);
          showMessage(result.message || "Resume uploaded successfully.");
        } else {
          showMessage(
            `Resume uploaded, but the page could not refresh: ${refreshedResume.message}`,
            true
          );
        }
      }
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Resume upload failed.",
        true
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload() {
    const token = getToken();

    if (!token || !API_URL) {
      showMessage(
        !token ? "Please log in again." : "API URL is not configured.",
        true
      );
      return;
    }

    setDownloading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/resumes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = resume?.fileName || "resume";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      showMessage("Resume download started.");
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Resume download failed.",
        true
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    const token = getToken();

    if (!token || !API_URL) {
      showMessage(
        !token ? "Please log in again." : "API URL is not configured.",
        true
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete your resume?")) {
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/resumes`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const result: ResumeResponse = await response.json();

      setResume(null);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showMessage(result.message || "Resume deleted successfully.");
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Resume deletion failed.",
        true
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Loading your resume...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
            <span className="rounded-xl bg-blue-600 p-2 text-white">
              <BriefcaseBusiness size={19} />
            </span>
            Career<span className="text-blue-600">Bridge</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to profile</span>
              <span className="sm:hidden">Profile</span>
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-semibold text-blue-600">CAREER DOCUMENTS</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Resume management
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
            Keep your resume current so you’re ready when the right opportunity comes along.
          </p>
        </div>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
              isError
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            }`}
          >
            {isError ? <ShieldCheck size={19} /> : <Check size={19} />}
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <FileText size={30} strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">
                      {resume ? "Your resume" : "Your resume, ready for your next move"}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        resume
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {resume ? "Uploaded" : "Not uploaded"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {resume
                      ? "Your resume is saved to your account. Download it or upload an updated version at any time."
                      : "Upload a recent resume to make your application profile more complete."}
                  </p>
                </div>
              </div>
            </section>

            {resume && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold">Current file</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      The resume currently associated with your account.
                    </p>
                  </div>
                  {resume.uploadedAt && (
                    <span className="hidden items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 sm:inline-flex">
                      <Clock3 size={14} />
                      {new Date(resume.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:items-center">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                    <FileText size={23} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold">{resume.fileName}</p>
                    {resume.uploadedAt && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:hidden">
                        Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Stored securely with your profile
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading || deleting}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Download size={16} />
                      {downloading ? "Downloading..." : "Download"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting || downloading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                    >
                      <Trash2 size={16} />
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div>
                <h2 className="text-lg font-bold">
                  {resume ? "Replace your resume" : "Upload your resume"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {resume
                    ? "Upload a newer version to replace the current file."
                    : "Choose a resume file from your device to get started."}
                </p>
              </div>

              <form onSubmit={handleUpload} className="mt-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => {
                    setSelectedFile(event.target.files?.[0] ?? null);
                    setMessage("");
                  }}
                  className="sr-only"
                  aria-label="Choose a resume file"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || deleting || downloading}
                  className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center transition hover:border-blue-400 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Upload size={23} />
                  </span>
                  <span className="mt-4 font-semibold">
                    {selectedFile ? selectedFile.name : "Choose a resume file"}
                  </span>
                  <span className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload`
                      : "PDF or DOCX · 5 MB maximum"}
                  </span>
                  <span className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    Browse files
                  </span>
                </button>

                <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Accepted formats: PDF and DOCX. Maximum file size: 5 MB.
                  </p>
                  <button
                    type="submit"
                    disabled={uploading || deleting || downloading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload size={16} />
                    {uploading
                      ? "Uploading..."
                      : selectedFile
                        ? resume
                          ? "Upload replacement"
                          : "Upload resume"
                        : "Choose a file"}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck size={20} />
              </div>
              <h2 className="mt-4 font-bold">Your file stays yours</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Your resume is stored with your account. You can replace or delete it whenever you need.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
              <h2 className="font-bold">Resume checklist</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  Use a clear, professional file name
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  Keep your experience and contact details current
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  Check the file is under 5 MB
                </li>
              </ul>
              <Link
                href="/dashboard/profile"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
              >
                Update your profile
                <ArrowLeft className="rotate-180" size={15} />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
