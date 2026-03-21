// Ducket AI Galactica — Buyer USDT lock step (Step 2 of resale flow)
// Bob (buyer) sees Alice's listing summary, then locks the full ticket price in escrow.
// lockFunds does NOT auto-advance — buyer reviews Etherscan link before proceeding.
// Apache 2.0 License

import { useState } from 'react';
import { Listing, WalletInfo } from '../types';
import { LockResult } from '../hooks/useResaleFlow';
import { Button } from './ui/button';
import { EtherscanLink } from './EtherscanLink';

interface BuyerLockStepProps {
  listing: Listing;
  wallet: WalletInfo | null;
  onLock: (listing: Listing) => Promise<void>;
  lockResult: LockResult | null;
  onAdvance: () => void;
}

export function BuyerLockStep({ listing, wallet, onLock, lockResult, onAdvance }: BuyerLockStepProps) {
  const [locking, setLocking] = useState(false);

  const totalPrice = listing.price * (listing.quantity ?? 1);

  async function handleLock() {
    setLocking(true);
    await onLock(listing);
    setLocking(false);
  }

  return (
    <div className="space-y-4">
      {/* Alice's listing summary — what Bob sees */}
      <div className="bg-m3-surface-container rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-full bg-m3-secondary/20 flex items-center justify-center text-m3-secondary text-xs font-bold">A</span>
          <div>
            <p className="text-sm font-semibold text-m3-on-surface">Alice's Listing</p>
            <p className="text-xs text-m3-outline">Listed just now</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-xs text-m3-outline uppercase tracking-wide">Event</span>
            <p className="text-m3-on-surface">{listing.eventName}</p>
          </div>
          <div>
            <span className="text-xs text-m3-outline uppercase tracking-wide">Section</span>
            <p className="text-m3-on-surface">{listing.section ?? 'General'}</p>
          </div>
          <div>
            <span className="text-xs text-m3-outline uppercase tracking-wide">Quantity</span>
            <p className="text-m3-on-surface">{listing.quantity ?? 1} ticket{(listing.quantity ?? 1) > 1 ? 's' : ''}</p>
          </div>
          <div>
            <span className="text-xs text-m3-outline uppercase tracking-wide">Price per ticket</span>
            <p className="text-m3-on-surface">${listing.price?.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-m3-outline/10 flex items-center justify-between">
          <span className="text-sm text-m3-outline">Total</span>
          <span className="text-lg font-bold text-m3-secondary">${totalPrice.toLocaleString()} USDT</span>
        </div>
      </div>

      {/* Bob's lock action */}
      <div className="bg-m3-surface-container rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-m3-tertiary/20 flex items-center justify-center text-m3-tertiary text-xs font-bold">B</span>
          <div>
            <h2 className="text-lg font-heading font-semibold text-m3-on-surface">Bob Locks Funds</h2>
            <p className="text-xs text-m3-outline">Funds held by smart contract — neither party can withdraw</p>
          </div>
        </div>

        {/* WDK Wallet address */}
        <div>
          <p className="text-xs text-m3-outline uppercase tracking-wide">WDK Wallet (non-custodial)</p>
          <p className="font-mono text-sm text-m3-on-surface">{wallet?.address ?? 'Loading...'}</p>
        </div>

        {/* Lock button — shown before deposit completes */}
        {!lockResult && (
          <Button onClick={handleLock} disabled={locking} className="w-full">
            {locking ? `Locking $${totalPrice.toLocaleString()} USDT...` : `Lock $${totalPrice.toLocaleString()} USDT in Escrow`}
          </Button>
        )}

        {/* Post-lock confirmation — shown after deposit */}
        {lockResult && (
          <div className="space-y-2">
            <p className="text-m3-tertiary text-sm font-medium">${totalPrice.toLocaleString()} USDT locked in escrow. Deposit confirmed.</p>
            <EtherscanLink href={lockResult.etherscanLink} />
            <Button onClick={onAdvance} className="w-full mt-2">
              Proceed to AI Verification
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
