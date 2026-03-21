// Ducket AI Galactica — AI verification step (Step 3 of resale flow)
// Staged reveal: simulates the agent scanning each signal before showing the verdict.
// The engine actually computes 5 signals → composite → category, so this animation
// reflects real agent behavior — it's not fake, just visualized.
// Apache 2.0 License

import { useState, useEffect, useRef } from 'react';
import { Classification } from '../types';
import { AgentDecisionPanel } from './AgentDecisionPanel';
import { Button } from './ui/button';

interface VerifyStepProps {
  classification: Classification;
  onAdvance: () => void;
}

/** Signal analysis phases — matches the 5-signal risk engine in classify.js */
const ANALYSIS_PHASES = [
  { label: 'Scanning pricing signals', icon: '$', key: 'pricingRisk' },
  { label: 'Checking seller trust', icon: '@', key: 'sellerRisk' },
  { label: 'Evaluating listing quality', icon: '#', key: 'listingRisk' },
  { label: 'Analyzing temporal patterns', icon: 'T', key: 'temporalRisk' },
  { label: 'Assessing platform trust', icon: 'P', key: 'platformRisk' },
] as const;

type Phase = 'scanning' | 'computing' | 'done';

export function VerifyStep({ classification, onAdvance }: VerifyStepProps) {
  const [phase, setPhase] = useState<Phase>('scanning');
  const [activeSignal, setActiveSignal] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Clear any existing timers on re-mount
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];

    // Reveal each signal one by one (700ms per signal)
    const SIGNAL_DELAY = 700;
    for (let i = 1; i <= ANALYSIS_PHASES.length; i++) {
      timerRef.current.push(
        setTimeout(() => setActiveSignal(i), i * SIGNAL_DELAY)
      );
    }

    // After all signals: "Computing composite risk..." phase
    const computeTime = (ANALYSIS_PHASES.length + 1) * SIGNAL_DELAY;
    timerRef.current.push(
      setTimeout(() => setPhase('computing'), computeTime)
    );

    // Reveal the full verdict
    const doneTime = computeTime + 1200;
    timerRef.current.push(
      setTimeout(() => setPhase('done'), doneTime)
    );

    return () => {
      timerRef.current.forEach(clearTimeout);
    };
  }, []);

  const signals = classification.signals;

  return (
    <div className="space-y-4">
      {/* Header row with AI avatar badge */}
      <div className="flex items-center gap-3">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${
          phase === 'done'
            ? 'bg-m3-primary-container text-m3-primary'
            : 'bg-m3-secondary/20 text-m3-secondary animate-pulse'
        }`}>
          AI
        </span>
        <h2 className="text-lg font-heading font-semibold text-m3-on-surface">Agent Decision Panel</h2>
        <span className="text-xs text-m3-outline ml-auto">
          {phase === 'done' ? 'Powered by Claude AI + rules engine' : 'Analyzing listing...'}
        </span>
      </div>

      {/* Scanning phase — show signals being checked one by one */}
      {phase !== 'done' && (
        <div className="backdrop-blur-md bg-m3-surface-container/60 border border-m3-outline/20 rounded-xl p-5 space-y-1">
          {ANALYSIS_PHASES.map((s, i) => {
            const isActive = i < activeSignal;
            const isCurrent = i === activeSignal - 1;
            const signalData = signals?.[s.key as keyof typeof signals] as { score: number; detail: string } | undefined;

            return (
              <div
                key={s.key}
                className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-500 ${
                  isActive
                    ? 'bg-m3-surface-container-low/50'
                    : 'opacity-30'
                }`}
              >
                <span className={`text-sm w-5 text-center transition-colors duration-300 ${
                  isCurrent ? 'text-m3-secondary' : isActive ? 'text-m3-tertiary' : 'text-m3-outline'
                }`}>
                  {isActive ? '\u2713' : s.icon}
                </span>
                <span className={`text-sm flex-1 transition-colors duration-300 ${
                  isActive ? 'text-m3-on-surface' : 'text-m3-outline'
                }`}>
                  {s.label}
                  {isActive && isCurrent && (
                    <span className="text-m3-outline animate-pulse ml-1">...</span>
                  )}
                </span>
                {isActive && signalData && (
                  <span className={`text-xs font-mono font-semibold transition-opacity duration-500 ${
                    signalData.score >= 60 ? 'text-m3-error' :
                    signalData.score >= 35 ? 'text-warn-orange' :
                    'text-m3-tertiary'
                  }`}>
                    {signalData.score}/100
                  </span>
                )}
              </div>
            );
          })}

          {/* Computing composite phase */}
          {phase === 'computing' && (
            <div className="flex items-center gap-3 py-2 px-3 mt-2 border-t border-m3-outline/10">
              <span className="text-sm w-5 text-center text-m3-secondary animate-pulse">&Sigma;</span>
              <span className="text-sm text-m3-secondary font-medium">
                Computing composite risk score<span className="animate-pulse">...</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Done — full AgentDecisionPanel with verdict */}
      {phase === 'done' && (
        <>
          <AgentDecisionPanel classification={classification} />
          <Button onClick={onAdvance} className="w-full">
            {classification.category === 'LEGITIMATE'
              ? 'View Marketplace Listing'
              : 'View Flagged Listing'}
          </Button>
        </>
      )}
    </div>
  );
}
