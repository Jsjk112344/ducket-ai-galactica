// Ducket AI Galactica — Settlement outcome step (Step 4 of resale flow)
// Shows both Bob's (seller) and Alice's (buyer) perspectives side by side,
// with the settlement outcome and on-chain evidence.
// Apache 2.0 License

import { Classification, Listing } from '../types';
import { Badge } from './Badge';
import { EtherscanLink } from './EtherscanLink';
import { Button } from './ui/button';

const OUTCOME_CONFIG: Record<string, { label: string; sublabel: string; color: string; bg: string; icon: string }> = {
  release: {
    label: 'RELEASED to Bob (seller)',
    sublabel: 'Listing verified — payment released',
    color: 'text-m3-tertiary',
    bg: 'bg-m3-tertiary/10 border-m3-tertiary/30',
    icon: '\u2713',
  },
  refund: {
    label: 'REFUNDED to Alice (buyer)',
    sublabel: 'Verification failed — buyer protected',
    color: 'text-warn-yellow',
    bg: 'bg-warn-yellow/10 border-warn-yellow/30',
    icon: '\u21A9',
  },
  slash: {
    label: 'SLASHED to bounty pool',
    sublabel: 'Fraud confirmed — funds penalized',
    color: 'text-m3-error',
    bg: 'bg-m3-error/10 border-m3-error/30',
    icon: '\u2717',
  },
  escrow_deposit: {
    label: 'PENDING settlement',
    sublabel: 'Awaiting agent verification',
    color: 'text-m3-outline',
    bg: 'bg-m3-surface-container border-m3-outline/30',
    icon: '\u23F3',
  },
};

interface SettleStepProps {
  classification: Classification;
  listing?: Listing | null;
  onReset?: () => void;
}

export function SettleStep({ classification, listing, onReset }: SettleStepProps) {
  const action = classification.actionTaken ?? 'escrow_deposit';
  const outcomeKey = action.toLowerCase().includes('release')
    ? 'release'
    : action.toLowerCase().includes('refund')
    ? 'refund'
    : action.toLowerCase().includes('slash')
    ? 'slash'
    : 'escrow_deposit';
  const config = OUTCOME_CONFIG[outcomeKey];

  const totalPrice = listing ? listing.price * (listing.quantity ?? 1) : null;
  const isReleased = outcomeKey === 'release';

  return (
    <div className="-mx-5 -mb-5 rounded-b-xl overflow-hidden border-t border-m3-outline/15 bg-m3-surface-container-lowest">

      {/* Settlement outcome banner */}
      <div className={`px-6 py-5 border-b ${config.bg}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${config.bg} ${config.color}`}>
            {config.icon}
          </span>
          <div>
            <p className={`text-xl font-heading font-bold ${config.color}`}>{config.label}</p>
            <p className="text-m3-outline text-sm">{config.sublabel}</p>
          </div>
          {totalPrice && (
            <p className={`text-3xl font-heading font-black ml-auto ${config.color}`}>${totalPrice.toLocaleString()}</p>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Badge category={classification.category} />
          <span className="text-xs text-m3-outline">Confidence: {classification.confidence}%</span>
          {classification.etherscanLink && (
            <div className="ml-auto">
              <EtherscanLink href={classification.etherscanLink} label="View on Etherscan" />
            </div>
          )}
        </div>
      </div>

      {/* Two perspectives side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* ── Bob's perspective (seller) ── */}
        <div className="p-6 lg:border-r border-m3-outline/10">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 rounded-full bg-m3-tertiary/20 flex items-center justify-center text-m3-tertiary text-sm font-bold">B</span>
            <div>
              <p className="text-sm font-semibold text-m3-on-surface">Bob (Seller)</p>
              <p className="text-[10px] text-m3-outline">Resale listing</p>
            </div>
          </div>

          {/* Bob's listing preview */}
          <div className="bg-m3-surface-container rounded-xl border border-m3-outline/15 overflow-hidden mb-4">
            <div className="ducket-hero-gradient px-4 pt-4 pb-8 relative">
              <div className="flex gap-1.5 mb-4">
                <span className="px-2 py-0.5 rounded bg-m3-primary-container/80 text-m3-primary text-[10px] font-semibold">FIFA WC 2026</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px]">Resale</span>
              </div>
              <h3 className="text-white font-heading font-bold text-base leading-tight">
                {listing?.eventName ?? 'Event'}
              </h3>
              <p className="text-white/40 text-xs mt-1">by {listing?.seller ?? 'bob_seller'}</p>
            </div>
            <div className="-mt-4 mx-3 mb-3 bg-m3-surface-container-high rounded-lg p-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-[9px] text-m3-outline uppercase">Section</p>
                  <p className="text-m3-on-surface font-medium mt-0.5">{listing?.section ?? 'GA'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-m3-outline uppercase">Qty</p>
                  <p className="text-m3-on-surface font-medium mt-0.5">{listing?.quantity ?? 1}x</p>
                </div>
                <div>
                  <p className="text-[9px] text-m3-outline uppercase">Price</p>
                  <p className="text-m3-secondary font-bold mt-0.5">${listing?.price?.toLocaleString()}/ea</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bob's outcome */}
          <div className={`rounded-xl p-4 border ${isReleased ? 'bg-m3-tertiary/5 border-m3-tertiary/20' : 'bg-m3-error/5 border-m3-error/20'}`}>
            <p className={`text-sm font-semibold ${isReleased ? 'text-m3-tertiary' : 'text-m3-error'}`}>
              {isReleased ? 'Payment Received' : 'Listing Rejected'}
            </p>
            <p className="text-xs text-m3-on-surface-variant mt-1">
              {isReleased
                ? `$${totalPrice?.toLocaleString()} USDT released to your wallet. Ticket transfer confirmed.`
                : `Your listing was flagged as ${classification.category.replace(/_/g, ' ')}. Escrowed funds were ${outcomeKey === 'slash' ? 'slashed to the bounty pool' : 'refunded to the buyer'}.`
              }
            </p>
          </div>
        </div>

        {/* ── Alice's perspective (buyer) ── */}
        <div className="p-6 border-t lg:border-t-0 border-m3-outline/10">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 rounded-full bg-m3-secondary/20 flex items-center justify-center text-m3-secondary text-sm font-bold">A</span>
            <div>
              <p className="text-sm font-semibold text-m3-on-surface">Alice (Buyer)</p>
              <p className="text-[10px] text-m3-outline">Purchase</p>
            </div>
          </div>

          {/* Alice's purchase summary */}
          <div className="bg-m3-surface-container rounded-xl border border-m3-outline/15 p-4 mb-4">
            <p className="text-xs text-m3-outline uppercase tracking-wider mb-2">Purchase Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-m3-on-surface-variant">{listing?.quantity ?? 1}x {listing?.section ?? 'GA'} ticket{(listing?.quantity ?? 1) > 1 ? 's' : ''}</span>
                <span className="text-m3-on-surface font-medium">${totalPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-m3-on-surface-variant">Escrow fee</span>
                <span className="text-m3-tertiary font-medium">$0.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-m3-outline/10">
                <span className="text-m3-on-surface font-semibold">Total</span>
                <span className="text-m3-secondary font-bold">${totalPrice?.toLocaleString()} USDT</span>
              </div>
            </div>
          </div>

          {/* Alice's outcome */}
          <div className={`rounded-xl p-4 border ${isReleased ? 'bg-m3-tertiary/5 border-m3-tertiary/20' : 'bg-warn-yellow/5 border-warn-yellow/20'}`}>
            <p className={`text-sm font-semibold ${isReleased ? 'text-m3-tertiary' : 'text-warn-yellow'}`}>
              {isReleased ? 'Ticket Secured' : 'Funds Returned'}
            </p>
            <p className="text-xs text-m3-on-surface-variant mt-1">
              {isReleased
                ? `Your purchase of ${listing?.quantity ?? 1} ticket${(listing?.quantity ?? 1) > 1 ? 's' : ''} is confirmed. $${totalPrice?.toLocaleString()} USDT was released to the seller.`
                : `The listing failed AI verification. Your $${totalPrice?.toLocaleString()} USDT has been safely returned to your wallet.`
              }
            </p>
          </div>

          {/* Buyer protection note */}
          <div className="mt-4 flex items-start gap-2 text-xs text-m3-outline">
            <span className="w-2 h-2 rounded-full bg-m3-tertiary mt-1 flex-shrink-0" />
            <p>Protected by Ducket AI — {isReleased ? 'listing passed 5-signal verification before funds were released' : 'fraud detected before funds reached the seller'}.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-m3-outline/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/images/logomark.png" className="h-4 w-auto opacity-40" alt="" />
          <span className="text-xs text-m3-outline">Settlement completed — zero humans in the loop</span>
        </div>
        {onReset && (
          <Button onClick={onReset} variant="outline" size="sm">
            Try Another Listing
          </Button>
        )}
      </div>
    </div>
  );
}
