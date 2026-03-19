// Ducket AI Galactica — Classification Badge component
// Renders color-coded category labels matching judging criteria.
// Apache 2.0 License

interface BadgeProps {
  category: string;
}

// Color map per classification category — matched to Ducket brand token spec
const COLOR_MAP: Record<string, string> = {
  SCALPING_VIOLATION: 'bg-warn-red text-white',
  LIKELY_SCAM: 'bg-warn-orange text-white',
  COUNTERFEIT_RISK: 'bg-warn-yellow text-black',
  LEGITIMATE: 'bg-success text-white',
};

export function Badge({ category }: BadgeProps) {
  const colorClass = COLOR_MAP[category] ?? 'bg-gray-500 text-white';
  const displayText = category.replace(/_/g, ' ');

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
      {displayText}
    </span>
  );
}
