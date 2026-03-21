// Ducket AI Galactica — Main Dashboard
// Single-page tabbed dashboard: Listings, Escrow, Wallet.
// All data auto-refreshes every 10 seconds via polling hooks.
// Apache 2.0 License

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useListings } from './hooks/useListings';
import { useWallet } from './hooks/useWallet';
import { useResaleFlow } from './hooks/useResaleFlow';
import { ListingsTable } from './components/ListingsTable';
import { EscrowStatus } from './components/EscrowStatus';
import { WalletInspector } from './components/WalletInspector';
import { ResaleFlowPanel } from './components/ResaleFlowPanel';

type Tab = 'resale' | 'listings' | 'escrow' | 'wallet';

const TABS: { id: Tab; label: string }[] = [
  { id: 'resale', label: 'Resale Flow' },
  { id: 'listings', label: 'Listings' },
  { id: 'escrow', label: 'Escrow' },
  { id: 'wallet', label: 'Wallet' },
];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('resale');
  const { listings, loading: listingsLoading } = useListings();
  const { wallet, loading: walletLoading } = useWallet();
  // Resale flow state lifted to App level — survives tab switches
  const resaleFlow = useResaleFlow();

  return (
    <div className="min-h-screen bg-m3-surface">
      {/* Fixed top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-m3-surface/90 backdrop-blur-md border-b border-m3-outline/20 h-14 flex items-center px-6">
        <img src="/images/logomark.png" className="h-7 w-auto mr-3" alt="Ducket" />
        <span className="font-heading font-bold text-m3-primary text-lg">DUCKET AI</span>
        <span className="ml-2 text-xs bg-m3-surface-container text-m3-outline px-2 py-0.5 rounded-full border border-m3-outline/30 font-mono">v2.0</span>
        <div className="flex-1" />
        {/* Nav links — styled as tabs in the nav */}
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-m3-primary-container text-m3-primary'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-surface-container'
              }`}
            >
              {tab.label}
              {tab.id === 'listings' && !listingsLoading && (
                <span className="ml-1.5 text-xs opacity-70">({listings.length})</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="pt-14">
        {/* Hero */}
        <div className="ducket-hero-gradient px-6 py-8 border-b border-m3-outline/10">
          <div className="max-w-7xl mx-auto flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <img src="/images/Logo_2.png" className="h-9 w-auto" alt="Ducket" />
              </div>
              <h1 className="text-4xl font-black text-m3-on-surface tracking-tighter">DUCKET AI</h1>
              <p className="text-m3-secondary text-sm mt-1">Safe P2P event ticket resale — trustless, AI-verified, on-chain</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-m3-tertiary rounded-full animate-pulse" />
              <span className="text-xs text-m3-outline">Node Active</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Tab content area */}
          <div className="bg-m3-surface-container rounded-xl p-5 border border-m3-outline/10">
            {activeTab === 'resale' && (
              <ResaleFlowPanel
                step={resaleFlow.step}
                listing={resaleFlow.listing}
                lockResult={resaleFlow.lockResult}
                wallet={wallet}
                isBlocked={resaleFlow.isBlocked}
                submitListing={resaleFlow.submitListing}
                lockFunds={resaleFlow.lockFunds}
                advance={resaleFlow.advance}
                reset={resaleFlow.reset}
              />
            )}
            {activeTab === 'listings' && <ListingsTable listings={listings} />}
            {activeTab === 'escrow' && <EscrowStatus listings={listings} wallet={wallet} />}
            {activeTab === 'wallet' && <WalletInspector wallet={wallet} loading={walletLoading} />}
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-3 opacity-60">
            <img src="/images/logomark.png" alt="" className="h-5 w-auto opacity-50" />
            <p className="text-m3-outline text-xs">Trustless P2P resale — Powered by WDK + Claude AI</p>
          </div>
        </div>
      </div>

      {/* FAB — New Listing */}
      <button
        onClick={() => setActiveTab('resale')}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-m3-secondary text-black shadow-lg shadow-m3-secondary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        title="New Listing"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
