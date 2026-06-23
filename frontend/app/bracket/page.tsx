import { FixtureCard } from "@/components/FixtureCard";
import { PredictionTile } from "@/components/PredictionTile";
import { getFixtures, getGroupPredictions, getTeams } from "@/lib/api";

export default async function BracketPage() {
  const [fixtures, teams, groupPredictions] = await Promise.all([getFixtures(), getTeams(), getGroupPredictions()]);
  const knockoutFixtures = fixtures.filter((fixture) => fixture.stage !== "group");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Round of 32 Bracket</h1>
        <p className="mt-2 max-w-3xl text-slate-600">Scenario fixtures are used until the official knockout field is known. Each matchup links to scoreline and upset probability detail.</p>
      </div>
      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-pitch">Before knockouts lock</p>
          <h2 className="text-2xl font-black">Group Stage Test Block</h2>
          <p className="mt-1 text-sm text-slate-600">The model can evaluate remaining group matches and then roll those learnings into knockout projections.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {groupPredictions.slice(0, 2).map((prediction) => (
            <PredictionTile key={prediction.fixture.id} prediction={prediction} />
          ))}
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {knockoutFixtures.map((fixture) => (
          <FixtureCard key={fixture.id} fixture={fixture} teams={teams} />
        ))}
      </div>
    </div>
  );
}
