// Ducket AI Galactica — Trust Badges
// Horizontal strip of trust indicators for P2P resale safety.
// Rendered above ListingsTable on the Listings tab (BRAND-04).
// Apache 2.0 License

import { Shield, CheckCircle, Lock } from 'lucide-react';

const TRUST_BADGES = [
  { label: 'Price cap protected', Icon: Shield },
  { label: 'Verified on-chain', Icon: CheckCircle },
  { label: 'Non-custodial', Icon: Lock },
] as const;

export function TrustBadges() {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {TRUST_BADGES.map(({ label, Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                     bg-brand-primary/20 text-brand-accent border border-brand-primary/40
                     text-xs font-medium"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
      ))}
    </div>
  );
}
