// Ducket AI Galactica — Escrow Status
// Summary cards showing total scans, escrow deposits, releases, and active escrows.
// Reads from listings array — no separate API call needed.
// Apache 2.0 License

import { Listing, WalletInfo } from '../types';

interface EscrowStatusProps {
  listings: Listing[];
  wallet: WalletInfo | null;
}

interface StatCardProps {
  label: string;
  value: number | string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-bg-card rounded-lg p-4">
      <p className="text-2xl font-bold text-accent">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
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
          <p className="text-xs text-gray-500 uppercase tracking-wide">Escrow Contract</p>
          <p className="font-mono text-sm text-gray-300 mt-0.5">
            {wallet?.escrowContract ?? 'Contract address loading...'}
          </p>
        </div>
        <span className="bg-accent/20 text-accent text-xs px-3 py-1 rounded-full">
          Sepolia Testnet
        </span>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Scanned" value={totalScanned} />
        <StatCard label="Escrow Deposits" value={escrowDeposits} />
        <StatCard label="Releases" value={releases} />
        <StatCard label="Active Escrows" value={activeEscrows < 0 ? 0 : activeEscrows} />
      </div>

      {/* Empty state */}
      {totalScanned === 0 && (
        <p className="text-gray-500 text-sm animate-pulse">Waiting for scan cycle...</p>
      )}
    </div>
  );
}
