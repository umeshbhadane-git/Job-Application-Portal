
import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
