// Ducket AI Galactica — Listings Table
// Main table showing all scanned listings with expandable Agent Decision rows.
// Columns: Platform, Seller, Price, Face Value, Delta%, Classification, Confidence, Status
// Apache 2.0 License

import { useState } from 'react';
import { Listing } from '../types';
import { Badge } from './Badge';
import { ConfidenceBar } from './ConfidenceBar';
import { AgentDecisionPanel } from './AgentDecisionPanel';

interface ListingsTableProps {
  listings: Listing[];
}

export function ListingsTable({ listings }: ListingsTableProps) {
  // Track which listing row is expanded (by URL — unique per listing)
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

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
      <div className="flex items-center justify-center h-48 text-gray-500 animate-pulse">
        Waiting for scan cycle...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-bg-card text-gray-400 uppercase text-xs tracking-wider">
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
                className={`hover:bg-bg-card/70 cursor-pointer border-t border-gray-800 ${
                  idx % 2 === 1 ? 'bg-bg-card/30' : ''
                }`}
              >
                {/* Platform + source badge */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-white">{listing.platform}</span>
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                      listing.source === 'live'
                        ? 'bg-success/20 text-success'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {listing.source}
                  </span>
                </td>

                {/* Seller */}
                <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                  {listing.seller || '—'}
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-white">${listing.price.toLocaleString()}</td>

                {/* Face Value */}
                <td className="px-4 py-3 text-gray-400">${listing.faceValue.toLocaleString()}</td>

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
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {listing.classification?.actionTaken ?? 'pending'}
                </td>
              </tr>

              {/* Expandable Agent Decision Panel row */}
              {expandedUrl === listing.url && listing.classification && (
                <tr key={`${listing.url}-detail`} className="border-t border-accent/20">
                  <td colSpan={8} className="px-4 py-3 bg-bg-primary/50">
                    <AgentDecisionPanel classification={listing.classification} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
