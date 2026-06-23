import Link from "next/link";
import type { MatchPrediction } from "@/lib/types";
import { ProbabilityBar } from "./ProbabilityBar";

export function PredictionTile({ prediction }: { prediction: MatchPrediction }) {
  return (
    <Link href={`/match/${prediction.fixture.id}`} className="block rounded border border-slate-200 bg-white p-4 shadow-sm hover:border-pitch">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-pitch">{prediction.fixture.round}</p>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
          confidence {(prediction.confidence_score * 100).toFixed(0)}%
        </span>
      </div>
      <h3 className="text-lg font-black">{prediction.home_team.name} vs {prediction.away_team.name}</h3>
      <p className="mt-1 text-sm text-slate-500">Most likely: {prediction.most_likely_score}</p>
      <div className="mt-4 space-y-3">
        <ProbabilityBar label={prediction.home_team.name} value={prediction.home_win_probability} />
        <ProbabilityBar label="Draw" value={prediction.draw_probability} tone="slate" />
        <ProbabilityBar label={prediction.away_team.name} value={prediction.away_win_probability} tone="red" />
      </div>
    </Link>
  );
}
