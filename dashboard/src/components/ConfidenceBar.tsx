// Ducket AI Galactica — Confidence visual bar component
// Renders a percentage bar with color coding by confidence level.
// Apache 2.0 License

interface ConfidenceBarProps {
  value: number;
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  // High confidence fraud = red; medium = orange; low/safe = green
  const barColor = value >= 85 ? 'bg-warn-red' : value >= 60 ? 'bg-warn-orange' : 'bg-success';

  return (
    <div className="flex items-center">
      <div className="w-full bg-bg-card rounded h-2">
        <div
          className={`${barColor} h-2 rounded`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm text-gray-400 ml-2 whitespace-nowrap">{value}%</span>
    </div>
  );
}
