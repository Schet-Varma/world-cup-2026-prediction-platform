import type { SimulationTeam } from "@/lib/types";
import { ProbabilityBar } from "./ProbabilityBar";
import { TeamFlag } from "./TeamFlag";

export function TeamCard({ team }: { team: SimulationTeam }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel">
      <div className="h-2 bg-[linear-gradient(90deg,#0f5f4a,#d9f99d,#ff6b5f)]" />
      <div className="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <TeamFlag teamId={team.team_id} teamName={team.team_name} />
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
      </div>
    </article>
  );
}
