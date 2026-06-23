import { FixtureCard } from "@/components/FixtureCard";
import { getFixtures, getTeams } from "@/lib/api";

export default async function BracketPage() {
  const [fixtures, teams] = await Promise.all([getFixtures(), getTeams()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Round of 32 Bracket</h1>
        <p className="mt-2 max-w-3xl text-slate-600">Scenario fixtures are used until the official knockout field is known. Each matchup links to scoreline and upset probability detail.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {fixtures.map((fixture) => (
          <FixtureCard key={fixture.id} fixture={fixture} teams={teams} />
        ))}
      </div>
    </div>
  );
}
