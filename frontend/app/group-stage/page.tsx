import { BettingCard } from "@/components/BettingCard";
import { LiveIntelPanel } from "@/components/LiveIntelPanel";
import { PredictionTile } from "@/components/PredictionTile";
import { getBettingRecommendations, getGroupPredictions, getLiveStatus, getNews } from "@/lib/api";

export default async function GroupStagePage() {
  const [predictions, picks, status, news] = await Promise.all([
    getGroupPredictions(),
    getBettingRecommendations("group"),
    getLiveStatus(),
    getNews()
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-pitch">Live model test block</p>
        <h1 className="mt-2 text-3xl font-black">Remaining Group Stage Games</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          These fixtures let the model learn from results, odds movement, and news before the Round of 32 bracket becomes official.
        </p>
      </div>

      <LiveIntelPanel status={status} news={news} />

      <section>
        <h2 className="mb-4 text-2xl font-black">Predictions</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {predictions.map((prediction) => (
            <PredictionTile key={prediction.fixture.id} prediction={prediction} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Group-Stage Value Candidates</h2>
          <span className="rounded bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-coral">verify live odds</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {picks.map((pick) => (
            <BettingCard key={`${pick.fixture_id}-${pick.market}-${pick.selection}`} pick={pick} />
          ))}
        </div>
      </section>
    </div>
  );
}
