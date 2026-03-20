// Ducket AI Galactica — Shared TypeScript type contracts
// Used by both the Express API (server/api.ts) and React components

export interface Listing {
  platform: string;
  seller: string;
  price: number;
  faceValue: number;
  priceDeltaPct: number;
  url: string;
  listingDate: string;
  redFlags: string[];
  eventName: string;
  section: string | null;
  quantity: number;
  source: 'mock' | 'live' | 'form';
  // Populated by API from case file if it exists (agent ran enforcement on this listing)
  classification?: Classification;
}

export interface Classification {
  category: 'SCALPING_VIOLATION' | 'LIKELY_SCAM' | 'COUNTERFEIT_RISK' | 'LEGITIMATE';
  confidence: number;
  reasoning: string;
  classificationSource: string;
  actionTaken?: string;
  etherscanLink?: string;
}

export interface WalletInfo {
  address: string;
  ethBalance: string;
  usdtBalance: string;
  escrowContract: string;
  custodyType: string;
  network: string;
}
