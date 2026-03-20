// Ducket AI Galactica — Escrow Status
// Summary cards showing total scans, escrow deposits, releases, and active escrows.
// Reads from listings array — no separate API call needed.
// Apache 2.0 License

import { Listing, WalletInfo } from '../types';
import { Shield } from 'lucide-react';

interface EscrowStatusProps {
  listings: Listing[];
  wallet: WalletInfo | null;
}

interface StatCardProps {
  label: string;
  value: number | string;
  highlight?: boolean;
  colorClass: string;
  bgClass: string;
  progress?: number;
}

// bgClass must be passed as a literal string (e.g. "bg-m3-primary") — never constructed
// dynamically via .replace() because Tailwind v4 purges dynamically-constructed class names.
function StatCard({ label, value, colorClass, bgClass, progress }: StatCardProps) {
  return (
    <div className={`bg-m3-surface-container rounded-lg p-4 border-l-4 ${colorClass}`}>
      <p className="text-xs text-m3-outline uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-m3-on-surface">{value}</p>
      {progress !== undefined && (
        <div className="mt-2 h-1 bg-m3-surface-container-highest rounded-full">
          <div
            className={`h-1 rounded-full transition-all duration-500 ${bgClass}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function EscrowStatus({ listings, wallet }: EscrowStatusProps) {
  const totalScanned = listings.length;

  const escrowDeposits = listings.filter(
    (l) => l.classification?.actionTaken === 'escrow_deposit'
  ).length;

  const releases = listings.filter(
    (l) => l.classification?.actionTaken === 'release'
  ).length;

  const activeEscrows = escrowDeposits - releases;

  return (
    <div className="space-y-6">
      {/* Header row: escrow contract + network badge */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-m3-outline uppercase tracking-wide">Escrow Contract</p>
          <p className="font-mono text-sm text-m3-on-surface mt-0.5">
            {wallet?.escrowContract ?? 'Contract address loading...'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-m3-primary-container text-m3-primary text-xs px-3 py-1 rounded-full border border-m3-primary/40">
          <Shield className="w-3 h-3" />
          Sepolia Testnet
        </span>
      </div>

      {/* Summary stat cards — border-l-4 color coding per M3 palette */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Scanned" value={totalScanned} colorClass="border-m3-primary" bgClass="bg-m3-primary" progress={Math.min(100, totalScanned * 10)} />
        <StatCard label="Escrow Deposits" value={escrowDeposits} highlight colorClass="border-m3-secondary" bgClass="bg-m3-secondary" progress={totalScanned > 0 ? (escrowDeposits / totalScanned) * 100 : 0} />
        <StatCard label="Releases" value={releases} colorClass="border-m3-tertiary" bgClass="bg-m3-tertiary" progress={escrowDeposits > 0 ? (releases / escrowDeposits) * 100 : 0} />
        <StatCard label="Active Escrows" value={activeEscrows < 0 ? 0 : activeEscrows} highlight colorClass="border-m3-error" bgClass="bg-m3-error" progress={escrowDeposits > 0 ? ((activeEscrows < 0 ? 0 : activeEscrows) / escrowDeposits) * 100 : 0} />
      </div>

      {/* Empty state */}
      {totalScanned === 0 && (
        <p className="text-m3-outline text-sm animate-pulse">Waiting for scan cycle...</p>
      )}
    </div>
  );
}
