import { FixtureCard } from "@/components/FixtureCard";
import { PredictionTile } from "@/components/PredictionTile";
import { WorldCupHero } from "@/components/WorldCupHero";
import { getFixtures, getGroupPredictions, getTeams } from "@/lib/api";

export default async function BracketPage() {
  const [fixtures, teams, groupPredictions] = await Promise.all([getFixtures(), getTeams(), getGroupPredictions()]);
  const knockoutFixtures = fixtures.filter((fixture) => fixture.stage !== "group");

  return (
    <div className="space-y-8">
      <WorldCupHero
        eyebrow="Knockout path simulator"
        title="Round of 32 bracket scenarios with flags, fixtures, and scoreline detail."
        description="Scenario fixtures are used until the official knockout field is known. Each matchup links to scoreline and upset probability detail."
        compact
        stats={[
          { label: "Knockout fixtures", value: `${knockoutFixtures.length}`, detail: "scenario slate" },
          { label: "Teams loaded", value: `${teams.length}`, detail: "seed ratings" },
          { label: "Group tests", value: `${groupPredictions.length}`, detail: "before reset" }
        ]}
      />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-[linear-gradient(90deg,#0f5f4a,#d9f99d,#ff6b5f)]" />
        <div className="p-5">
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
