import type { BettingRecommendation } from "@/lib/types";
import { TeamFlag } from "./TeamFlag";

const marketLabels: Record<string, string> = {
  h2h: "Match result",
  totals: "Goals total",
  btts: "Both teams score"
};

export function BettingCard({ pick }: { pick: BettingRecommendation }) {
  const [homeName, awayName] = pick.fixture_label.split(" vs ");

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel">
      <div className="h-1.5 bg-[linear-gradient(90deg,#0f5f4a,#d9f99d,#ff6b5f)]" />
      <div className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pitch">{marketLabels[pick.market] ?? pick.market}</p>
          <h3 className="mt-1 text-lg font-black">{pick.selection}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <TeamFlag teamName={homeName} compact />
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">vs</span>
            <TeamFlag teamName={awayName} compact />
          </div>
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
      </div>
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
