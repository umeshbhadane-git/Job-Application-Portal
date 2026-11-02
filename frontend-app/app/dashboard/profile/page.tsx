"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Code2,
  CircleHelp,
  ExternalLink,
  GraduationCap,
  Link2,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type Experience = {
  company: string;
  jobTitle: string;
  employmentType: "full-time" | "part-time" | "contract" | "internship";
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
};

type Education = {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
};

type Profile = {
  headline: string;
  phone: string;
  location: string;
  bio: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  portfolioUrl: string;
  linkedInUrl: string;
  githubUrl: string;
  resume: { fileName?: string; storageKey?: string } | null;
};

type ProfileResponse = {
  success: boolean;
  message?: string;
  data: Partial<Profile>;
};

const emptyProfile: Profile = {
  headline: "",
  phone: "",
  location: "",
  bio: "",
  skills: [],
  experience: [],
  education: [],
  portfolioUrl: "",
  linkedInUrl: "",
  githubUrl: "",
  resume: null,
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function cleanProfile(data: Partial<Profile>): Profile {
  return {
    ...emptyProfile,
    ...data,
    skills: data.skills ?? [],
    experience:
      data.experience?.map((item) => ({
        ...item,
        startDate: dateInputValue(item.startDate),
        endDate: dateInputValue(item.endDate),
      })) ?? [],
    education:
      data.education?.map((item) => ({
        ...item,
        startDate: dateInputValue(item.startDate),
        endDate: dateInputValue(item.endDate),
      })) ?? [],
    resume: data.resume ?? null,
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [skillsInput, setSkillsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      try {
        const token = sessionStorage.getItem("authToken");

        if (!token) {
          throw new Error("Please log in to view your profile.");
        }

        const response = await apiRequest<ProfileResponse>("/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isCurrent) return;

        const loadedProfile = cleanProfile(response.data);
        setProfile(loadedProfile);
        setSkillsInput(loadedProfile.skills.join(", "));
        setMessage("");
        setIsError(false);
      } catch (error) {
        if (!isCurrent) return;
        setIsError(true);
        setMessage(
          error instanceof Error ? error.message : "Unable to load profile."
        );
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      isCurrent = false;
    };
  }, []);

  const completionItems = useMemo(
    () => [
      { label: "Professional headline", complete: Boolean(profile.headline.trim()), section: "about" },
      { label: "Location", complete: Boolean(profile.location.trim()), section: "about" },
      { label: "About you", complete: Boolean(profile.bio.trim()), section: "about" },
      { label: "Skills", complete: profile.skills.length > 0 || Boolean(skillsInput.trim()), section: "skills" },
      { label: "Work experience", complete: profile.experience.length > 0, section: "experience" },
      { label: "Education", complete: profile.education.length > 0, section: "education" },
      { label: "Resume", complete: Boolean(profile.resume?.storageKey), section: "resume" },
      { label: "Professional links", complete: Boolean(profile.linkedInUrl || profile.portfolioUrl || profile.githubUrl), section: "links" },
    ],
    [profile, skillsInput]
  );
  const completion = Math.round(
    (completionItems.filter((item) => item.complete).length /
      completionItems.length) *
      100
  );

  function updateField<K extends keyof Profile>(field: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateExperience(
    index: number,
    field: keyof Experience,
    value: string | boolean
  ) {
    setProfile((current) => ({
      ...current,
      experience: current.experience.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function updateEducation(index: number, field: keyof Education, value: string) {
    setProfile((current) => ({
      ...current,
      education: current.education.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) throw new Error("Please log in again.");

      const payload = {
        headline: profile.headline,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        skills: skillsInput
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        experience: profile.experience.map((item) => ({
          ...item,
          endDate: item.currentlyWorking ? null : item.endDate || null,
        })),
        education: profile.education.map((item) => ({
          ...item,
          startDate: item.startDate || undefined,
          endDate: item.endDate || undefined,
        })),
        portfolioUrl: profile.portfolioUrl,
        linkedInUrl: profile.linkedInUrl,
        githubUrl: profile.githubUrl,
      };

      const response = await apiRequest<ProfileResponse>("/profile/me", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const savedProfile = cleanProfile(response.data);
      setProfile(savedProfile);
      setSkillsInput(savedProfile.skills.join(", "));
      setMessage(response.message || "Your profile has been saved.");
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Loading your profile...
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
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 sm:flex"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>
            <Link
              href="/dashboard/resume"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:px-4"
            >
              <Upload size={16} />
              Manage resume
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-semibold text-blue-600">MY CAREER PROFILE</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Make your next move
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
            Keep your experience, skills, and career details ready for your next opportunity.
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
            {isError ? <CircleHelp size={19} /> : <Check size={19} />}
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <UserRound size={36} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold">Your professional profile</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Add the details recruiters look for to help your profile stand out.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                    {profile.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={15} />
                        {profile.location}
                      </span>
                    )}
                    {profile.headline && (
                      <span className="inline-flex items-center gap-1.5">
                        <BriefcaseBusiness size={15} />
                        {profile.headline}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </div>
            </section>

            <section
              id="about"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
            >
              <SectionHeading
                icon={<UserRound size={19} />}
                title="Personal and professional details"
                description="Help employers understand who you are and what you do."
              />
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Professional headline
                  <input
                    value={profile.headline}
                    onChange={(event) => updateField("headline", event.target.value)}
                    maxLength={150}
                    placeholder="e.g. Frontend Developer | React & TypeScript"
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Current location
                  <input
                    value={profile.location}
                    onChange={(event) => updateField("location", event.target.value)}
                    maxLength={150}
                    placeholder="City, country"
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  Phone number
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    maxLength={25}
                    placeholder="Your contact number"
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  Professional summary
                  <textarea
                    value={profile.bio}
                    onChange={(event) => updateField("bio", event.target.value)}
                    rows={5}
                    maxLength={2000}
                    placeholder="Summarize your experience, strengths, and the kind of opportunity you are looking for."
                    className={`${inputClassName} resize-y`}
                  />
                  <span className="mt-1 block text-right text-xs font-normal text-slate-400">
                    {profile.bio.length}/2000
                  </span>
                </label>
              </div>
            </section>

            <section
              id="skills"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
            >
              <SectionHeading
                icon={<Sparkles size={19} />}
                title="Key skills"
                description="Add relevant skills so employers can quickly see your strengths."
              />
              <label className="mt-6 block text-sm font-semibold">
                Skills
                <input
                  value={skillsInput}
                  onChange={(event) => setSkillsInput(event.target.value)}
                  placeholder="React, Node.js, Project management"
                  className={inputClassName}
                />
              </label>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Separate skills with commas.
              </p>
              {skillsInput.trim() && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {skillsInput
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean)
                    .map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              )}
            </section>

            <section
              id="experience"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
            >
              <SectionHeading
                icon={<BriefcaseBusiness size={19} />}
                title="Work experience"
                description="Show the roles and impact that make up your career story."
              />
              <div className="mt-6 space-y-4">
                {profile.experience.map((item, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-semibold">Experience {index + 1}</h3>
                      <button
                        type="button"
                        aria-label={`Remove experience ${index + 1}`}
                        onClick={() =>
                          setProfile((current) => ({
                            ...current,
                            experience: current.experience.filter((_, i) => i !== index),
                          }))
                        }
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium">
                        Job title
                        <input required value={item.jobTitle} onChange={(event) => updateExperience(index, "jobTitle", event.target.value)} placeholder="e.g. Software Engineer" className={inputClassName} />
                      </label>
                      <label className="text-sm font-medium">
                        Company
                        <input required value={item.company} onChange={(event) => updateExperience(index, "company", event.target.value)} placeholder="Company name" className={inputClassName} />
                      </label>
                      <label className="text-sm font-medium">
                        Employment type
                        <select value={item.employmentType} onChange={(event) => updateExperience(index, "employmentType", event.target.value)} className={inputClassName}>
                          <option value="full-time">Full-time</option>
                          <option value="part-time">Part-time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                        </select>
                      </label>
                      <label className="text-sm font-medium">
                        Start date
                        <input required type="date" value={item.startDate} onChange={(event) => updateExperience(index, "startDate", event.target.value)} className={inputClassName} />
                      </label>
                      {!item.currentlyWorking && (
                        <label className="text-sm font-medium">
                          End date
                          <input type="date" value={item.endDate} onChange={(event) => updateExperience(index, "endDate", event.target.value)} className={inputClassName} />
                        </label>
                      )}
                      <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium">
                        <input type="checkbox" checked={item.currentlyWorking} onChange={(event) => updateExperience(index, "currentlyWorking", event.target.checked)} className="size-4 accent-blue-600" />
                        I currently work here
                      </label>
                      <label className="text-sm font-medium sm:col-span-2">
                        Description
                        <textarea value={item.description} onChange={(event) => updateExperience(index, "description", event.target.value)} rows={3} maxLength={2000} placeholder="Share your responsibilities and achievements." className={`${inputClassName} resize-y`} />
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setProfile((current) => ({
                      ...current,
                      experience: [
                        ...current.experience,
                        {
                          company: "",
                          jobTitle: "",
                          employmentType: "full-time",
                          startDate: "",
                          endDate: "",
                          currentlyWorking: false,
                          description: "",
                        },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
                >
                  <Plus size={17} />
                  Add experience
                </button>
              </div>
            </section>

            <section
              id="education"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
            >
              <SectionHeading
                icon={<GraduationCap size={19} />}
                title="Education"
                description="Add your education and qualifications."
              />
              <div className="mt-6 space-y-4">
                {profile.education.map((item, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-semibold">Education {index + 1}</h3>
                      <button
                        type="button"
                        aria-label={`Remove education ${index + 1}`}
                        onClick={() =>
                          setProfile((current) => ({
                            ...current,
                            education: current.education.filter((_, i) => i !== index),
                          }))
                        }
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium">
                        Institution
                        <input required value={item.institution} onChange={(event) => updateEducation(index, "institution", event.target.value)} placeholder="School or university" className={inputClassName} />
                      </label>
                      <label className="text-sm font-medium">
                        Degree
                        <input required value={item.degree} onChange={(event) => updateEducation(index, "degree", event.target.value)} placeholder="e.g. Bachelor's degree" className={inputClassName} />
                      </label>
                      <label className="text-sm font-medium sm:col-span-2">
                        Field of study
                        <input value={item.fieldOfStudy} onChange={(event) => updateEducation(index, "fieldOfStudy", event.target.value)} placeholder="e.g. Computer Science" className={inputClassName} />
                      </label>
                      <label className="text-sm font-medium">
                        Start date
                        <input type="date" value={item.startDate} onChange={(event) => updateEducation(index, "startDate", event.target.value)} className={inputClassName} />
                      </label>
                      <label className="text-sm font-medium">
                        End date
                        <input type="date" value={item.endDate} onChange={(event) => updateEducation(index, "endDate", event.target.value)} className={inputClassName} />
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setProfile((current) => ({
                      ...current,
                      education: [
                        ...current.education,
                        { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
                >
                  <Plus size={17} />
                  Add education
                </button>
              </div>
            </section>

            <section
              id="links"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
            >
              <SectionHeading
                icon={<ExternalLink size={19} />}
                title="Online presence"
                description="Let employers explore your work and professional network."
              />
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold sm:col-span-2">
                  Portfolio website
                  <input type="url" value={profile.portfolioUrl} onChange={(event) => updateField("portfolioUrl", event.target.value)} placeholder="https://your-portfolio.com" className={inputClassName} />
                </label>
                <label className="text-sm font-semibold">
                  LinkedIn
                  <span className="relative block">
                    <Link2 size={17} className="absolute left-4 top-[22px] text-slate-400" />
                    <input type="url" value={profile.linkedInUrl} onChange={(event) => updateField("linkedInUrl", event.target.value)} placeholder="https://linkedin.com/in/you" className={`${inputClassName} pl-11`} />
                  </span>
                </label>
                <label className="text-sm font-semibold">
                  GitHub
                  <span className="relative block">
                    <Code2 size={17} className="absolute left-4 top-[22px] text-slate-400" />
                    <input type="url" value={profile.githubUrl} onChange={(event) => updateField("githubUrl", event.target.value)} placeholder="https://github.com/you" className={`${inputClassName} pl-11`} />
                  </span>
                </label>
              </div>
            </section>

            <div className="flex justify-end pb-8">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "Saving changes..." : "Save all changes"}
              </button>
            </div>
          </form>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">Profile strength</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    A complete profile can help you stand out.
                  </p>
                </div>
                <span className="text-xl font-bold text-blue-600">{completion}%</span>
              </div>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                role="progressbar"
                aria-label="Profile completeness"
                aria-valuenow={completion}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <ul className="mt-5 space-y-3">
                {completionItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={`#${item.section}`}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 dark:text-slate-300"
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                          item.complete
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "border border-slate-300 text-transparent dark:border-slate-600"
                        }`}
                      >
                        <Check size={12} />
                      </span>
                      {item.label}
                      {!item.complete && <ChevronRight className="ml-auto" size={15} />}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section
              id="resume"
              className="scroll-mt-24 rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                <Upload size={19} />
              </div>
              <h2 className="mt-4 font-bold">Keep your resume up to date</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {profile.resume?.fileName
                  ? `Current file: ${profile.resume.fileName}`
                  : "Add a resume so employers can review your experience."}
              </p>
              <Link
                href="/dashboard/resume"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
              >
                {profile.resume?.storageKey ? "Manage resume" : "Upload resume"}
                <ChevronRight size={16} />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        {icon}
      </span>
      <div>
        <h2 className="font-bold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}
