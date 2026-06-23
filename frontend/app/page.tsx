import { Activity, ShieldAlert, Sparkles } from "lucide-react";
import { TeamCard } from "@/components/TeamCard";
import { getSimulation } from "@/lib/api";

export default async function HomePage() {
  const simulation = await getSimulation();
  const topTeams = simulation.teams.slice(0, 6);
  const darkHorses = simulation.teams.filter((team) => team.champion_probability >= 0.03).slice(3, 6);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded border border-slate-200 bg-white p-6 shadow-panel">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="text-coral" />
            <div>
              <h1 className="text-3xl font-black">Knockout Prediction Dashboard</h1>
              <p className="mt-1 text-slate-600">Explainable champion probabilities from {simulation.runs.toLocaleString()} simulations.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Top champion" value={topTeams[0]?.team_name ?? "TBD"} detail={`${((topTeams[0]?.champion_probability ?? 0) * 100).toFixed(1)}%`} />
            <Metric label="Dark horse pool" value={String(darkHorses.length)} detail="teams over 3%" />
            <Metric label="Model style" value="Hybrid" detail="Elo + Poisson" />
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-ink p-6 text-white shadow-panel">
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
    <div className="border-l-4 border-pitch bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="text-sm text-slate-600">{detail}</p>
    </div>
  );
}
