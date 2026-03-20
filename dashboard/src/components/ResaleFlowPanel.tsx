// Ducket AI Galactica — Resale Flow stepper container
// Renders 4-step stepper indicator + appropriate step component based on current step.
// State is lifted to App.tsx so it survives tab switches.
// Apache 2.0 License

import { cn } from '../lib/utils';
import { ResaleStep, NewListing, LockResult } from '../hooks/useResaleFlow';
import { Listing, WalletInfo } from '../types';
import { ListingForm } from './ListingForm';
import { BuyerLockStep } from './BuyerLockStep';
import { VerifyStep } from './VerifyStep';
import { SettleStep } from './SettleStep';

// Step labels for the progress indicator strip
const STEPS = [
  { id: 1, label: 'List' },
  { id: 2, label: 'Lock' },
  { id: 3, label: 'Verify' },
  { id: 4, label: 'Settle' },
] as const;

interface ResaleFlowPanelProps {
  step: ResaleStep;
  listing: Listing | null;
  lockResult: LockResult | null;
  wallet: WalletInfo | null;
  submitListing: (data: NewListing) => Promise<void>;
  lockFunds: (listing: Listing) => Promise<void>;
  advance: () => void;
}

export function ResaleFlowPanel({
  step,
  listing,
  lockResult,
  wallet,
  submitListing,
  lockFunds,
  advance,
}: ResaleFlowPanelProps) {
  return (
    <div className="space-y-6">
      {/* Step indicator strip — active=M3 primary, completed=M3 tertiary, upcoming=muted */}
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              'flex-1 py-2 rounded text-center text-sm font-medium',
              step === s.id
                ? 'bg-m3-primary-container text-m3-primary'
                : step > s.id
                ? 'bg-m3-tertiary/20 text-m3-tertiary'
                : 'bg-m3-surface-container text-m3-outline'
            )}
          >
            {s.id}. {s.label}
          </div>
        ))}
      </div>

      {/* Step content — conditional render, only the active step is mounted */}
      {step === 1 && <ListingForm onSubmit={submitListing} />}
      {step === 2 && listing && (
        <BuyerLockStep
          listing={listing}
          wallet={wallet}
          onLock={lockFunds}
          lockResult={lockResult}
          onAdvance={advance}
        />
      )}
      {step === 3 && listing?.classification && (
        <VerifyStep classification={listing.classification} onAdvance={advance} />
      )}
      {step === 4 && listing?.classification && (
        <SettleStep classification={listing.classification} />
      )}
    </div>
  );
}
