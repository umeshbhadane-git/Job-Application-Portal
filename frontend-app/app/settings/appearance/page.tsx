"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  Moon,
  Palette,
  Settings2,
  Sun,
} from "lucide-react";

import ThemeSelector from "@/components/layout/ThemeSelector";

export default function AppearancePage() {
  return (
    <main className="app-theme min-h-screen bg-[#f7f7f3] text-[#20251f]">
      <header className="border-b border-[#e9e8e1] bg-[#fbfbf8]">
        <nav className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#36472e] text-[#d3edab]">
              <BriefcaseBusiness size={19} />
            </span>
            <span className="text-sm font-bold tracking-tight">
              Career<span className="text-[#718455]">Bridge</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e7e8e1] px-3.5 py-2.5 text-xs font-semibold text-[#65695f] transition hover:bg-white"
          >
            <ArrowLeft size={15} />
            Back to workspace
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="flex items-center gap-2 text-xs font-medium text-[#85887f]">
          <Settings2 size={14} />
          <span>Settings</span>
          <span className="text-[#c5c7bf]">/</span>
          <span className="text-[#48533d]">Appearance</span>
        </div>

        <div className="mt-4 max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#82916f]">
            Make it yours
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-[40px]">
            Appearance
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#777a71]">
            Choose the look that feels right. Your preference will follow you
            across CareerBridge pages on this device.
          </p>
        </div>

        <section className="mt-8 max-w-3xl rounded-2xl border border-[#e9e8e1] bg-white p-5 shadow-[0_8px_30px_rgba(32,37,31,0.025)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4e4] text-[#58763d]">
              <Palette size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">Theme</h2>
              <p className="mt-1 text-xs leading-5 text-[#85887f]">
                Switch between a bright workspace and a softer, low-light
                experience.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ThemePreview
                  title="Light"
                  description="Bright, clear, and easy to scan."
                  icon={<Sun size={16} />}
                  isDark={false}
                />
                <ThemePreview
                  title="Dark"
                  description="A softer experience for low light."
                  icon={<Moon size={16} />}
                  isDark
                />
              </div>

              <div className="mt-5 max-w-sm">
                <p className="mb-2 text-xs font-semibold text-[#54594f]">
                  Change theme
                </p>
                <ThemeSelector />
              </div>
              <p className="mt-3 text-[11px] text-[#92958d]">
                Theme changes apply immediately and are saved automatically.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 flex max-w-3xl items-start gap-3 rounded-2xl border border-[#e9e8e1] bg-[#efeee6] p-5">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#62764a]">
            <Check size={15} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Consistent across your workspace</h2>
            <p className="mt-1 text-xs leading-5 text-[#777a71]">
              Your theme is used on the dashboard, recruiter tools, profile,
              resume, and public pages.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ThemePreview({
  title,
  description,
  icon,
  isDark,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isDark
          ? "border-[#35432f] bg-[#20291f] text-white"
          : "border-[#e7e8e1] bg-[#f7f7f3] text-[#20251f]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex size-8 items-center justify-center rounded-lg ${
            isDark ? "bg-[#c4e58a] text-[#26331f]" : "bg-white text-[#58763d]"
          }`}
        >
          {icon}
        </span>
        <span
          className={`size-2 rounded-full ${
            isDark ? "bg-[#c4e58a]" : "bg-[#839967]"
          }`}
        />
      </div>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p
        className={`mt-1 text-[11px] ${
          isDark ? "text-[#c2c8bc]" : "text-[#85887f]"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
