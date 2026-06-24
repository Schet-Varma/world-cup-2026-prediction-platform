import type { FakeBetSlip } from "@/lib/types";
import { TeamFlag } from "./TeamFlag";

const marketLabels: Record<string, string> = {
  h2h: "Match result",
  totals: "Goals total",
  btts: "Both teams score"
};

export function FakeBetSlipCard({ slip }: { slip: FakeBetSlip }) {
  const isMulti = slip.legs.length > 1;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel">
      <div className={`h-1.5 ${isMulti ? "bg-[linear-gradient(90deg,#ff6b5f,#d9f99d,#0f5f4a)]" : "bg-[linear-gradient(90deg,#0f5f4a,#d9f99d,#ff6b5f)]"}`} />
      <div className="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pitch">{slip.kind}</p>
          <h3 className="mt-1 text-lg font-black">{slip.id.replace("fake-", "").replaceAll("-", " ")}</h3>
          <p className="text-sm text-slate-500">{slip.status} · {slip.placed_at}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded bg-mint px-2 py-1 text-sm font-bold text-pitch">
            {slip.decimal_odds.toFixed(2)}x
          </span>
          {isMulti ? <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{slip.legs.length} legs</span> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Stake" value={`$${slip.stake.toFixed(2)}`} />
        <Stat label="Return" value={`$${slip.potential_return.toFixed(2)}`} />
        <Stat label={isMulti ? "Hit" : "Model"} value={`${(slip.model_probability * 100).toFixed(0)}%`} />
        <Stat label={isMulti ? "Combo EV" : "EV"} value={`${(slip.expected_value * 100).toFixed(0)}%`} />
      </div>

      <div className="mt-4 space-y-2">
        {slip.legs.map((leg) => (
          <div key={`${slip.id}-${leg.fixture_id}-${leg.selection}`} className="rounded bg-slate-50 p-3">
            <LegFixture label={leg.fixture_label} />
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">{leg.selection}</span>
              <span className="text-sm text-slate-500">{marketLabels[leg.market] ?? leg.market}</span>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-coral">
              model {(leg.model_probability * 100).toFixed(1)}% · market {(leg.market_probability * 100).toFixed(1)}% · edge {(leg.edge * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {slip.rationale.slice(0, 3).map((item) => (
          <li key={item} className="border-l-4 border-pitch pl-3">{item}</li>
        ))}
      </ul>
      </div>
    </article>
  );
}

function LegFixture({ label }: { label: string }) {
  const [homeName, awayName] = label.split(" vs ");
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
      <TeamFlag teamName={homeName} compact />
      <span className="rounded bg-white px-2 py-1 text-xs font-black text-slate-500">vs</span>
      <TeamFlag teamName={awayName} compact />
    </div>
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
