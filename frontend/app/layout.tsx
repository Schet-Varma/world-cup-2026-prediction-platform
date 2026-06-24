import type { Metadata } from "next";
import Link from "next/link";
import { Activity, BarChart3, CircleDollarSign, GitBranch, Radio, Trophy } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup 2026 Predictions",
  description: "Explainable knockout predictions for the 2026 World Cup"
};

const nav = [
  { href: "/", label: "Dashboard", icon: Trophy },
  { href: "/bracket", label: "Bracket", icon: GitBranch },
  { href: "/group-stage", label: "Groups", icon: BarChart3 },
  { href: "/bets", label: "Fake Bets", icon: CircleDollarSign },
  { href: "/methodology", label: "Methodology", icon: Activity }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-white shadow-lg backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-mint text-ink shadow-sm">
                <Trophy size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-mint">World Cup 2026</span>
                <span className="block truncate text-lg font-black">Prediction Lab</span>
              </span>
            </Link>
            <div className="hidden items-center gap-2 rounded bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-200 ring-1 ring-white/10 lg:flex">
              <Radio size={15} className="text-coral" />
              <span>Live model room</span>
              <span className="text-base">🇺🇸 🇲🇽 🇨🇦</span>
            </div>
            <nav className="flex items-center gap-1 overflow-x-auto">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-10 shrink-0 items-center gap-2 rounded px-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  <item.icon size={17} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-sm backdrop-blur">
            <span className="font-bold text-ink">World Cup 2026 Prediction Lab</span>
            <span className="mx-2 text-slate-300">/</span>
            Model probabilities, live context, and fake-money bankroll experiments for analysis only.
          </div>
        </footer>
      </body>
    </html>
  );
}
