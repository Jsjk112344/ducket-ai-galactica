// Ducket AI Galactica — Buyer USDT lock step (Step 2 of resale flow)
// Shows WDK wallet address, lock button, Etherscan confirmation link after deposit.
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

  async function handleLock() {
    setLocking(true);
    await onLock(listing);
    setLocking(false);
  }

  return (
    <div className="bg-m3-surface-container rounded-xl p-4 space-y-4">
      <h2 className="text-lg font-heading font-semibold text-m3-on-surface">Buyer: Lock Funds in Escrow</h2>

        {/* WDK Wallet address */}
        <div>
          <p className="text-xs text-m3-outline uppercase tracking-wide">WDK Wallet (non-custodial)</p>
          <p className="font-mono text-sm text-m3-on-surface">{wallet?.address ?? 'Loading...'}</p>
        </div>

        {/* Lock button — shown before deposit completes */}
        {!lockResult && (
          <Button onClick={handleLock} disabled={locking} className="w-full">
            {locking ? 'Locking 10 USDT...' : 'Lock 10 USDT in Escrow'}
          </Button>
        )}

        {/* Post-lock confirmation — shown after deposit */}
        {lockResult && (
          <div className="space-y-2">
            <p className="text-m3-tertiary text-sm font-medium">Escrow locked. Deposit confirmed.</p>
            <EtherscanLink href={lockResult.etherscanLink} />
            <Button onClick={onAdvance} className="w-full mt-2">
              Proceed to AI Verification
            </Button>
          </div>
        )}
    </div>
  );
}
