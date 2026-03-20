// Ducket AI Galactica — Trust Badges
// Horizontal strip of trust indicators for P2P resale safety.
// Rendered above ListingsTable on the Listings tab (BRAND-04).
// Apache 2.0 License

import { Shield, CheckCircle, Lock, Zap } from 'lucide-react';

const TRUST_BADGES = [
  { label: 'Escrow Secured', Icon: Shield },
  { label: 'AI Verified', Icon: CheckCircle },
  { label: 'Instant Settle', Icon: Zap },
  { label: 'Non-custodial', Icon: Lock },
] as const;

export function TrustBadges() {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {TRUST_BADGES.map(({ label, Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                     bg-m3-surface-container text-m3-tertiary border border-m3-tertiary/30
                     text-xs font-medium cursor-default
                     hover:scale-105 hover:bg-m3-tertiary/10 transition-transform duration-150"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
      ))}
    </div>
  );
}
