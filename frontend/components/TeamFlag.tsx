import { flagForTeamId, flagForTeamName } from "@/lib/visuals";

type TeamFlagProps = {
  teamId?: string | null;
  teamName?: string | null;
  label?: string;
  align?: "left" | "right";
  compact?: boolean;
};

export function TeamFlag({ teamId, teamName, label, align = "left", compact = false }: TeamFlagProps) {
  const flag = teamId ? flagForTeamId(teamId) : flagForTeamName(teamName);
  const display = label ?? teamName;

  return (
    <span className={`inline-flex items-center gap-2 ${align === "right" ? "justify-end" : ""}`}>
      <span className={`${compact ? "h-7 w-7 text-base" : "h-9 w-9 text-xl"} flex shrink-0 items-center justify-center rounded bg-white shadow-sm ring-1 ring-slate-200`}>
        {flag}
      </span>
      {display ? <span className="min-w-0 truncate font-bold">{display}</span> : null}
    </span>
  );
}
