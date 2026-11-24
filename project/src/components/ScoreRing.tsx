interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function ScoreRing({
  score,
  size = 160,
  strokeWidth = 12,
  label = 'Overall Score',
  sublabel,
}: ScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  const color =
    clampedScore >= 80 ? '#6B8E7B' : clampedScore >= 60 ? '#243B35' : '#B7C9B1';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="radial-progress">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#B7C9B1"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-navy-900">{Math.round(clampedScore)}</span>
          <span className="text-xs text-navy-400 font-medium">out of 100</span>
        </div>
      </div>
      {label && <p className="mt-3 text-sm font-semibold text-navy-700">{label}</p>}
      {sublabel && <p className="text-xs text-navy-400">{sublabel}</p>}
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
}

export function ScoreBar({ label, value, max = 100 }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    pct >= 80 ? 'bg-success-500' : pct >= 60 ? 'bg-brand-500' : pct >= 40 ? 'bg-warning-500' : 'bg-error-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-navy-700">{label}</span>
        <span className="text-sm font-semibold text-navy-900">{Math.round(value)}{max === 100 ? '' : `/${max}`}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-800 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
