// Ducket AI Galactica — AI verification step (Step 3 of resale flow)
// Full-width AgentDecisionPanel with AI avatar header and advance button.
// Classification.reasoning must be 50+ words — enforced by API seed data.
// Apache 2.0 License

import { Classification } from '../types';
import { AgentDecisionPanel } from './AgentDecisionPanel';
import { Button } from './ui/button';

interface VerifyStepProps {
  classification: Classification;
  onAdvance: () => void;
}

export function VerifyStep({ classification, onAdvance }: VerifyStepProps) {
  return (
    <div className="space-y-4">
      {/* Header row with AI avatar badge */}
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-m3-primary-container flex items-center justify-center text-m3-primary font-bold text-sm">
          AI
        </span>
        <h2 className="text-lg font-heading font-semibold text-m3-on-surface">Agent Decision Panel</h2>
        <span className="text-xs text-m3-outline ml-auto">Powered by Claude AI + rules engine</span>
      </div>

      {/* Full classification detail from the agent */}
      <AgentDecisionPanel classification={classification} />

      <Button onClick={onAdvance} className="w-full">
        View Settlement Outcome
      </Button>
    </div>
  );
}
