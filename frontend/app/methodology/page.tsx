import { WorldCupHero } from "@/components/WorldCupHero";

const steps = [
  ["Dynamic Elo", "Ratings update from historical matches with competition weights and exponential recency decay."],
  ["Expected goals", "Attack, defense, Elo difference, and recent form create team-level xG estimates."],
  ["Poisson matrix", "The model evaluates normalized 0-0 through 6-6 scoreline probabilities."],
  ["Simulation", "Monte Carlo tournament paths aggregate champion and round advancement probabilities."],
  ["Odds edge", "Model probabilities are compared with bookmaker implied probabilities to surface value candidates."],
  ["Live intel", "Results, odds, and news providers refresh cached inputs, while seed fallbacks keep the app usable."]
];

export default function MethodologyPage() {
  return (
    <div className="space-y-8">
      <WorldCupHero
        eyebrow="Model room"
        title="Transparent football forecasting, from Elo to odds edge."
        description="Every prediction can be traced back to team strength, form, scoring rates, match simulation, market comparison, and live context."
        compact
        stats={[
          { label: "Core", value: "Elo", detail: "strength baseline" },
          { label: "Scoring", value: "Poisson", detail: "scoreline matrix" },
          { label: "Output", value: "EV", detail: "market comparison" }
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map(([title, body], index) => (
          <article key={title} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 bg-[linear-gradient(90deg,#0f5f4a,#d9f99d,#ff6b5f)]" />
            <div className="p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded bg-ink font-bold text-mint">{index + 1}</span>
            <h2 className="mt-4 text-xl font-bold">{title}</h2>
            <p className="mt-2 text-slate-600">{body}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
