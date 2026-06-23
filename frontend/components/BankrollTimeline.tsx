import type { BankrollPoint } from "@/lib/types";

export function BankrollTimeline({ points }: { points: BankrollPoint[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {points.map((point) => (
        <article key={point.label} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-pitch">{point.label}</p>
          <p className="mt-2 text-3xl font-black">${point.bankroll.toFixed(2)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <span className="rounded bg-slate-50 p-2">Cash ${point.available_cash.toFixed(2)}</span>
            <span className="rounded bg-slate-50 p-2">Risk ${point.open_risk.toFixed(2)}</span>
          </div>
          <p className="mt-3 text-sm text-slate-600">{point.note}</p>
        </article>
      ))}
    </div>
  );
}
