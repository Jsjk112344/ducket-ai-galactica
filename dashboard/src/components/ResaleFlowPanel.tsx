// Ducket AI Galactica — Resale Flow stepper container
// 4-step flow: Bob Lists → AI Verifies → Alice Buys → Settle
// The AI acts as a proactive gatekeeper — verifying before any buyer commits money.
// State is lifted to App.tsx so it survives tab switches.
// Apache 2.0 License

import { cn } from '../lib/utils';
import { ResaleStep, NewListing, LockResult } from '../hooks/useResaleFlow';
import { Listing, WalletInfo } from '../types';
import { ListingForm } from './ListingForm';
import { VerifyStep } from './VerifyStep';
import { BuyStep } from './BuyStep';
import { SettleStep } from './SettleStep';

const STEPS = [
  { id: 1, label: 'Bob Lists' },
  { id: 2, label: 'AI Verifies' },
  { id: 3, label: 'Alice Buys' },
  { id: 4, label: 'Settle' },
] as const;

interface ResaleFlowPanelProps {
  step: ResaleStep;
  listing: Listing | null;
  lockResult: LockResult | null;
  wallet: WalletInfo | null;
  isBlocked: boolean;
  submitListing: (data: NewListing) => Promise<void>;
  lockFunds: (listing: Listing) => Promise<void>;
  advance: () => void;
  reset: () => void;
}

export function ResaleFlowPanel({
  step,
  listing,
  lockResult,
  wallet,
  isBlocked,
  submitListing,
  lockFunds,
  advance,
  reset,
}: ResaleFlowPanelProps) {
  return (
    <div className="space-y-6">
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

      {step === 1 && <ListingForm onSubmit={submitListing} wallet={wallet} />}
      {step === 2 && listing?.classification && (
        <VerifyStep classification={listing.classification} onAdvance={advance} />
      )}
      {step === 3 && listing && (
        <BuyStep
          listing={listing}
          wallet={wallet}
          isBlocked={isBlocked}
          onLock={lockFunds}
          lockResult={lockResult}
        />
      )}
      {step === 4 && listing?.classification && (
        <SettleStep classification={listing.classification} listing={listing} onReset={reset} />
      )}
    </div>
  );
}
