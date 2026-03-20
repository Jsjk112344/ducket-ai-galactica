// Ducket AI Galactica — Settlement outcome step (Step 4 of resale flow)
// Displays color-coded outcome label (release/refund/slash) and Etherscan tx link.
// Outcome is derived from Classification.actionTaken set by the AI enforcement agent.
// Apache 2.0 License

import { Classification } from '../types';
import { Card, CardContent } from './ui/card';
import { EtherscanLink } from './EtherscanLink';

// Maps action key to display config — M3 Celestial Ledger color tokens
const OUTCOME_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  release: {
    label: 'RELEASED to seller',
    color: 'text-m3-tertiary',
    bg: 'bg-m3-tertiary/10 border-m3-tertiary/30',
  },
  refund: {
    label: 'REFUNDED to buyer',
    color: 'text-warn-yellow',
    bg: 'bg-warn-yellow/10 border-warn-yellow/30',
  },
  slash: {
    label: 'SLASHED to bounty pool',
    color: 'text-m3-error',
    bg: 'bg-m3-error/10 border-m3-error/30',
  },
  escrow_deposit: {
    label: 'PENDING settlement',
    color: 'text-m3-outline',
    bg: 'bg-m3-surface-container border-m3-outline/30',
  },
};

interface SettleStepProps {
  classification: Classification;
}

export function SettleStep({ classification }: SettleStepProps) {
  // Derive the outcome key from actionTaken (set by the AI agent enforcement)
  const action = classification.actionTaken ?? 'escrow_deposit';
  const outcomeKey = action.toLowerCase().includes('release')
    ? 'release'
    : action.toLowerCase().includes('refund')
    ? 'refund'
    : action.toLowerCase().includes('slash')
    ? 'slash'
    : 'escrow_deposit';
  const config = OUTCOME_CONFIG[outcomeKey];

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h2 className="text-lg font-heading font-semibold text-m3-on-surface">Settlement Outcome</h2>

        {/* Color-coded outcome card */}
        <div className={`border rounded-lg p-4 ${config.bg}`}>
          <p className={`text-xl font-bold ${config.color}`}>{config.label}</p>
          <p className="text-m3-outline text-sm mt-1">Category: {classification.category}</p>
        </div>

        {/* On-chain transaction link — shown when Etherscan hash is available */}
        {classification.etherscanLink && (
          <div>
            <p className="text-xs text-m3-outline uppercase tracking-wide mb-1">On-Chain Transaction</p>
            <EtherscanLink href={classification.etherscanLink} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
