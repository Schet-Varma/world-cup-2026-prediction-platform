type ProbabilityBarProps = {
  label: string;
  value: number;
  tone?: "green" | "red" | "slate";
};

const tones = {
  green: "bg-pitch",
  red: "bg-coral",
  slate: "bg-slate-500"
};

export function ProbabilityBar({ label, value, tone = "green" }: ProbabilityBarProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="tabular-nums text-slate-900">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 rounded bg-slate-200">
        <div className={`h-2 rounded ${tones[tone]}`} style={{ width: `${Math.max(2, value * 100)}%` }} />
      </div>
    </div>
  );
}
