/**
 * INFERA — BPJS Kesehatan JKN Simulation & Risk Analysis Types
 * Standardized against BPJS VClaim WS 2.0, INA-CBG E-Klaim, and SATUSEHAT RME specs.
 * Focused on Healthkathon 2026: "Efisiensi Risiko pada Peserta".
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
  sanction?: string;
}

export interface JknClaimRecord {
  id: string;
  noSep: string;
  noKartu: string;
  namaPeserta: string;
  nik: string;
  tglSep: string;
  tglPulang?: string;
  ppkPelayanan: string;
  namaFaskes: string;
  kelasFaskes: FaskesClass;
  jnsPelayanan: JenisPelayanan;
  klsRawat: KelasRawat;
  poliTujuan?: string;
  lamaHariRawat: number;
  ruangPerawatan: 'Bangsal' | 'ICU' | 'ICCU' | 'NICU' | 'RawatJalan';
  diagAwal: string;
  namaDiagnosaAwal: string;
  diagnosaSekunder: string[];
  prosedur: string[];
  tarifRs: number;
  cbgCode: string;
  cbgTariff: number;
  severityLevel: SeverityLevel;
  isHariLibur: boolean;
  hasElectronicMedicalRecord: boolean;
  hasDigitalSignature: boolean;
  hasPreOpDiagnosticImage: boolean;
  auditTrailStatus: 'verified' | 'unverified' | 'missing';
  isAnomaly: boolean;
  fraudRiskScore: number;
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
  | 'MONOPOLISTIC_REFERRAL'
  | 'PARTICIPANT_IDENTITY_SHARING'
  | 'PARTICIPANT_DOCTOR_SHOPPING'
  | 'PARTICIPANT_PRB_RESALE';

export interface SimulationConfig {
  speedMs: number;
  scenario: SimulationScenarioPreset;
  anomalyRate: number;
  isPaused: boolean;
}

export interface SimulationStats {
  totalClaims: number;
  totalAnomalies: number;
  totalDjsLossAmount: number;
  totalVerifiedAmount: number;
  typologyCounts: Record<FraudTypology, number>;
  riskCounts: Record<RiskLevel, number>;
}

// ============================================================================
// HEALTHKATHON 2026: DOMAIN MODEL "EFISIENSI RISIKO PADA PESERTA"
// ============================================================================

export type ParticipantRiskCategory =
  | 'IDENTITY_FALSIFICATION' // Modus 1: Pemalsuan data/identitas peserta
  | 'IDENTITY_SHARING'       // Modus 2: Penyalahgunaan identitas / Kartu pinjaman / Impossible travel
  | 'UNNECESSARY_SERVICES'   // Modus 3: Pelayanan yang tidak perlu / Doctor shopping
  | 'MEDICINE_ALKES_ABUSE'   // Modus 4: Penyalahgunaan obat kronis PRB / resale / alkes
  | 'CLEAN_PARTICIPANT';     // Wajar

export interface GeoLocation {
  city: string;
  province: string;
  lat: number;
  lng: number;
}

export interface PesertaEncounter {
  id: string;
  noSep: string;
  timestamp: string; // ISO String (e.g. 2026-09-04T09:15:00Z)
  ppkCode: string;
  faskesName: string;
  faskesClass: FaskesClass;
  location: GeoLocation;
  jnsPelayanan: JenisPelayanan;
  poliTujuan?: string;
  diagnosaUtama: string; // ICD-10
  namaDiagnosa: string;
  cbgCode?: string;
  cbgTariff: number;
  prescribedDrugs?: {
    drugName: string;
    isPrbChronic: boolean; // Program Rujuk Balik
    quantityDays: number; // Days of supply (e.g. 30 days)
    unitPrice: number;
  }[];
  medicalDeviceClaimed?: {
    deviceType: 'KACAMATA' | 'ALAT_BANTU_DENGAR' | 'KURSI_RODA';
    claimAmount: number;
    lastClaimDate?: string;
  };
}

export interface PesertaProfile {
  noKartu: string;
  nikMasked: string;
  fullName: string;
  gender: 'L' | 'P';
  dateOfBirth: string; // YYYY-MM-DD
  faskesTingkat1: string;
  membershipSegment: 'PBI_APBN' | 'PBI_APBD' | 'PPU' | 'PBPU_MANDIRI';
  statusIuran: 'AKTIF' | 'MENUNGGAK' | 'NONAKTIF';
  encounters: PesertaEncounter[];
}

export interface ParticipantAnomalyEvidence {
  category: ParticipantRiskCategory;
  title: string;
  severityScore: number; // 0 - 100
  evidenceSummary: string;
  velocityKmH?: number;
  distanceKm?: number;
  timeDeltaHours?: number;
  doctorShoppingCount?: number;
  prescriptionOverlapPercent?: number;
  coolingOffViolationDaysRemaining?: number;
  legalGrounding: LegalCitation;
}

export interface ParticipantRiskEvaluationResult {
  noKartu: string;
  namaPeserta: string;
  nikMasked: string;
  gender: 'L' | 'P';
  age: number;
  membershipSegment: string;
  totalEncountersLast30Days: number;
  overallRiskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  primaryCategory: ParticipantRiskCategory;
  anomalies: ParticipantAnomalyEvidence[];
  potentialDjsLossAmount: number;
  recommendedAction: string;
  isFlaggedForAudit: boolean;
  evaluatedAt: string;
}

export interface ParticipantRiskMetrics {
  totalParticipantsAudited: number;
  totalAnomaliesDetected: number;
  totalPotentialDjsLossPrevented: number;
  totalCleanClaimsApproved: number;
  categoryDistribution: Record<ParticipantRiskCategory, number>;
  riskLevelDistribution: Record<RiskLevel, number>;
  topRiskCities: { city: string; count: number }[];
  timeframe: string;
}

export interface ParticipantAuditCase {
  id: string;
  caseCode: string;
  category: ParticipantRiskCategory;
  categoryLabel: string;
  patientName: string;
  noKartu: string;
  nikMasked: string;
  riskScore: number;
  riskLevel: RiskLevel;
  potentialLoss: number;
  summary: string;
  detailedAnalysis: string;
  encounters: PesertaEncounter[];
  legalReference: LegalCitation;
  recommendedSanction: string;
}
