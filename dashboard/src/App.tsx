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
    <div className="min-h-screen bg-bg-primary p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Ducket AI Galactica</h1>
        <p className="text-gray-400 mt-1">Autonomous Fraud Detection Agent</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-accent text-white'
                : 'bg-bg-card text-gray-400 hover:text-gray-200'
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
      <div className="text-xs text-gray-500 mb-4">
        {listingsLoading
          ? 'Loading...'
          : lastUpdated
          ? `Last updated: ${lastUpdated.toLocaleTimeString()} — auto-refreshes every 10s`
          : 'No data yet'}
      </div>

      {/* Tab content area */}
      <div className="bg-bg-card/20 rounded-b-lg rounded-tr-lg p-4">
        {activeTab === 'listings' && <ListingsTable listings={listings} />}
        {activeTab === 'escrow' && <EscrowStatus listings={listings} wallet={wallet} />}
        {activeTab === 'wallet' && <WalletInspector wallet={wallet} loading={walletLoading} />}
      </div>

      {/* Footer */}
      <p className="text-gray-600 text-xs text-center mt-8">
        Powered by WDK + Claude AI
      </p>
    </div>
  );
}
