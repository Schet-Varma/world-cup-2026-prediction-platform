import Link from "next/link";
import type { Fixture, Team } from "@/lib/types";

export function FixtureCard({ fixture, teams }: { fixture: Fixture; teams: Team[] }) {
  const home = teams.find((team) => team.id === fixture.home_team);
  const away = teams.find((team) => team.id === fixture.away_team);

  return (
    <Link href={`/match/${fixture.id}`} className="block rounded border border-slate-200 bg-white p-4 shadow-sm hover:border-pitch">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>{fixture.round}</span>
        <span>{fixture.venue}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className="font-bold">{home?.name ?? fixture.home_team}</span>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">vs</span>
        <span className="text-right font-bold">{away?.name ?? fixture.away_team}</span>
      </div>
    </Link>
  );
}
