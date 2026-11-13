
import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import ThemeInitializer from "@/components/layout/ThemeInitializer";
import WorkspaceFrame from "@/components/layout/WorkspaceFrame";

export const metadata: Metadata = {
  title: "CareerBridge | Find Your Next Opportunity",
  description:
    "Discover career opportunities, explore companies, and track your job applications with CareerBridge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeInitializer />
        <Suspense fallback={children}>
          <WorkspaceFrame>{children}</WorkspaceFrame>
        </Suspense>
      </body>
    </html>
  );
}
