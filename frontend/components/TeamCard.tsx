import type { SimulationTeam } from "@/lib/types";
import { ProbabilityBar } from "./ProbabilityBar";

export function TeamCard({ team }: { team: SimulationTeam }) {
  return (
    <article className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{team.team_name}</h3>
          <p className="text-sm text-slate-500">Champion projection</p>
        </div>
        <span className="rounded bg-mint px-2 py-1 text-sm font-bold text-pitch">
          {(team.champion_probability * 100).toFixed(1)}%
        </span>
      </div>
      <div className="space-y-3">
        <ProbabilityBar label="Final" value={team.final_probability} />
        <ProbabilityBar label="Semi-final" value={team.semi_final_probability} tone="slate" />
        <ProbabilityBar label="Advance R32" value={team.round_advancement_probability} tone="slate" />
      </div>
    </article>
  );
}
