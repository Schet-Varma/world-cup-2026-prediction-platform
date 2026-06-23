import type { LiveDataStatus, NewsItem } from "@/lib/types";

export function LiveIntelPanel({ status, news }: { status: LiveDataStatus; news: NewsItem[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded border border-slate-200 bg-ink p-5 text-white shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-wide text-mint">Live tracking</p>
        <h2 className="mt-2 text-2xl font-black">Provider Status</h2>
        <div className="mt-5 grid gap-3 text-sm">
          <Line label="Results" value={status.results_provider} />
          <Line label="Odds" value={status.odds_provider} />
          <Line label="News" value={status.news_provider} />
          <Line label="Mode" value={status.fallback_mode ? "Fallback seed mode" : "Live API mode"} />
        </div>
        <p className="mt-4 text-sm text-slate-300">{status.notes[0]}</p>
      </div>
      <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-pitch">News signals</p>
        <h2 className="mt-2 text-2xl font-black">Tracked Context</h2>
        <div className="mt-4 grid gap-3">
          {news.slice(0, 4).map((item) => (
            <article key={item.id} className="border-l-4 border-pitch bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold">{item.title}</h3>
                <span className="rounded bg-white px-2 py-1 text-xs font-bold text-slate-600">{item.impact}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-white/10 pt-3">
      <span className="text-slate-300">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
