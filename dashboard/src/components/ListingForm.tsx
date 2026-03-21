// Ducket AI Galactica — Seller listing form (Step 1 of resale flow)
// Two-column layout: form on the left, live Ducket resale preview on the right.
// The preview updates in real time as Bob fills in the form.
// Apache 2.0 License

import { useState } from 'react';
import { NewListing } from '../hooks/useResaleFlow';
import { WalletInfo } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ListingFormProps {
  onSubmit: (data: NewListing) => Promise<void>;
  wallet?: WalletInfo | null;
}

function shortTitle(name: string) {
  return name.replace(/^FIFA World Cup 2026\s*[—–-]\s*/i, '') || name;
}

// Demo presets
const PRESETS: { label: string; hint: string; color: string; data: NewListing }[] = [
  {
    label: 'Legit Resale',
    hint: '$245 for $200 face — fair markup',
    color: 'border-m3-tertiary/40 text-m3-tertiary hover:bg-m3-tertiary/10',
    data: { eventName: 'FIFA World Cup 2026 — USA vs England', section: 'Category 1', quantity: 2, price: 245 },
  },
  {
    label: 'Scalper',
    hint: '$800 for $120 face — 567% markup',
    color: 'border-m3-error/40 text-m3-error hover:bg-m3-error/10',
    data: { eventName: 'FIFA World Cup 2026 — USA vs England', section: 'Category 2', quantity: 2, price: 800 },
  },
];

// Bob's wallet is derived from the deployer wallet — different address for demo clarity
const BOB_WALLET = '0x7a2F...b93E';

export function ListingForm({ onSubmit, wallet }: ListingFormProps) {
  const [form, setForm] = useState<NewListing>(PRESETS[0].data);
  const [submitting, setSubmitting] = useState(false);

  const totalPrice = form.price * form.quantity;
  const bobWallet = wallet?.address
    ? `${wallet.address.slice(0, 4)}B...${wallet.address.slice(-3)}b`
    : BOB_WALLET;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  }

  return (
    <div className="-mx-5 -mb-5 rounded-b-xl overflow-hidden border-t border-m3-outline/15 bg-m3-surface-container-lowest">

      {/* Nav bar — Bob logged in as seller */}
      <nav className="flex items-center justify-between px-6 py-3 bg-m3-surface-container-low/80 backdrop-blur-sm border-b border-m3-outline/10">
        <div className="flex items-center gap-3">
          <img src="/images/logomark.png" className="h-6 w-auto" alt="Ducket" />
          <span className="font-heading font-bold text-m3-primary text-base tracking-tight">DUCKET</span>
          <span className="text-xs bg-m3-primary-container/50 text-m3-primary px-2.5 py-0.5 rounded font-medium">Resale</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-m3-outline hidden sm:block">Sell Tickets</span>
          <div className="flex items-center gap-2 bg-m3-surface-container rounded-full pl-1.5 pr-3 py-1 border border-m3-outline/15">
            <span className="w-7 h-7 rounded-full bg-m3-tertiary/20 flex items-center justify-center text-m3-tertiary text-xs font-bold">B</span>
            <div>
              <p className="text-xs font-medium text-m3-on-surface leading-none">Bob</p>
              <p className="text-[10px] font-mono text-m3-outline leading-none mt-0.5">{bobWallet}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Two-column: form + live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* ── Left: Listing form ── */}
        <div className="p-6 lg:border-r border-m3-outline/10">
          <h2 className="text-lg font-heading font-semibold text-m3-on-surface mb-1">List a Ticket for Resale</h2>
          <p className="text-xs text-m3-outline mb-4">Set your asking price — the agent will verify it independently</p>

          {/* Presets */}
          <div className="flex gap-2 mb-5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setForm(p.data)}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${p.color}`}
              >
                <span className="block font-semibold">{p.label}</span>
                <span className="block opacity-70 mt-0.5">{p.hint}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={form.eventName}
                onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Ask Price per Ticket (USD)</Label>
              <Input
                id="price"
                type="number"
                min={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: +e.target.value })}
                required
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-m3-surface-container rounded-lg">
              <span className="text-sm text-m3-outline">Total listing price</span>
              <span className="text-xl font-heading font-bold text-m3-secondary">${totalPrice.toLocaleString()} USDT</span>
            </div>

            <Button type="submit" disabled={submitting} className="w-full py-3 text-base">
              {submitting ? 'Submitting...' : 'Submit Listing'}
            </Button>
          </form>
        </div>

        {/* ── Right: Live listing preview ── */}
        <div className="p-6 bg-m3-surface-container-low/30">
          <p className="text-xs text-m3-outline uppercase tracking-wider mb-3">Live Preview — how buyers will see your listing</p>

          {/* Mini listing card */}
          <div className="bg-m3-surface-container rounded-xl border border-m3-outline/15 overflow-hidden">

            {/* Hero banner */}
            <div className="ducket-hero-gradient px-5 pt-6 pb-14 relative">
              <div className="flex gap-1.5 mb-5">
                <span className="px-2.5 py-1 rounded-full bg-m3-primary-container/80 text-m3-primary text-[10px] font-semibold">
                  FIFA World Cup 2026
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/70 text-[10px] font-medium backdrop-blur-sm">
                  Resale Listing
                </span>
              </div>
              <h3 className="text-white font-heading font-bold text-xl leading-tight">
                {shortTitle(form.eventName) || 'Event Name'}
              </h3>
              <p className="text-white/40 text-xs mt-1.5">Listed by bob_seller</p>

              {/* Pending verification badge */}
              <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-m3-surface-container/60 text-m3-outline text-[10px] font-medium backdrop-blur-sm border border-m3-outline/20">
                Pending AI Verification
              </div>
            </div>

            {/* Ticket details — overlapping card */}
            <div className="mx-4 -mt-8 mb-4">
              <div className="bg-m3-surface-container-high rounded-lg border border-m3-outline/15 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-m3-outline/10">
                  <h4 className="text-[10px] font-semibold text-m3-on-surface uppercase tracking-wider">Ticket Details</h4>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    <div>
                      <p className="text-[10px] text-m3-outline uppercase tracking-wider mb-0.5">Event</p>
                      <p className="text-sm text-m3-on-surface font-medium leading-snug">{form.eventName || 'Event Name'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-m3-outline uppercase tracking-wider mb-0.5">Section</p>
                      <p className="text-sm text-m3-on-surface font-medium">{form.section || 'Section'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-m3-outline uppercase tracking-wider mb-0.5">Tickets</p>
                      <p className="text-sm text-m3-on-surface font-medium">{form.quantity}x</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-m3-outline uppercase tracking-wider mb-0.5">Price per Ticket</p>
                      <p className="text-sm text-m3-on-surface font-medium">${form.price.toLocaleString()} USD</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price footer */}
            <div className="mx-4 mb-4 bg-m3-surface-container-high rounded-lg border border-m3-outline/15 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-m3-outline uppercase tracking-wider">Total Price</p>
                <p className="text-2xl font-heading font-bold text-m3-secondary mt-0.5">${totalPrice.toLocaleString()}</p>
                <p className="text-xs text-m3-outline">{form.quantity} ticket{form.quantity > 1 ? 's' : ''} &times; ${form.price.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className="px-3 py-1.5 rounded-lg bg-m3-surface-container text-m3-outline text-xs font-medium border border-m3-outline/20">
                  Buy (locked until verified)
                </div>
                <p className="text-[10px] text-m3-outline mt-1">USDT via WDK escrow</p>
              </div>
            </div>

            {/* Seller info */}
            <div className="mx-4 mb-4 flex items-center gap-3 px-4 py-3 bg-m3-surface-container-high rounded-lg border border-m3-outline/15">
              <span className="w-8 h-8 rounded-full bg-m3-tertiary/15 flex items-center justify-center text-m3-tertiary text-sm font-bold">B</span>
              <div>
                <p className="text-sm font-medium text-m3-on-surface">bob_seller</p>
                <p className="text-[10px] text-m3-outline">Seller on Ducket Resale</p>
              </div>
              <span className="ml-auto text-[10px] text-m3-outline bg-m3-surface-container px-2 py-1 rounded border border-m3-outline/15">Ducket</span>
            </div>

            {/* Trust strip */}
            <div className="px-4 py-3 border-t border-m3-outline/10 flex items-center justify-center gap-4">
              <span className="text-[10px] text-m3-outline flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-m3-tertiary" /> Escrow Protected
              </span>
              <span className="text-[10px] text-m3-outline flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-m3-tertiary" /> AI Verified
              </span>
              <span className="text-[10px] text-m3-outline flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-m3-tertiary" /> Instant Settle
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
