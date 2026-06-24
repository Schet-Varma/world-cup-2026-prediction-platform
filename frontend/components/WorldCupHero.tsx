import type { ReactNode } from "react";

type HeroStat = {
  label: string;
  value: string;
  detail?: string;
};

type WorldCupHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: HeroStat[];
  compact?: boolean;
};

export function WorldCupHero({ eyebrow, title, description, actions, stats = [], compact = false }: WorldCupHeroProps) {
  return (
    <section className={`relative overflow-hidden rounded-lg bg-ink text-white shadow-panel ${compact ? "min-h-[300px]" : "min-h-[470px]"}`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/world-cup-hero.png')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,15,30,0.95)_0%,rgba(6,15,30,0.72)_42%,rgba(6,15,30,0.18)_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,rgba(6,15,30,0.9),rgba(6,15,30,0))]" aria-hidden="true" />

      <div className={`relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-5 sm:p-7 lg:p-9 ${compact ? "max-w-4xl" : "max-w-5xl"}`}>
        <div>
          <p className="inline-flex items-center rounded bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-mint ring-1 ring-white/15">
            {eyebrow}
          </p>
          <h1 className={`${compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-6xl"} mt-4 max-w-4xl font-black leading-[1.02] text-white`}>
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg">{description}</p>
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        {stats.length ? (
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{stat.label}</p>
                <p className="mt-1 text-2xl font-black text-white">{stat.value}</p>
                {stat.detail ? <p className="mt-1 text-sm text-mint">{stat.detail}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
