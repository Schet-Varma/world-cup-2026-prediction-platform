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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Methodology</h1>
        <p className="mt-2 max-w-3xl text-slate-600">The model favors transparency: every prediction can be traced back to team strength, form, scoring rates, and tournament-path simulation.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map(([title, body], index) => (
          <article key={title} className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded bg-pitch font-bold text-white">{index + 1}</span>
            <h2 className="mt-4 text-xl font-bold">{title}</h2>
            <p className="mt-2 text-slate-600">{body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
