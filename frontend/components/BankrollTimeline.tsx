import type { BankrollPoint } from "@/lib/types";

export function BankrollTimeline({ points }: { points: BankrollPoint[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {points.map((point) => (
        <article key={point.label} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-[linear-gradient(90deg,#0f5f4a,#d9f99d,#ff6b5f)]" />
          <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-pitch">{point.label}</p>
          <p className="mt-2 text-3xl font-black">${point.bankroll.toFixed(2)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <span className="rounded bg-slate-50 p-2 font-semibold text-slate-700">Cash ${point.available_cash.toFixed(2)}</span>
            <span className="rounded bg-slate-50 p-2 font-semibold text-slate-700">Risk ${point.open_risk.toFixed(2)}</span>
          </div>
          <p className="mt-3 text-sm text-slate-600">{point.note}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
