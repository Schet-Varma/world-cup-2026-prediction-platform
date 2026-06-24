import { getSimulation, getTeams } from "@/lib/api";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { TeamFlag } from "@/components/TeamFlag";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [teams, simulation] = await Promise.all([getTeams(), getSimulation()]);
  const team = teams.find((item) => item.id === id) ?? teams[0];
  const path = simulation.teams.find((item) => item.team_id === team.id);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
        <div className="h-1.5 bg-[linear-gradient(90deg,#0f5f4a,#d9f99d,#ff6b5f)]" />
        <div className="p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-pitch">{team.confederation}</p>
        <h1 className="mt-3 text-3xl font-black">
          <TeamFlag teamId={team.id} teamName={team.name} label={team.name} />
        </h1>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat label="Elo" value={String(team.elo)} />
          <Stat label="FIFA rank" value={String(team.fifa_rank)} />
          <Stat label="Attack" value={team.attack.toFixed(2)} />
          <Stat label="Defense" value={team.defense.toFixed(2)} />
        </div>
        </div>
      </section>
      {path && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Tournament Path</h2>
          <div className="space-y-4">
            <ProbabilityBar label="Champion" value={path.champion_probability} />
            <ProbabilityBar label="Final" value={path.final_probability} tone="slate" />
            <ProbabilityBar label="Semi-final" value={path.semi_final_probability} tone="slate" />
            <ProbabilityBar label="Quarter-final" value={path.quarter_final_probability} tone="slate" />
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
