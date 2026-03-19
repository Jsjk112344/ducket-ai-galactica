// Ducket AI Galactica — Main Dashboard
// Single-page tabbed dashboard: Listings, Escrow, Wallet.
// All data auto-refreshes every 10 seconds via polling hooks.
// Apache 2.0 License

import { useState } from 'react';
import { useListings } from './hooks/useListings';
import { useWallet } from './hooks/useWallet';
import { ListingsTable } from './components/ListingsTable';
import { EscrowStatus } from './components/EscrowStatus';
import { WalletInspector } from './components/WalletInspector';

type Tab = 'listings' | 'escrow' | 'wallet';

const TABS: { id: Tab; label: string }[] = [
  { id: 'listings', label: 'Listings' },
  { id: 'escrow', label: 'Escrow' },
  { id: 'wallet', label: 'Wallet' },
];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const { listings, lastUpdated, loading: listingsLoading } = useListings();
  const { wallet, loading: walletLoading } = useWallet();

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero header with gradient + logo */}
      <div className="ducket-hero-gradient border-b border-brand-primary/30">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <img
              src="/images/logomark.png"
              alt="Ducket"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Ducket</h1>
              <p className="text-brand-accent/80 text-sm font-medium">
                Safe P2P ticket resale — buyer protected by escrow
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 mb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-t border-x ${
                activeTab === tab.id
                  ? 'bg-brand-primary border-brand-primary/60 text-brand-accent shadow-[0_-2px_10px_hsl(263_50%_30%/0.3)]'
                  : 'bg-bg-card/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-bg-card'
              }`}
            >
              {tab.label}
              {tab.id === 'listings' && !listingsLoading && (
                <span className="ml-2 text-xs opacity-70">({listings.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Last updated timestamp */}
        <div className="text-xs text-muted-foreground mb-4 pl-1">
          {listingsLoading
            ? 'Loading...'
            : lastUpdated
            ? `Last updated: ${lastUpdated.toLocaleTimeString()} — auto-refreshes every 10s`
            : 'No data yet'}
        </div>

        {/* Tab content area */}
        <div className="ducket-card rounded-b-lg rounded-tr-lg p-5">
          {activeTab === 'listings' && <ListingsTable listings={listings} />}
          {activeTab === 'escrow' && <EscrowStatus listings={listings} wallet={wallet} />}
          {activeTab === 'wallet' && <WalletInspector wallet={wallet} loading={walletLoading} />}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-center gap-3 opacity-60">
          <img src="/images/logomark.png" alt="" className="h-5 w-auto opacity-50" />
          <p className="text-muted-foreground text-xs">
            Powered by WDK + Claude AI
          </p>
        </div>
      </div>
    </div>
  );
}
