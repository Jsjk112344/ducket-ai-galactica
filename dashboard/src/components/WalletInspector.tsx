// Ducket AI Galactica — Wallet Inspector
// Displays WDK wallet address, ETH/USDT balances, escrow contract, and non-custodial badge.
// Apache 2.0 License

import { WalletInfo } from '../types';

interface WalletInspectorProps {
  wallet: WalletInfo | null;
  loading: boolean;
}

export function WalletInspector({ wallet, loading }: WalletInspectorProps) {
  if (loading) {
    return (
      <div className="bg-bg-card rounded-lg p-6 animate-pulse text-gray-500">
        Connecting to Sepolia...
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="bg-warn-red/10 border border-warn-red/30 rounded-lg p-6 text-warn-red text-sm">
        Wallet unavailable — check SEPOLIA_RPC_URL
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-lg p-6 space-y-5">
      {/* Row 1: Wallet address + non-custodial badge */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Wallet Address</p>
        <div className="flex items-center flex-wrap gap-2">
          <p className="font-mono text-sm text-gray-300 break-all">{wallet.address}</p>
          <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">
            client-side only (WDK non-custodial)
          </span>
        </div>
      </div>

      {/* Row 2: Balance grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bg-primary/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">ETH Balance</p>
          <p className="font-mono text-lg text-white">
            {parseFloat(wallet.ethBalance).toFixed(4)} ETH
          </p>
        </div>
        <div className="bg-bg-primary/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">USDT Balance</p>
          <p className="font-mono text-lg text-white">
            {parseFloat(wallet.usdtBalance).toFixed(2)} USDT
          </p>
        </div>
      </div>

      {/* Row 3: Escrow contract */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Escrow Contract</p>
        <p className="font-mono text-xs text-gray-400 break-all">{wallet.escrowContract}</p>
      </div>

      {/* Row 4: Network with green dot indicator */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Network</p>
        <span className="flex items-center gap-1.5 text-success text-sm">
          <span className="w-2 h-2 bg-success rounded-full inline-block" />
          {wallet.network}
        </span>
      </div>
    </div>
  );
}
