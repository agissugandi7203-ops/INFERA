import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { JknClaimRecord, SimulationStats } from '@healthathon/shared';
import {
  generateClaimByScenario,
  generateNormalClaim,
  generateParticipantDoctorShoppingClaim,
} from './claimGenerator';

interface SimulationContextType {
  claims: JknClaimRecord[];
  anomalies: JknClaimRecord[];
  latestAnomaly: JknClaimRecord | null;
  stats: SimulationStats;
  isPaused: boolean;
  intervalSec: number;
  togglePause: () => void;
  setIntervalSec: (sec: number) => void;
  triggerManualClaim: () => void;
  selectedClaimForAudit: JknClaimRecord | null;
  setSelectedClaimForAudit: (claim: JknClaimRecord | null) => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

const BASE_CLAIMS_COUNT = 42180;
const BASE_ANOMALIES_COUNT = 1485;
const BASE_SAVINGS_AMOUNT = 2450000000;

export const SimulationProvider: React.FC<{
  children: React.ReactNode;
  onAnomalyDetected?: (claim: JknClaimRecord) => void;
}> = ({ children, onAnomalyDetected }) => {
  const [claims, setClaims] = useState<JknClaimRecord[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [intervalSec, setIntervalSec] = useState<number>(10);
  const [selectedClaimForAudit, setSelectedClaimForAudit] = useState<JknClaimRecord | null>(null);

  const [stats, setStats] = useState<SimulationStats>({
    totalClaims: BASE_CLAIMS_COUNT,
    totalAnomalies: BASE_ANOMALIES_COUNT,
    totalDjsLossAmount: BASE_SAVINGS_AMOUNT,
    totalVerifiedAmount: 38700000000,
    typologyCounts: {
      NORMAL: BASE_CLAIMS_COUNT - BASE_ANOMALIES_COUNT,
      PHANTOM_BILLING: 160,
      UPCODING: 210,
      SERVICES_UNBUNDLING: 432,
      INAPPROPRIATE_READMISSION: 172,
      SELF_REFERRAL: 130,
      NO_MEDICAL_NECESSITY: 381,
      CLONING_CLAIM: 0,
      BALANCE_BILLING: 0,
    },
    riskCounts: {
      LOW: BASE_CLAIMS_COUNT - BASE_ANOMALIES_COUNT,
      MEDIUM: 580,
      HIGH: 621,
      CRITICAL: 284,
    },
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onAnomalyRef = useRef(onAnomalyDetected);
  onAnomalyRef.current = onAnomalyDetected;

  const emitNewClaim = useCallback(() => {
    const newClaim = generateClaimByScenario('ALL_RANDOM');

    setClaims((prev) => [newClaim, ...prev.slice(0, 79)]); // Keep last 80 claims

    setStats((prev) => {
      const next = { ...prev };
      next.totalClaims += 1;
      if (newClaim.isAnomaly) {
        next.totalAnomalies += 1;
        next.totalDjsLossAmount += newClaim.cbgTariff;
      } else {
        next.totalVerifiedAmount += newClaim.cbgTariff;
      }
      return next;
    });

    if (newClaim.isAnomaly && onAnomalyRef.current) {
      onAnomalyRef.current(newClaim);
    }
  }, []);

  // Initial seed: 7 clean verified claims + 1 benchmark case for audit
  useEffect(() => {
    if (claims.length === 0) {
      const initialBatch: JknClaimRecord[] = [];
      for (let i = 0; i < 7; i++) {
        initialBatch.push(generateNormalClaim());
      }
      initialBatch.push(generateParticipantDoctorShoppingClaim());
      setClaims(initialBatch);
      const firstAnomaly = initialBatch.find((c) => c.isAnomaly);
      if (firstAnomaly) setSelectedClaimForAudit(firstAnomaly);
    }
  }, [claims.length]);

  // Live Interval Ticker
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      emitNewClaim();
    }, intervalSec * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, intervalSec, emitNewClaim]);

  const togglePause = () => setIsPaused((prev) => !prev);

  const anomalies = claims.filter((c) => c.isAnomaly);
  const latestAnomaly = anomalies[0] || null;

  return (
    <SimulationContext.Provider
      value={{
        claims,
        anomalies,
        latestAnomaly,
        stats,
        isPaused,
        intervalSec,
        togglePause,
        setIntervalSec,
        triggerManualClaim: emitNewClaim,
        selectedClaimForAudit: selectedClaimForAudit || latestAnomaly,
        setSelectedClaimForAudit,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulationStream = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulationStream must be used within a SimulationProvider');
  }
  return context;
};
