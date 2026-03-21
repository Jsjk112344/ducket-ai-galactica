// Ducket AI Galactica — Resale flow state machine hook
// Manages the 4-step resale flow:
//   Step 1: Bob lists a ticket for resale
//   Step 2: AI agent pre-verifies the listing (gatekeeper)
//   Step 3: Alice sees verified listing and locks USDT
//   Step 4: Settlement outcome
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
  /** True if AI flagged the listing as non-LEGITIMATE — purchase should be blocked. */
  isBlocked: boolean;
  submitListing: (data: NewListing) => Promise<void>;
  lockFunds: (listing: Listing) => Promise<void>;
  advance: () => void;
  reset: () => void;
}

/**
 * useResaleFlow — step state machine for the P2P resale flow.
 *
 * Flow:
 *   Step 1: Bob submits listing → POST /api/listings → auto-advance to step 2
 *   Step 2: AI verification animation plays → user clicks advance → step 3
 *   Step 3: Alice sees verified listing → locks USDT → auto-advance to step 4
 *   Step 4: Settlement outcome (terminal)
 */
export function useResaleFlow(): UseResaleFlowResult {
  const [step, setStep] = useState<ResaleStep>(1);
  const [listing, setListing] = useState<Listing | null>(null);
  const [lockResult, setLockResult] = useState<LockResult | null>(null);

  // Agent gatekeeper: true if classification is anything other than LEGITIMATE
  const isBlocked = listing?.classification != null && listing.classification.category !== 'LEGITIMATE';

  /** POST the form data to /api/listings, store the classified listing, advance to step 2 (AI verification). */
  async function submitListing(formData: NewListing): Promise<void> {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const newListing: Listing = await res.json();
    setListing(newListing);
    // Auto-advance to AI verification step
    setStep(2);
  }

  /**
   * POST the listing URL to /api/escrow/deposit, store the lock result.
   * Auto-advances to step 4 (settlement) since the listing is already pre-verified.
   */
  async function lockFunds(l: Listing): Promise<void> {
    const res = await fetch('/api/escrow/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingUrl: l.url }),
    });
    const result: LockResult = await res.json();
    setLockResult(result);
    // Auto-advance to settlement — listing is already verified, no review step needed
    setStep(4);
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

  return { step, listing, lockResult, isBlocked, submitListing, lockFunds, advance, reset };
}
