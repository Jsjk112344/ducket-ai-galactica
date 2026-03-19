// Ducket AI Galactica — Wallet Inspector
// Displays WDK wallet address, ETH/USDT balances, escrow contract, and non-custodial badge.
// Apache 2.0 License

import { WalletInfo } from '../types';
import { Lock, Wallet } from 'lucide-react';

interface WalletInspectorProps {
  wallet: WalletInfo | null;
  loading: boolean;
}

export function WalletInspector({ wallet, loading }: WalletInspectorProps) {
  if (loading) {
    return (
      <div className="bg-bg-card rounded-lg p-6 animate-pulse text-muted-foreground border border-brand-primary/20">
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
    <div className="bg-bg-card rounded-lg p-6 space-y-5 border border-brand-primary/20">
      {/* Row 1: Wallet address + non-custodial badge */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Wallet Address</p>
        <div className="flex items-center flex-wrap gap-2">
          <p className="font-mono text-sm text-foreground break-all">{wallet.address}</p>
          <span className="inline-flex items-center gap-1.5 bg-brand-primary text-brand-accent text-xs px-2.5 py-0.5 rounded-full ml-2 whitespace-nowrap border border-brand-accent/30">
            <Lock className="w-3 h-3" />
            WDK non-custodial
          </span>
        </div>
      </div>

      {/* Row 2: Balance grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bg-primary/50 rounded-lg p-4 border border-brand-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-brand-accent" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">ETH Balance</p>
          </div>
          <p className="font-mono text-xl text-white font-bold">
            {parseFloat(wallet.ethBalance).toFixed(4)} <span className="text-brand-accent text-sm">ETH</span>
          </p>
        </div>
        <div className="bg-bg-primary/50 rounded-lg p-4 border border-brand-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-brand-accent" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">USDT Balance</p>
          </div>
          <p className="font-mono text-xl text-white font-bold">
            {parseFloat(wallet.usdtBalance).toFixed(2)} <span className="text-brand-accent text-sm">USDT</span>
          </p>
        </div>
      </div>

      {/* Row 3: Escrow contract */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Escrow Contract</p>
        <p className="font-mono text-xs text-muted-foreground break-all">{wallet.escrowContract}</p>
      </div>

      {/* Row 4: Network with green dot indicator */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Network</p>
        <span className="flex items-center gap-1.5 text-success text-sm">
          <span className="w-2 h-2 bg-success rounded-full inline-block animate-pulse" />
          {wallet.network}
        </span>
      </div>
    </div>
  );
}
