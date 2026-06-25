"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, RefreshCw, ShieldAlert, Target, TrendingDown, Trophy } from "lucide-react";
import type { BankrollChallenge, FakeBetSlip } from "@/lib/types";
import { TeamFlag } from "./TeamFlag";

export function LiveBankrollTracker({ initialChallenge }: { initialChallenge: BankrollChallenge }) {
  const [challenge, setChallenge] = useState(initialChallenge);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/bankroll/challenge", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not refresh bankroll");
      }
      setChallenge((await response.json()) as BankrollChallenge);
      setLastChecked(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh bankroll");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLastChecked(new Date());
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const pendingSlips = useMemo(
    () => challenge.slips.filter((slip) => slip.status === "pending-live"),
    [challenge.slips]
  );
  const settledSlips = useMemo(
    () => challenge.slips.filter((slip) => slip.status?.startsWith("settled")),
    [challenge.slips]
  );

  const settledBankroll = challenge.settled_bankroll ?? challenge.available_cash + challenge.open_risk;
  const settledProfitLoss = challenge.settled_profit_loss ?? settledBankroll - challenge.initial_bankroll;
  const wonSlips = challenge.won_slips ?? settledSlips.filter((slip) => slip.status === "settled-won").length;
  const lostSlips = challenge.lost_slips ?? settledSlips.filter((slip) => slip.status === "settled-lost").length;
  const pendingCount = challenge.pending_slips ?? pendingSlips.length;
  const nextMilestone = challenge.next_milestone ?? challenge.target_bankroll;
  const nextMilestoneProbability = challenge.next_milestone_probability ?? challenge.probability_to_target;
  const isDown = settledProfitLoss < 0;

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]" aria-live="polite">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
        <div className={`h-1.5 ${isDown ? "bg-[linear-gradient(90deg,#ff6b5f,#facc15,#0f5f4a)]" : "bg-[linear-gradient(90deg,#0f5f4a,#d9f99d,#ff6b5f)]"}`} />
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-pitch">
                <Activity size={16} /> Live settlement tracker
              </p>
              <h2 className="mt-2 text-3xl font-black">Cash is ${settledBankroll.toFixed(2)}</h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                {challenge.strategy_shift ?? "The bankroll refreshes from settled results and pending fake slips."}
              </p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-black text-white transition hover:bg-pitch disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LiveMetric icon={<TrendingDown size={18} />} label="Settled P/L" value={`${settledProfitLoss < 0 ? "-" : "+"}$${Math.abs(settledProfitLoss).toFixed(2)}`} tone={isDown ? "bad" : "good"} />
            <LiveMetric icon={<ShieldAlert size={18} />} label="Open risk" value={`$${challenge.open_risk.toFixed(2)}`} />
            <LiveMetric icon={<Trophy size={18} />} label="Record" value={`${wonSlips}-${lostSlips}-${pendingCount}`} />
            <LiveMetric icon={<Target size={18} />} label="Next step" value={`$${nextMilestone.toFixed(2)}`} helper={`${(nextMilestoneProbability * 100).toFixed(1)}% model hit`} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="rounded bg-slate-100 px-2 py-1">polls every 30s</span>
            <span className="rounded bg-slate-100 px-2 py-1">last check {lastChecked ? lastChecked.toLocaleTimeString() : "starting"}</span>
            {challenge.last_settlement ? <span className="rounded bg-coral/10 px-2 py-1 text-coral">{challenge.last_settlement}</span> : null}
            {error ? <span className="rounded bg-coral/10 px-2 py-1 text-coral">{error}</span> : null}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-ink p-6 text-white shadow-panel">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#ff6b5f,#d9f99d,#0f5f4a)]" aria-hidden="true" />
        <h2 className="text-2xl font-black">Live Slip Ledger</h2>
        <p className="mt-2 text-sm text-slate-300">
          Settled slips hit cash immediately. Pending slips stay tiny until the model repairs the record.
        </p>
        <div className="mt-5 space-y-3">
          {[...pendingSlips, ...settledSlips].slice(0, 8).map((slip) => (
            <SlipRow key={slip.id} slip={slip} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveMetric({
  icon,
  label,
  value,
  helper,
  tone = "neutral"
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
  tone?: "neutral" | "good" | "bad";
}) {
  const toneClass = tone === "bad" ? "text-coral" : tone === "good" ? "text-pitch" : "text-ink";

  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <p className="flex items-center gap-2 text-sm text-slate-500">{icon}{label}</p>
      <p className={`mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
      {helper ? <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{helper}</p> : null}
    </div>
  );
}

function SlipRow({ slip }: { slip: FakeBetSlip }) {
  const firstLeg = slip.legs[0];
  const [homeName, awayName] = firstLeg?.fixture_label.split(" vs ") ?? ["Fixture", "TBD"];
  const status = slip.status ?? "pending-live";
  const statusClass =
    status === "settled-won"
      ? "bg-mint text-pitch"
      : status === "settled-lost"
        ? "bg-coral/15 text-coral"
        : "bg-white/10 text-mint";
  const profitLoss = slip.profit_loss ?? 0;

  return (
    <article className="rounded border border-white/10 bg-white/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TeamFlag teamName={homeName} compact />
            <span className="text-xs font-black uppercase text-slate-400">vs</span>
            <TeamFlag teamName={awayName} compact />
          </div>
          <p className="mt-2 text-sm font-bold text-white">{slip.kind} · ${slip.stake.toFixed(2)} at {slip.decimal_odds.toFixed(2)}x</p>
          <p className="mt-1 text-xs text-slate-300">{slip.result_summary || "Awaiting final score"}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className={`rounded px-2 py-1 text-xs font-black uppercase ${statusClass}`}>{status.replace("-", " ")}</span>
          {status.startsWith("settled") ? (
            <p className={`mt-2 text-sm font-black ${profitLoss < 0 ? "text-coral" : "text-mint"}`}>
              {profitLoss < 0 ? "-" : "+"}${Math.abs(profitLoss).toFixed(2)}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
