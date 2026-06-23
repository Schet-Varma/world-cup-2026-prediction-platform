import type { BettingRecommendation } from "@/lib/types";

const marketLabels: Record<string, string> = {
  h2h: "Match result",
  totals: "Goals total",
  btts: "Both teams score"
};

export function BettingCard({ pick }: { pick: BettingRecommendation }) {
  return (
    <article className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pitch">{marketLabels[pick.market] ?? pick.market}</p>
          <h3 className="mt-1 text-lg font-black">{pick.selection}</h3>
          <p className="text-sm text-slate-500">{pick.fixture_label}</p>
        </div>
        <span className="rounded bg-mint px-2 py-1 text-sm font-bold text-pitch">{(pick.edge * 100).toFixed(1)}% edge</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Stat label="Model" value={`${(pick.model_probability * 100).toFixed(0)}%`} />
        <Stat label="Market" value={`${(pick.market_probability * 100).toFixed(0)}%`} />
        <Stat label="Odds" value={pick.best_decimal_odds.toFixed(2)} />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-coral">{pick.risk_label}</p>
      <p className="mt-2 text-sm text-slate-600">{pick.rationale[0]}</p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-slate-50 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-black">{value}</p>
    </div>
  );
}
