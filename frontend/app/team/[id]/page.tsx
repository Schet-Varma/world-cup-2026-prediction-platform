import { getSimulation, getTeams } from "@/lib/api";
import { ProbabilityBar } from "@/components/ProbabilityBar";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [teams, simulation] = await Promise.all([getTeams(), getSimulation()]);
  const team = teams.find((item) => item.id === id) ?? teams[0];
  const path = simulation.teams.find((item) => item.team_id === team.id);

  return (
    <div className="space-y-6">
      <section className="rounded border border-slate-200 bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-wide text-pitch">{team.confederation}</p>
        <h1 className="mt-2 text-3xl font-black">{team.name}</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat label="Elo" value={String(team.elo)} />
          <Stat label="FIFA rank" value={String(team.fifa_rank)} />
          <Stat label="Attack" value={team.attack.toFixed(2)} />
          <Stat label="Defense" value={team.defense.toFixed(2)} />
        </div>
      </section>
      {path && (
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
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
    <div className="border-l-4 border-pitch bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
