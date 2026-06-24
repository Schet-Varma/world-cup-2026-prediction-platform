import Link from "next/link";
import type { Fixture, Team } from "@/lib/types";
import { TeamFlag } from "./TeamFlag";

export function FixtureCard({ fixture, teams }: { fixture: Fixture; teams: Team[] }) {
  const home = teams.find((team) => team.id === fixture.home_team);
  const away = teams.find((team) => team.id === fixture.away_team);

  return (
    <Link href={`/match/${fixture.id}`} className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-pitch hover:shadow-panel">
      <div className="h-1.5 bg-[linear-gradient(90deg,#ff6b5f,#d9f99d,#0f5f4a)]" />
      <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>{fixture.round}</span>
        <span>{fixture.venue}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamFlag teamId={fixture.home_team} teamName={home?.name} label={home?.name ?? fixture.home_team} />
        <span className="rounded bg-ink px-2 py-1 text-xs font-black text-white shadow-sm transition group-hover:bg-pitch">vs</span>
        <TeamFlag teamId={fixture.away_team} teamName={away?.name} label={away?.name ?? fixture.away_team} align="right" />
      </div>
      </div>
    </Link>
  );
}
