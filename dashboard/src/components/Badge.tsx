// Ducket AI Galactica — Classification Badge component
// Renders color-coded category labels matching judging criteria.
// Apache 2.0 License

interface BadgeProps {
  category: string;
}

// Color map per classification category — M3 Celestial Ledger semantic colors
const COLOR_MAP: Record<string, string> = {
  SCALPING_VIOLATION: 'bg-m3-error-container text-m3-error border border-m3-error/30',
  LIKELY_SCAM: 'bg-warn-orange/15 text-warn-orange border border-warn-orange/30',
  COUNTERFEIT_RISK: 'bg-warn-yellow/15 text-warn-yellow border border-warn-yellow/30',
  LEGITIMATE: 'bg-m3-tertiary/15 text-m3-tertiary border border-m3-tertiary/30',
  FAIR_VALUE: 'bg-m3-tertiary/15 text-m3-tertiary border border-m3-tertiary/30',
  AT_COST: 'bg-m3-surface-container text-m3-on-surface border border-m3-outline/30',
};

export function Badge({ category }: BadgeProps) {
  const colorClass = COLOR_MAP[category] ?? 'bg-m3-surface-container text-m3-on-surface-variant border border-m3-outline/30';
  const displayText = category.replace(/_/g, ' ');

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
      {displayText}
    </span>
  );
}
