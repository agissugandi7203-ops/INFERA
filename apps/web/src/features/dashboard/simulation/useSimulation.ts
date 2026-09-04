import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  JknClaimRecord,
  SimulationScenarioPreset,
  SimulationConfig,
  SimulationStats,
  FraudTypology,
  RiskLevel,
} from '@healthathon/shared';
import { generateClaimByScenario } from './claimGenerator';

const INITIAL_CONFIG: SimulationConfig = {
  speedMs: 2500, // 2.5s default
  scenario: 'ALL_RANDOM',
  anomalyRate: 0.5,
  isPaused: false,
};

const INITIAL_STATS: SimulationStats = {
  totalClaims: 0,
  totalAnomalies: 0,
  totalDjsLossAmount: 0,
  totalVerifiedAmount: 0,
  typologyCounts: {
    NORMAL: 0,
    PHANTOM_BILLING: 0,
    UPCODING: 0,
    SERVICES_UNBUNDLING: 0,
    INAPPROPRIATE_READMISSION: 0,
    SELF_REFERRAL: 0,
    NO_MEDICAL_NECESSITY: 0,
    CLONING_CLAIM: 0,
    BALANCE_BILLING: 0,
  },
  riskCounts: {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  },
};

export function useSimulation(onAnomalyDetected?: (claim: JknClaimRecord) => void) {
  const [config, setConfig] = useState<SimulationConfig>(INITIAL_CONFIG);
  const [claims, setClaims] = useState<JknClaimRecord[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<JknClaimRecord | null>(null);
  const [stats, setStats] = useState<SimulationStats>(INITIAL_STATS);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onAnomalyRef = useRef(onAnomalyDetected);
  onAnomalyRef.current = onAnomalyDetected;

  const emitNewClaim = useCallback(() => {
    const newClaim = generateClaimByScenario(config.scenario);

    setClaims((prev) => [newClaim, ...prev.slice(0, 49)]); // Keep last 50 claims

    setStats((prev) => {
      const nextStats = { ...prev };
      nextStats.totalClaims += 1;

      if (newClaim.isAnomaly) {
        nextStats.totalAnomalies += 1;
        nextStats.totalDjsLossAmount += newClaim.cbgTariff;
      } else {
        nextStats.totalVerifiedAmount += newClaim.cbgTariff;
      }

      nextStats.typologyCounts[newClaim.fraudTypology] =
        (nextStats.typologyCounts[newClaim.fraudTypology] || 0) + 1;

      nextStats.riskCounts[newClaim.riskLevel] =
        (nextStats.riskCounts[newClaim.riskLevel] || 0) + 1;

      return nextStats;
    });

    if (newClaim.isAnomaly && onAnomalyRef.current) {
      onAnomalyRef.current(newClaim);
    }
  }, [config.scenario]);

  useEffect(() => {
    if (config.isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      emitNewClaim();
    }, config.speedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config.isPaused, config.speedMs, emitNewClaim]);

  // Initial seed of 3 claims if empty
  useEffect(() => {
    if (claims.length === 0) {
      emitNewClaim();
    }
  }, []);

  const setScenario = (scenario: SimulationScenarioPreset) => {
    setConfig((prev) => ({ ...prev, scenario }));
  };

  const setSpeed = (speedMs: number) => {
    setConfig((prev) => ({ ...prev, speedMs }));
  };

  const togglePause = () => {
    setConfig((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetSimulation = () => {
    setClaims([]);
    setStats(INITIAL_STATS);
    emitNewClaim();
  };

  return {
    claims,
    selectedClaim,
    setSelectedClaim,
    stats,
    config,
    setScenario,
    setSpeed,
    togglePause,
    resetSimulation,
    emitNewClaim,
  };
}
