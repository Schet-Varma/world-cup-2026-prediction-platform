import { BettingCard } from "@/components/BettingCard";
import { LiveIntelPanel } from "@/components/LiveIntelPanel";
import { PredictionTile } from "@/components/PredictionTile";
import { WorldCupHero } from "@/components/WorldCupHero";
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
      <WorldCupHero
        eyebrow="Live model test block"
        title="Remaining group-stage games before the bracket locks."
        description="These fixtures let the model learn from results, odds movement, and news before the Round of 32 bracket becomes official."
        compact
        stats={[
          { label: "Predictions", value: `${predictions.length}`, detail: "active group fixtures" },
          { label: "Value candidates", value: `${picks.length}`, detail: "verify live odds" },
          { label: "Mode", value: status.fallback_mode ? "Seed data" : "Live APIs", detail: status.news_provider }
        ]}
      />

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
