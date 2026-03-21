// Ducket AI Galactica — Buyer purchase step (Step 3 of resale flow)
// Renders a realistic ticket resale listing page with Alice logged in.
// Uses negative margin to break out of the parent container padding
// so it fills the full width like a real page.
// Apache 2.0 License

import { useState } from 'react';
import { Listing, WalletInfo } from '../types';
import { LockResult } from '../hooks/useResaleFlow';
import { Badge } from './Badge';
import { ConfidenceBar } from './ConfidenceBar';
import { Button } from './ui/button';
import { EtherscanLink } from './EtherscanLink';

interface BuyStepProps {
  listing: Listing;
  wallet: WalletInfo | null;
  isBlocked: boolean;
  onLock: (listing: Listing) => Promise<void>;
  lockResult: LockResult | null;
}

function shortTitle(name: string) {
  return name.replace(/^FIFA World Cup 2026\s*[—–-]\s*/i, '') || name;
}

export function BuyStep({ listing, wallet, isBlocked, onLock, lockResult }: BuyStepProps) {
  const [locking, setLocking] = useState(false);

  const totalPrice = listing.price * (listing.quantity ?? 1);
  const classification = listing.classification;
  const walletShort = wallet?.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : null;
  const isVerified = classification?.category === 'LEGITIMATE';

  async function handleLock() {
    setLocking(true);
    await onLock(listing);
    setLocking(false);
  }

  return (
    // Negative margin breaks out of parent p-5 container so the preview fills full width
    <div className="-mx-5 -mb-5 rounded-b-xl overflow-hidden border-t border-m3-outline/15 bg-m3-surface-container-lowest">

      {/* ── Top nav bar — Ducket resale marketplace + Alice logged in ── */}
      <nav className="flex items-center justify-between px-6 py-3 bg-m3-surface-container-low/80 backdrop-blur-sm border-b border-m3-outline/10">
        <div className="flex items-center gap-3">
          <img src="/images/logomark.png" className="h-6 w-auto" alt="Ducket" />
          <span className="font-heading font-bold text-m3-primary text-base tracking-tight">DUCKET</span>
          <span className="text-xs bg-m3-primary-container/50 text-m3-primary px-2.5 py-0.5 rounded font-medium">Resale</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-m3-outline hidden sm:block">Marketplace</span>
          <div className="flex items-center gap-2 bg-m3-surface-container rounded-full pl-1.5 pr-3 py-1 border border-m3-outline/15">
            <span className="w-7 h-7 rounded-full bg-m3-secondary/25 flex items-center justify-center text-m3-secondary text-xs font-bold">A</span>
            <div>
              <p className="text-xs font-medium text-m3-on-surface leading-none">Alice</p>
              {walletShort && (
                <p className="text-[10px] font-mono text-m3-outline leading-none mt-0.5">{walletShort}</p>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5">

        {/* ── Left: Ticket listing detail (3/5) ── */}
        <div className="lg:col-span-3 lg:border-r border-m3-outline/10">

          {/* Event hero banner — taller with more breathing room */}
          <div className="relative ducket-hero-gradient px-6 pt-8 pb-16">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-full bg-m3-primary-container/80 text-m3-primary text-xs font-semibold">
                FIFA World Cup 2026
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-medium backdrop-blur-sm">
                Resale Listing
              </span>
              {classification && (
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                  isVerified
                    ? 'bg-m3-tertiary/20 text-m3-tertiary border border-m3-tertiary/30'
                    : 'bg-m3-error/20 text-m3-error border border-m3-error/30'
                }`}>
                  {isVerified ? '\u2713 AI Verified' : '\u26A0 Flagged'}
                </span>
              )}
            </div>
            <h2 className="text-white font-heading font-bold text-2xl leading-tight">{shortTitle(listing.eventName)}</h2>
            <p className="text-white/40 text-sm mt-1.5">Resale listing by <span className="text-white/60">{listing.seller ?? 'bob_seller'}</span></p>
          </div>

          {/* Ticket details card — overlaps the hero */}
          <div className="mx-6 -mt-8 mb-5">
            <div className="bg-m3-surface-container rounded-xl border border-m3-outline/15 overflow-hidden">
              <div className="px-5 py-3 bg-m3-surface-container-high/50 border-b border-m3-outline/10">
                <h3 className="text-xs font-semibold text-m3-on-surface uppercase tracking-wider">Ticket Details</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <p className="text-[10px] text-m3-outline uppercase tracking-wider mb-1">Event</p>
                    <p className="text-sm text-m3-on-surface font-medium leading-snug">{listing.eventName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-m3-outline uppercase tracking-wider mb-1">Section / Category</p>
                    <p className="text-sm text-m3-on-surface font-medium">{listing.section ?? 'General Admission'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-m3-outline uppercase tracking-wider mb-1">Number of Tickets</p>
                    <p className="text-sm text-m3-on-surface font-medium">{listing.quantity ?? 1} ticket{(listing.quantity ?? 1) > 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-m3-outline uppercase tracking-wider mb-1">Price per Ticket</p>
                    <p className="text-sm text-m3-on-surface font-medium">${listing.price?.toLocaleString()} USD</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Verification card */}
          {classification && (
            <div className="mx-6 mb-5">
              <div className="bg-m3-surface-container rounded-xl border border-m3-outline/15 overflow-hidden">
                <div className={`px-5 py-3 border-b border-m3-outline/10 flex items-center justify-between ${
                  isVerified ? 'bg-m3-tertiary/5' : 'bg-m3-error/5'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isVerified ? 'bg-m3-tertiary/20 text-m3-tertiary' : 'bg-m3-error/20 text-m3-error'
                    }`}>
                      {isVerified ? '\u2713' : '!'}
                    </span>
                    <h3 className="text-xs font-semibold text-m3-on-surface uppercase tracking-wider">
                      {isVerified ? 'Verified by Ducket AI' : 'Flagged by Ducket AI'}
                    </h3>
                  </div>
                  <Badge category={classification.category} />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-m3-outline">Agent Confidence</span>
                    <div className="flex-1"><ConfidenceBar value={classification.confidence} /></div>
                    <span className="text-sm font-mono font-semibold text-m3-on-surface">{classification.confidence}%</span>
                  </div>
                  {classification.reasoning && (
                    <p className="text-xs text-m3-on-surface-variant leading-relaxed">
                      {classification.reasoning.slice(0, 200)}{classification.reasoning.length > 200 ? '...' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Seller info card */}
          <div className="mx-6 mb-5">
            <div className="bg-m3-surface-container rounded-xl border border-m3-outline/15 p-5">
              <h3 className="text-xs font-semibold text-m3-on-surface uppercase tracking-wider mb-3">Seller</h3>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-m3-tertiary/15 flex items-center justify-center text-m3-tertiary text-sm font-bold">B</span>
                <div>
                  <p className="text-sm font-medium text-m3-on-surface">{listing.seller ?? 'bob_seller'}</p>
                  <p className="text-xs text-m3-outline">Joined Ducket Resale</p>
                </div>
                <span className="ml-auto text-[10px] text-m3-outline bg-m3-surface-container-high px-2 py-1 rounded">Platform: Ducket</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Purchase panel (2/5) ── */}
        <div className="lg:col-span-2 p-6 flex flex-col bg-m3-surface-container-low/30">

          {/* Price summary */}
          <div className="mb-5">
            <p className="text-xs text-m3-outline uppercase tracking-wider mb-1">Total Price</p>
            <p className="text-4xl font-heading font-black text-m3-secondary tracking-tight">${totalPrice.toLocaleString()}</p>
            <p className="text-sm text-m3-outline mt-1">{listing.quantity ?? 1} ticket{(listing.quantity ?? 1) > 1 ? 's' : ''} &times; ${listing.price?.toLocaleString()} each</p>
          </div>

          {/* Blocked warning */}
          {isBlocked && classification && (
            <div className="bg-m3-error/10 border border-m3-error/30 rounded-xl p-4 mb-5">
              <p className="text-m3-error font-semibold text-sm">Purchase Blocked</p>
              <p className="text-m3-on-surface-variant text-xs mt-1">
                The AI agent flagged this listing as <span className="font-semibold text-m3-error">{classification.category.replace(/_/g, ' ')}</span>.
                Funds cannot be locked to protect buyers.
              </p>
            </div>
          )}

          {/* Wallet */}
          <div className="bg-m3-surface-container rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-m3-outline uppercase tracking-wider">Payment Wallet</p>
              <span className="text-[10px] text-m3-tertiary bg-m3-tertiary/10 px-2 py-0.5 rounded-full border border-m3-tertiary/20 font-medium">WDK Non-Custodial</span>
            </div>
            <p className="font-mono text-xs text-m3-on-surface-variant break-all">{wallet?.address ?? 'Connecting...'}</p>
          </div>

          {/* Buy button */}
          {!lockResult && (
            <Button
              onClick={handleLock}
              disabled={locking || isBlocked}
              className="w-full py-3.5 text-base font-semibold"
            >
              {isBlocked
                ? 'Purchase Blocked'
                : locking
                ? 'Locking USDT...'
                : `Buy for $${totalPrice.toLocaleString()} USDT`}
            </Button>
          )}

          {/* Post-lock */}
          {lockResult && (
            <div className="bg-m3-tertiary/10 border border-m3-tertiary/30 rounded-xl p-4">
              <p className="text-m3-tertiary text-sm font-semibold">${totalPrice.toLocaleString()} USDT locked in escrow</p>
              <p className="text-xs text-m3-outline mt-1">Settlement in progress...</p>
              <div className="mt-2">
                <EtherscanLink href={lockResult.etherscanLink} label="View FraudEscrow on Etherscan" />
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1 min-h-6" />

          {/* Trust footer */}
          <div className="flex flex-col gap-2 pt-5 mt-5 border-t border-m3-outline/10">
            <p className="text-[10px] text-m3-outline uppercase tracking-wider mb-1">Buyer Protection</p>
            <div className="flex items-center gap-2 text-xs text-m3-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-m3-tertiary flex-shrink-0" />
              Escrow protected — funds held by smart contract until verified
            </div>
            <div className="flex items-center gap-2 text-xs text-m3-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-m3-tertiary flex-shrink-0" />
              AI verified — 5-signal risk analysis before purchase
            </div>
            <div className="flex items-center gap-2 text-xs text-m3-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-m3-tertiary flex-shrink-0" />
              Instant settlement — no disputes, no waiting
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
