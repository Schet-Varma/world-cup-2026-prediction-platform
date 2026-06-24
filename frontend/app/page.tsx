import { Activity, ArrowRight, CircleDollarSign, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { BettingCard } from "@/components/BettingCard";
import { LiveIntelPanel } from "@/components/LiveIntelPanel";
import { PredictionTile } from "@/components/PredictionTile";
import { TeamCard } from "@/components/TeamCard";
import { WorldCupHero } from "@/components/WorldCupHero";
import { getBettingRecommendations, getGroupPredictions, getLiveStatus, getNews, getSimulation } from "@/lib/api";

export default async function HomePage() {
  const [simulation, picks, groupPredictions, liveStatus, news] = await Promise.all([
    getSimulation(),
    getBettingRecommendations(),
    getGroupPredictions(),
    getLiveStatus(),
    getNews()
  ]);
  const topTeams = simulation.teams.slice(0, 6);
  const darkHorses = simulation.teams.filter((team) => team.champion_probability >= 0.03).slice(3, 6);

  return (
    <div className="space-y-8">
      <WorldCupHero
        eyebrow="Tournament intelligence room"
        title="World Cup 2026 predictions with odds, news, flags, and fake bankroll discipline."
        description={`Explainable champion probabilities from ${simulation.runs.toLocaleString()} simulations, group-stage practice picks, and a fake-money betting lab that shows its working.`}
        actions={(
          <>
            <Link href="/bets" className="inline-flex h-11 items-center gap-2 rounded bg-mint px-4 text-sm font-black text-ink shadow-sm transition hover:bg-white">
              Open Fake Bets <ArrowRight size={17} />
            </Link>
            <Link href="/group-stage" className="inline-flex h-11 items-center gap-2 rounded bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/20 transition hover:bg-white/20">
              Group Predictions
            </Link>
          </>
        )}
        stats={[
          { label: "Top champion", value: topTeams[0]?.team_name ?? "TBD", detail: `${((topTeams[0]?.champion_probability ?? 0) * 100).toFixed(1)}% title probability` },
          { label: "Dark horses", value: String(darkHorses.length), detail: "teams over 3%" },
          { label: "Model", value: "Elo + Poisson", detail: "with news and odds context" }
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="text-coral" />
            <div>
              <h2 className="text-2xl font-black">Knockout Prediction Dashboard</h2>
              <p className="mt-1 text-slate-600">The model tracks contenders, value signals, and group-stage volatility before the bracket locks.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Top champion" value={topTeams[0]?.team_name ?? "TBD"} detail={`${((topTeams[0]?.champion_probability ?? 0) * 100).toFixed(1)}%`} />
            <Metric label="Dark horse pool" value={String(darkHorses.length)} detail="teams over 3%" />
            <Metric label="Model style" value="Hybrid" detail="Elo + Poisson" />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-ink p-6 text-white shadow-panel">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#ff6b5f,#d9f99d,#0f5f4a)]" aria-hidden="true" />
          <Activity className="mb-4 text-mint" />
          <h2 className="text-xl font-bold">Latest Simulation</h2>
          <p className="mt-2 text-sm text-slate-300">Monte Carlo paths resolve knockout draws with a strength-weighted penalty assumption.</p>
          <div className="mt-6 space-y-3">
            {topTeams.slice(0, 3).map((team) => (
              <div key={team.team_id} className="flex items-center justify-between border-t border-white/10 pt-3">
                <span>{team.team_name}</span>
                <span className="font-bold text-mint">{(team.champion_probability * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-[linear-gradient(90deg,#0f5f4a,#d9f99d,#ff6b5f)]" />
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-pitch">Fake bankroll lab</p>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-black"><CircleDollarSign className="text-coral" /> $100 bankroll lab with safe singles and capped multis</h2>
            <p className="mt-1 text-sm text-slate-600">Fake slips show risk, EV, reasoning, linked news context, and a Round of 32 reset plan.</p>
          </div>
          <Link href="/bets" className="inline-flex h-11 items-center justify-center rounded bg-pitch px-4 text-sm font-bold text-white hover:bg-emerald-800">
            Open Fake Bets
          </Link>
        </div>
      </section>

      <LiveIntelPanel status={liveStatus} news={news} />

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Top Value Watchlist</h2>
            <p className="mt-1 text-sm text-slate-600">Model edge candidates compare projected probability to seed or live bookmaker implied probability.</p>
          </div>
          <span className="rounded bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-coral">analytics only</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {picks.slice(0, 6).map((pick) => (
            <BettingCard key={`${pick.fixture_id}-${pick.market}-${pick.selection}`} pick={pick} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-black">Group Stage Prediction Lab</h2>
          <p className="mt-1 text-sm text-slate-600">Use remaining group-stage matches as a live testing block before final knockout fixtures are locked.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {groupPredictions.slice(0, 4).map((prediction) => (
            <PredictionTile key={prediction.fixture.id} prediction={prediction} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert size={20} className="text-pitch" />
          <h2 className="text-2xl font-black">Top Contenders</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topTeams.map((team) => (
            <TeamCard key={team.team_id} team={team} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="text-sm text-slate-600">{detail}</p>
    </div>
  );
}
