import { Gauge, Goal, ShieldQuestion } from "lucide-react";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { getPrediction } from "@/lib/api";
import type { ReactNode } from "react";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prediction = await getPrediction(id);

  return (
    <div className="space-y-6">
      <section className="rounded border border-slate-200 bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-wide text-pitch">{prediction.fixture.round}</p>
        <h1 className="mt-2 text-3xl font-black">
          {prediction.home_team.name} vs {prediction.away_team.name}
        </h1>
        <p className="mt-2 text-slate-600">{prediction.fixture.venue}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric icon={<Goal />} label="Most likely score" value={prediction.most_likely_score} />
          <Metric icon={<Gauge />} label="Expected goals" value={`${prediction.expected_home_goals} - ${prediction.expected_away_goals}`} />
          <Metric icon={<ShieldQuestion />} label="Upset chance" value={`${(prediction.upset_probability * 100).toFixed(1)}%`} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Win Probabilities</h2>
          <div className="space-y-4">
            <ProbabilityBar label={prediction.home_team.name} value={prediction.home_win_probability} />
            <ProbabilityBar label="Draw after 90" value={prediction.draw_probability} tone="slate" />
            <ProbabilityBar label={prediction.away_team.name} value={prediction.away_win_probability} tone="red" />
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Top Scorelines</h2>
          <div className="grid gap-2">
            {prediction.top_scorelines.map((scoreline) => (
              <div key={`${scoreline.home_goals}-${scoreline.away_goals}`} className="grid grid-cols-[80px_1fr_64px] items-center gap-3">
                <span className="font-bold">{scoreline.home_goals}-{scoreline.away_goals}</span>
                <div className="h-2 rounded bg-slate-200">
                  <div className="h-2 rounded bg-pitch" style={{ width: `${scoreline.probability * 100 * 5}%` }} />
                </div>
                <span className="text-right text-sm tabular-nums">{(scoreline.probability * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-xl font-bold">Explanation</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {prediction.explanation.map((item) => (
            <p key={item} className="border-l-4 border-pitch bg-slate-50 p-3 text-sm text-slate-700">{item}</p>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 text-pitch">{icon}</div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
