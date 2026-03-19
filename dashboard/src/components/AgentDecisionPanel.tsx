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

  // Color action taken based on outcome — release is good (green), deposit is bad (red)
  const actionColor =
    actionTaken === 'release'
      ? 'text-success'
      : actionTaken === 'escrow_deposit'
      ? 'text-warn-red'
      : 'text-gray-300';

  return (
    <div className="bg-bg-card/50 border border-accent/20 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {/* Category */}
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Category</span>
          <div className="mt-1">
            <Badge category={category} />
          </div>
        </div>

        {/* Confidence */}
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Confidence</span>
          <div className="mt-1">
            <ConfidenceBar value={confidence} />
          </div>
        </div>

        {/* Reasoning */}
        <div className="col-span-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Reasoning</span>
          <p className="mt-1 text-gray-300 text-sm">{reasoning}</p>
        </div>

        {/* Classification Source */}
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Classification Source</span>
          <p className="mt-1 text-gray-400 text-sm">{classificationSource}</p>
        </div>

        {/* Action Taken (conditional) */}
        {actionTaken && (
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Action Taken</span>
            <p className={`mt-1 text-sm font-semibold ${actionColor}`}>
              {actionTaken.replace(/_/g, ' ')}
            </p>
          </div>
        )}
      </div>

      {/* Etherscan link (conditional) */}
      {etherscanLink && (
        <div className="pt-1 border-t border-accent/10">
          <span className="text-xs text-gray-500 uppercase tracking-wide">On-Chain Evidence</span>
          <div className="mt-1">
            <a
              href={etherscanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline font-mono text-xs break-all"
            >
              {etherscanLink}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
