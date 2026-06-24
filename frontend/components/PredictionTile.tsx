import Link from "next/link";
import type { MatchPrediction } from "@/lib/types";
import { ProbabilityBar } from "./ProbabilityBar";
import { TeamFlag } from "./TeamFlag";

export function PredictionTile({ prediction }: { prediction: MatchPrediction }) {
  return (
    <Link href={`/match/${prediction.fixture.id}`} className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-pitch hover:shadow-panel">
      <div className="h-1.5 bg-[linear-gradient(90deg,#0f5f4a,#d9f99d,#ff6b5f)]" />
      <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-pitch">{prediction.fixture.round}</p>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 group-hover:bg-mint group-hover:text-pitch">
          confidence {(prediction.confidence_score * 100).toFixed(0)}%
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamFlag teamId={prediction.home_team.id} teamName={prediction.home_team.name} label={prediction.home_team.name} />
        <span className="rounded bg-ink px-2 py-1 text-xs font-black text-white">vs</span>
        <TeamFlag teamId={prediction.away_team.id} teamName={prediction.away_team.name} label={prediction.away_team.name} align="right" />
      </div>
      <p className="mt-3 rounded bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">Most likely: {prediction.most_likely_score}</p>
      <div className="mt-4 space-y-3">
        <ProbabilityBar label={prediction.home_team.name} value={prediction.home_win_probability} />
        <ProbabilityBar label="Draw" value={prediction.draw_probability} tone="slate" />
        <ProbabilityBar label={prediction.away_team.name} value={prediction.away_win_probability} tone="red" />
      </div>
      </div>
    </Link>
  );
}
