// Ducket AI Galactica — Resale flow state machine hook
// Manages the 4-step seller resale flow:
//   Step 1: Submit listing form
//   Step 2: Lock USDT in escrow (see Etherscan link)
//   Step 3: AI verification (classification shown to user)
//   Step 4: Settlement confirmation
//
// Apache 2.0 License

import { useState } from 'react';
import { Listing } from '../types';

export type ResaleStep = 1 | 2 | 3 | 4;

/** Fields submitted by the seller in Step 1. No face value — agent looks it up. */
export interface NewListing {
  eventName: string;
  section: string;
  quantity: number;
  price: number;
}

/** Result returned by POST /api/escrow/deposit after USDT lock. */
export interface LockResult {
  txHash: string;
  etherscanLink: string;
  escrowId?: string;
  /** True when env vars are absent and the server returned a demo mock response. */
  mock?: boolean;
}

export interface UseResaleFlowResult {
  step: ResaleStep;
  listing: Listing | null;
  lockResult: LockResult | null;
  submitListing: (data: NewListing) => Promise<void>;
  lockFunds: (listing: Listing) => Promise<void>;
  advance: () => void;
  reset: () => void;
}

/**
 * useResaleFlow — step state machine for the P2P resale flow.
 *
 * Usage:
 *   const { step, listing, lockResult, submitListing, lockFunds, advance, reset } = useResaleFlow();
 *
 * submitListing auto-advances to step 2 after the API responds.
 * lockFunds does NOT auto-advance — the user must click "Proceed to AI Verification"
 * after reviewing the Etherscan confirmation link.
 */
export function useResaleFlow(): UseResaleFlowResult {
  const [step, setStep] = useState<ResaleStep>(1);
  const [listing, setListing] = useState<Listing | null>(null);
  const [lockResult, setLockResult] = useState<LockResult | null>(null);

  /** POST the form data to /api/listings, store the classified listing, advance to step 2. */
  async function submitListing(formData: NewListing): Promise<void> {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const newListing: Listing = await res.json();
    setListing(newListing);
    // Auto-advance: classification is attached immediately, no wait needed
    setStep(2);
  }

  /**
   * POST the listing URL to /api/escrow/deposit, store the lock result.
   * Does NOT auto-advance — user reviews Etherscan link before clicking "Proceed".
   */
  async function lockFunds(l: Listing): Promise<void> {
    const res = await fetch('/api/escrow/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingUrl: l.url }),
    });
    const result: LockResult = await res.json();
    setLockResult(result);
    // Do NOT auto-advance — user clicks "Proceed to AI Verification" after seeing Etherscan link
  }

  /** Manually advance to the next step (capped at 4). Used by CTA buttons in step panels. */
  function advance() {
    setStep((s) => Math.min(4, s + 1) as ResaleStep);
  }

  /** Reset the entire flow back to step 1, clearing listing and lock state. */
  function reset() {
    setStep(1);
    setListing(null);
    setLockResult(null);
  }

  return { step, listing, lockResult, submitListing, lockFunds, advance, reset };
}
