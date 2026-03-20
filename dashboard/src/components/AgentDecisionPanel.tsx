// Ducket AI Galactica — Agent Decision Panel
// Expanded row detail: shows classification category, confidence, reasoning,
// action taken, and Etherscan link for on-chain evidence.
// Apache 2.0 License

import { Classification } from '../types';
import { Badge } from './Badge';
import { ConfidenceBar } from './ConfidenceBar';

interface AgentDecisionPanelProps {
  classification: Classification;
}

export function AgentDecisionPanel({ classification }: AgentDecisionPanelProps) {
  const {
    category,
    confidence,
    reasoning,
    classificationSource,
    actionTaken,
    etherscanLink,
  } = classification;

  // Color action taken based on outcome — release is good (teal), deposit is bad (red)
  const actionColor =
    actionTaken === 'release'
      ? 'text-m3-tertiary'
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
          <span className="text-xs text-m3-outline uppercase tracking-wide">On-Chain Evidence</span>
          <div className="mt-1">
            <a
              href={etherscanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-m3-secondary underline font-mono text-xs break-all"
            >
              {etherscanLink}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
