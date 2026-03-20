// Ducket AI Galactica — Confidence visual bar component
// Renders a percentage bar with color coding by confidence level.
// Apache 2.0 License

interface ConfidenceBarProps {
  value: number;
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  // High confidence fraud = red; medium = orange; low/safe = teal
  const barColor = value >= 85 ? 'bg-m3-error' : value >= 60 ? 'bg-warn-orange' : 'bg-m3-tertiary';

  return (
    <div className="flex items-center">
      <div className="w-full bg-m3-surface-container-highest rounded h-2">
        <div
          className={`${barColor} h-2 rounded`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm text-m3-outline ml-2 whitespace-nowrap">{value}%</span>
    </div>
  );
}
