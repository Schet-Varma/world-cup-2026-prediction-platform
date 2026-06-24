import { AlertTriangle, Brain, CalendarDays, ExternalLink, RotateCcw, Target } from "lucide-react";
import { BankrollTimeline } from "@/components/BankrollTimeline";
import { FakeBetSlipCard } from "@/components/FakeBetSlipCard";
import { getBankrollChallenge } from "@/lib/api";

export default async function BetsPage() {
  const challenge = await getBankrollChallenge();
  const watchlist = challenge.watchlist ?? [];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded border border-slate-200 bg-white p-6 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-wide text-pitch">{challenge.mode}</p>
          <h1 className="mt-2 text-3xl font-black">{challenge.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-600">{challenge.risk_warning}</p>
          <p className="mt-3 max-w-3xl border-l-4 border-coral bg-slate-50 p-3 text-sm text-slate-700">{challenge.target_assessment}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <Metric label="Start" value={`$${challenge.initial_bankroll.toFixed(0)}`} />
            <Metric label="Target" value={`$${challenge.target_bankroll.toFixed(0)}`} />
            <Metric label="Open risk" value={`$${challenge.open_risk.toFixed(0)}`} />
            <Metric label="Slate" value={`${challenge.slate_size} games`} />
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-ink p-6 text-white shadow-panel">
          <Target className="mb-4 text-mint" />
          <h2 className="text-2xl font-black">Live Bankroll Mark</h2>
          <p className="mt-2 text-sm text-slate-300">Expected-value mark is not settled cash. It updates from the remaining group-stage model and open fake slips.</p>
          <div className="mt-6 grid gap-3">
            <Line label="Available cash" value={`$${challenge.available_cash.toFixed(2)}`} />
            <Line label="Model EV bankroll" value={`$${challenge.current_mark_to_model.toFixed(2)}`} />
            <Line label="Chance to target" value={`${(challenge.probability_to_target * 100).toFixed(1)}%`} />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <RotateCcw className="text-pitch" size={22} />
          <h2 className="text-2xl font-black">Reset Schedule</h2>
        </div>
        <p className="mb-4 border-l-4 border-coral bg-white p-3 text-sm text-slate-700 shadow-sm">{challenge.reset_policy}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {challenge.phase_plan.map((phase) => (
            <article key={phase.title} className="rounded border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-pitch">{phase.status}</p>
                  <h3 className="mt-1 text-xl font-black">{phase.title}</h3>
                </div>
                <CalendarDays className="shrink-0 text-coral" />
              </div>
              <p className="mt-3 text-sm text-slate-600">{phase.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <PhaseStat label="Start" value={`$${phase.starting_bankroll.toFixed(0)}`} />
                <PhaseStat label="Target" value={`$${phase.target_bankroll.toFixed(0)}`} />
                <PhaseStat label="Games" value={`${phase.fixture_count}`} />
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p><span className="font-bold text-ink">Window:</span> {phase.match_window}</p>
                <p><span className="font-bold text-ink">Trigger:</span> {phase.reset_trigger}</p>
                <p><span className="font-bold text-ink">Risk:</span> {phase.exposure_policy}</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {phase.checkpoints.map((checkpoint) => (
                  <li key={checkpoint} className="border-l-4 border-pitch pl-3">{checkpoint}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Brain className="text-pitch" size={22} />
          <h2 className="text-2xl font-black">Remaining Group Plan</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {challenge.plan.map((step, index) => (
            <article key={step.title} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-pitch text-sm font-black text-white">{index + 1}</span>
              <h3 className="mt-3 text-lg font-black">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-black">Money Tracker</h2>
          <p className="mt-1 text-sm text-slate-600">Track group-stage cash, open risk, model EV mark, and the stretch target separately.</p>
        </div>
        <BankrollTimeline points={challenge.bankroll_timeline} />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-black">Rejected Group Edges</h2>
          <p className="mt-1 text-sm text-slate-600">Tempting group-stage bets that were not placed because the hit rate, odds band, or variance profile failed Safe Growth Mode.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {watchlist.map((slip) => (
            <FakeBetSlipCard key={slip.id} slip={slip} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Fake Group Bet Slips</h2>
            <p className="mt-1 text-sm text-slate-600">These are simulated placements on remaining group-stage games only. Nothing is sent to a sportsbook.</p>
          </div>
          <span className="rounded bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-coral">fake money</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {challenge.slips.map((slip) => (
            <FakeBetSlipCard key={slip.id} slip={slip} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">News Context</h2>
          <div className="mt-4 grid gap-3">
            {challenge.news_context.map((item) => (
              <a
                key={item.id}
                href={item.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="block border-l-4 border-pitch bg-slate-50 p-3 hover:bg-slate-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                  </div>
                  <ExternalLink size={16} className="mt-1 shrink-0 text-slate-400" />
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-coral">{item.source} · {item.impact}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">Research Stack</h2>
          <div className="mt-4 space-y-3">
            {challenge.research_sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block rounded border border-slate-200 p-3 hover:border-pitch">
                <p className="text-xs font-semibold uppercase tracking-wide text-pitch">{source.category}</p>
                <h3 className="mt-1 font-bold">{source.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{source.summary}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded border border-coral/30 bg-white p-5 shadow-sm">
        <div className="flex gap-3">
          <AlertTriangle className="shrink-0 text-coral" />
          <p className="text-sm text-slate-700">
            This page is a simulation lab. It is designed to expose model thinking, not to guarantee profit. The no-chasing rule is part of the fake portfolio because real betting can lose money quickly.
          </p>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-4 border-pitch bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function PhaseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-white/10 pt-3">
      <span className="text-slate-300">{label}</span>
      <span className="font-bold text-mint">{value}</span>
    </div>
  );
}
