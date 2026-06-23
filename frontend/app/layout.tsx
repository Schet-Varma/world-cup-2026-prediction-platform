import type { Metadata } from "next";
import Link from "next/link";
import { Activity, GitBranch, Trophy } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup 2026 Predictions",
  description: "Explainable knockout predictions for the 2026 World Cup"
};

const nav = [
  { href: "/", label: "Dashboard", icon: Trophy },
  { href: "/bracket", label: "Bracket", icon: GitBranch },
  { href: "/methodology", label: "Methodology", icon: Activity }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded bg-pitch text-white">
                <Trophy size={20} />
              </span>
              <span>
                <span className="block text-sm font-semibold uppercase tracking-wide text-pitch">World Cup 2026</span>
                <span className="block text-lg font-bold">Prediction Lab</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-10 items-center gap-2 rounded px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <item.icon size={17} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
