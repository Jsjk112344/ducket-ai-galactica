// Ducket AI Galactica — Agent Decision Panel
// Expanded row detail: shows classification category, confidence, reasoning,
// multi-signal risk breakdown, action taken, and Etherscan link.
// Apache 2.0 License

import { Classification, RiskSignal } from '../types';
import { Badge } from './Badge';
import { ConfidenceBar } from './ConfidenceBar';

interface AgentDecisionPanelProps {
  classification: Classification;
}

/** Compact signal bar — shows score and one-line detail */
function SignalRow({ label, signal, icon }: { label: string; signal: RiskSignal; icon: string }) {
  // Color based on risk level
  const barColor =
    signal.score >= 60 ? 'bg-m3-error' :
    signal.score >= 35 ? 'bg-warn-orange' :
    'bg-m3-tertiary';
  const textColor =
    signal.score >= 60 ? 'text-m3-error' :
    signal.score >= 35 ? 'text-warn-orange' :
    'text-m3-tertiary';

  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-xs w-4 text-center mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs text-m3-on-surface-variant font-medium">{label}</span>
          <span className={`text-xs font-mono font-semibold ${textColor}`}>{signal.score}/100</span>
        </div>
        {/* Risk bar */}
        <div className="h-1 bg-m3-surface-container-highest rounded-full overflow-hidden mb-0.5">
          <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${signal.score}%` }} />
        </div>
        <p className="text-[11px] text-m3-outline leading-tight truncate" title={signal.detail}>{signal.detail}</p>
      </div>
    </div>
  );
}

export function AgentDecisionPanel({ classification }: AgentDecisionPanelProps) {
  const {
    category,
    confidence,
    reasoning,
    classificationSource,
    actionTaken,
    etherscanLink,
    signals,
  } = classification;

  // Color action taken based on outcome
  const actionColor =
    actionTaken === 'release'
      ? 'text-m3-tertiary'
      : actionTaken === 'slash'
      ? 'text-m3-error'
      : actionTaken === 'refund'
      ? 'text-warn-orange'
      : actionTaken === 'escrow_deposit'
      ? 'text-m3-error'
      : 'text-m3-on-surface';

  return (
    <div className="backdrop-blur-md bg-m3-surface-container/60 border border-m3-outline/20 rounded-xl p-5 space-y-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {/* Category */}
        <div>
          <span className="text-xs text-m3-outline uppercase tracking-wide">Category</span>
          <div className="mt-1">
            <Badge category={category} />
          </div>
        </div>

        {/* Confidence */}
        <div>
          <span className="text-xs text-m3-outline uppercase tracking-wide">Confidence</span>
          <div className="mt-1">
            <ConfidenceBar value={confidence} />
          </div>
        </div>

        {/* Multi-Signal Risk Breakdown */}
        {signals && (
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-m3-outline uppercase tracking-wide">Signal Breakdown</span>
              <span className="text-xs font-mono text-m3-secondary font-semibold">
                Composite: {signals.compositeRisk}/100
              </span>
            </div>
            <div className="bg-m3-surface-container-low/50 rounded-lg px-3 py-2 space-y-0.5 border border-m3-outline/10">
              <SignalRow label="Pricing Risk" signal={signals.pricingRisk} icon="$" />
              <SignalRow label="Seller Trust" signal={signals.sellerRisk} icon="@" />
              <SignalRow label="Listing Quality" signal={signals.listingRisk} icon="#" />
              <SignalRow label="Temporal Pattern" signal={signals.temporalRisk} icon="T" />
              <SignalRow label="Platform Trust" signal={signals.platformRisk} icon="P" />
            </div>
          </div>
        )}

        {/* Reasoning */}
        <div className="col-span-2">
          <span className="text-xs text-m3-outline uppercase tracking-wide">Reasoning</span>
          <p className="mt-1 text-m3-on-surface text-sm">{reasoning}</p>
        </div>

        {/* Classification Source */}
        <div>
          <span className="text-xs text-m3-outline uppercase tracking-wide">Classification Source</span>
          <p className="mt-1 text-m3-on-surface-variant text-sm">{classificationSource}</p>
        </div>

        {/* Action Taken (conditional) */}
        {actionTaken && (
          <div>
            <span className="text-xs text-m3-outline uppercase tracking-wide">Action Taken</span>
            <p className={`mt-1 text-sm font-semibold ${actionColor}`}>
              {actionTaken.replace(/_/g, ' ')}
            </p>
          </div>
        )}
      </div>

      {/* Etherscan link (conditional) */}
      {etherscanLink && (
        <div className="pt-1 border-t border-m3-outline/20">
          <span className="text-xs text-m3-outline uppercase tracking-wide">Escrow Contract (Sepolia)</span>
          <div className="mt-1">
            <a
              href={etherscanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-m3-secondary underline font-mono text-xs break-all"
            >
              View FraudEscrow on Etherscan
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
