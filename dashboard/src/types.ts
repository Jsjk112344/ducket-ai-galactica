// Ducket AI Galactica — Shared TypeScript type contracts
// Used by both the Express API (server/api.ts) and React components

export interface RiskSignal {
  score: number;   // 0-100, higher = riskier
  detail: string;  // human-readable explanation of this signal's contribution
}

export interface RiskSignals {
  pricingRisk: RiskSignal;
  sellerRisk: RiskSignal;
  listingRisk: RiskSignal;
  temporalRisk: RiskSignal;
  platformRisk: RiskSignal;
  compositeRisk: number;  // weighted aggregate 0-100
}

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
  source: 'mock' | 'live' | 'form' | 'seed';
  // Extended signals for multi-signal classification
  sellerAge?: number;          // account age in days
  sellerTransactions?: number; // completed transaction count
  sellerVerified?: boolean;    // platform-verified seller
  listingDescription?: string; // seller's description text
  transferMethod?: string;     // 'verified_transfer' | 'email_transfer' | 'screenshot' | 'will_email' | 'dm_only' | 'unspecified'
  eventDemand?: string;        // 'sold_out' | 'high' | 'moderate' | 'low'
  matchRound?: string;
  venue?: string;
  matchDate?: string;
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
  signals?: RiskSignals;
}

export interface WalletInfo {
  address: string;
  ethBalance: string;
  usdtBalance: string;
  escrowContract: string;
  custodyType: string;
  network: string;
}
