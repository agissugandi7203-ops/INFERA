/**
 * INFERA — BPJS Kesehatan JKN Simulation Types
 * Standardized against BPJS VClaim WS 2.0, INA-CBG E-Klaim, and SATUSEHAT RME specs.
 */

export type JenisPelayanan = 1 | 2; // 1: Rawat Inap, 2: Rawat Jalan
export type KelasRawat = '1' | '2' | '3' | 'VIP';
export type SeverityLevel = 'I' | 'II' | 'III';
export type FaskesClass = 'A' | 'B' | 'C' | 'D' | 'KlinikUtama' | 'FKTP';

export type FraudTypology =
  | 'NORMAL'
  | 'PHANTOM_BILLING'
  | 'UPCODING'
  | 'SERVICES_UNBUNDLING'
  | 'INAPPROPRIATE_READMISSION'
  | 'SELF_REFERRAL'
  | 'NO_MEDICAL_NECESSITY'
  | 'CLONING_CLAIM'
  | 'BALANCE_BILLING';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LegalCitation {
  regulation: string;
  article: string;
  summary: string;
}

export interface JknClaimRecord {
  id: string;
  noSep: string; // 19 digits standard format: 0115R001...
  noKartu: string; // 13 digits BPJS number
  namaPeserta: string;
  nik: string;
  tglSep: string; // YYYY-MM-DD
  tglPulang?: string; // YYYY-MM-DD
  ppkPelayanan: string; // Kode Faskes
  namaFaskes: string;
  kelasFaskes: FaskesClass;
  jnsPelayanan: JenisPelayanan;
  klsRawat: KelasRawat;
  poliTujuan?: string;
  lamaHariRawat: number; // Length of Stay (LOS)
  ruangPerawatan: 'Bangsal' | 'ICU' | 'ICCU' | 'NICU' | 'RawatJalan';
  
  // Clinical Diagnoses and Procedures
  diagAwal: string; // Primary ICD-10 code (e.g. "I21.0")
  namaDiagnosaAwal: string;
  diagnosaSekunder: string[]; // Secondary ICD-10 comorbidities
  prosedur: string[]; // ICD-9-CM procedures (e.g. ["93.39"])
  
  // Financials & Tariff Grouping
  tarifRs: number; // Real hospital bill in IDR
  cbgCode: string; // INA-CBG code (e.g. "H-3-13-I")
  cbgTariff: number; // Official INA-CBG tariff in IDR
  severityLevel: SeverityLevel;
  
  // Temporal & SATUSEHAT RME Audit Trail
  isHariLibur: boolean;
  hasElectronicMedicalRecord: boolean;
  hasDigitalSignature: boolean;
  hasPreOpDiagnosticImage: boolean;
  auditTrailStatus: 'verified' | 'unverified' | 'missing';
  
  // Simulation & Anomaly Metadata
  isAnomaly: boolean;
  fraudRiskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  fraudTypology: FraudTypology;
  anomalyTitle?: string;
  anomalyDescription?: string;
  legalCitations?: LegalCitation[];
  recommendedAction?: string;
}

export type SimulationScenarioPreset =
  | 'ALL_RANDOM'
  | 'KPK_PHYSIOTHERAPY_PHANTOM'
  | 'KPK_CATARACT_UPCODING'
  | 'SECTIO_CESAREAN_UPCODING'
  | 'INAPPROPRIATE_READMISSION'
  | 'MONOPOLISTIC_REFERRAL';

export interface SimulationConfig {
  speedMs: number; // Milliseconds between generated claims (e.g. 2000ms = 1 claim every 2s)
  scenario: SimulationScenarioPreset;
  anomalyRate: number; // 0.0 - 1.0 probability of injecting anomalies
  isPaused: boolean;
}

export interface SimulationStats {
  totalClaims: number;
  totalAnomalies: number;
  totalDjsLossAmount: number; // Total potential financial loss for DJS in IDR
  totalVerifiedAmount: number; // Total verified clean claims in IDR
  typologyCounts: Record<FraudTypology, number>;
  riskCounts: Record<RiskLevel, number>;
}
