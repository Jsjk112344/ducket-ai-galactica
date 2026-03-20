// Ducket AI Galactica — Listings Table
// Main table showing all scanned listings with expandable Agent Decision rows.
// Columns: (chevron), Platform, Seller, Price, Face Value, Delta%, Classification, Confidence, Status
// Apache 2.0 License

import { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { Listing } from '../types';
import { Badge } from './Badge';
import { ConfidenceBar } from './ConfidenceBar';
import { AgentDecisionPanel } from './AgentDecisionPanel';
import { TrustBadges } from './TrustBadges';

interface ListingsTableProps {
  listings: Listing[];
}

// Seed listing URLs — used to default-expand the first seed row on load so
// judges immediately see AgentDecisionPanel with AI reasoning on page open.
const SEED_URLS = [
  'https://ducket.seed/listing/scalping-001',
  'https://ducket.seed/listing/scam-001',
  'https://ducket.seed/listing/counterfeit-001',
  'https://ducket.seed/listing/legitimate-001',
];

export function ListingsTable({ listings }: ListingsTableProps) {
  // Track which listing row is expanded (by URL — unique per listing)
  // Default to first seed listing so AgentDecisionPanel is visible on first load.
  const [expandedUrl, setExpandedUrl] = useState<string | null>(SEED_URLS[0]);

  function toggleRow(url: string) {
    setExpandedUrl((prev) => (prev === url ? null : url));
  }

  // Delta% color: > 100% markup = red, > 50% = orange, otherwise green
  function deltaColor(pct: number): string {
    if (pct > 100) return 'text-warn-red font-semibold';
    if (pct > 50) return 'text-warn-orange font-semibold';
    return 'text-success';
  }

  if (listings.length === 0) {
    return (
      <>
        <TrustBadges />
        <div className="flex items-center justify-center h-48 text-m3-outline animate-pulse">
          Waiting for scan cycle...
        </div>
      </>
    );
  }

  return (
    <>
      <TrustBadges />

      {/* Active Order Book header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-m3-on-surface tracking-tight">Active Order Book</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-m3-surface-container-high text-m3-on-surface-variant text-sm border border-m3-outline/20 hover:bg-m3-surface-container-highest transition-colors flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-m3-surface-container text-m3-outline uppercase text-xs tracking-wider">
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Face Value</th>
              <th className="px-4 py-3">Delta%</th>
              <th className="px-4 py-3">Classification</th>
              <th className="px-4 py-3 min-w-32">Confidence</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing, idx) => (
              <>
                <tr
                  key={listing.url}
                  onClick={() => toggleRow(listing.url)}
                  className={`hover:bg-m3-surface-container/50 cursor-pointer border-t border-m3-outline/10 transition-colors ${
                    idx % 2 === 1 ? 'bg-m3-surface-container-low/30' : ''
                  }`}
                >
                  {/* Chevron expand indicator */}
                  <td className="px-4 py-3">
                    <ChevronDown className={`w-4 h-4 text-m3-outline transition-transform duration-200 ${expandedUrl === listing.url ? 'rotate-180' : ''}`} />
                  </td>

                  {/* Platform + source badge */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-m3-on-surface">{listing.platform}</span>
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        listing.source === 'live'
                          ? 'bg-success/20 text-success'
                          : 'bg-m3-surface-container text-m3-outline'
                      }`}
                    >
                      {listing.source}
                    </span>
                  </td>

                  {/* Seller */}
                  <td className="px-4 py-3 text-m3-on-surface-variant font-mono text-xs">
                    {listing.seller || '—'}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-m3-on-surface">${listing.price.toLocaleString()}</td>

                  {/* Face Value */}
                  <td className="px-4 py-3 text-m3-on-surface-variant">${listing.faceValue.toLocaleString()}</td>

                  {/* Delta% */}
                  <td className={`px-4 py-3 ${deltaColor(listing.priceDeltaPct)}`}>
                    {listing.priceDeltaPct}%
                  </td>

                  {/* Classification Badge */}
                  <td className="px-4 py-3">
                    <Badge category={listing.classification?.category ?? 'PENDING'} />
                  </td>

                  {/* Confidence Bar */}
                  <td className="px-4 py-3 min-w-32">
                    <ConfidenceBar value={listing.classification?.confidence ?? 0} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-m3-on-surface-variant text-xs">
                    {listing.classification?.actionTaken ?? 'pending'}
                  </td>
                </tr>

                {/* Expandable Agent Decision Panel row */}
                {expandedUrl === listing.url && listing.classification && (
                  <tr key={`${listing.url}-detail`} className="border-t border-m3-outline/10">
                    <td colSpan={9} className="px-4 py-3 bg-m3-surface-container/60 backdrop-blur-sm border-t border-m3-outline/10">
                      <AgentDecisionPanel classification={listing.classification} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
