import type {
  JknClaimRecord,
  SimulationScenarioPreset,
  KelasRawat,
  FaskesClass,
} from '@healthathon/shared';

// Predefined Hospitals
const HOSPITALS: { name: string; code: string; kelas: FaskesClass }[] = [
  { name: 'RSUD Dr. Moewardi Surakarta', code: '1114R001', kelas: 'A' },
  { name: 'RS Mitra Husada Semarang', code: '1101R005', kelas: 'B' },
  { name: 'RS Sejahtera Abadi Medan', code: '0201R012', kelas: 'B' },
  { name: 'RS Kasih Bunda Pematangsiantar', code: '0205R003', kelas: 'C' },
  { name: 'Klinik Utama Sehat Mandiri', code: '1101K001', kelas: 'KlinikUtama' },
  { name: 'Puskesmas Gambir', code: '0112P001', kelas: 'FKTP' },
];

const PATIENT_NAMES = [
  'Budi Santoso', 'Siti Rahayu', 'Hendra Wijaya', 'Sri Mulyani',
  'Agus Pratama', 'Dewi Lestari', 'Bambang Kusuma', 'Nurul Hidayati',
  'Rahmat Hidayat', 'Eka Putri', 'Dedi Supriadi', 'Yuliana Sari'
];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSepNumber(faskesCode: string): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randSeq = String(randomInt(1000, 9999));
  return `${faskesCode}${dateStr}V${randSeq}`;
}

function generateBpjsCard(): string {
  return '000' + String(randomInt(1000000000, 9999999999));
}

function generateNik(): string {
  return '3374' + String(randomInt(100000000000, 999999999999));
}

/**
 * Generate a Normal Claim (No Fraud)
 */
export function generateNormalClaim(): JknClaimRecord {
  const faskes = randomItem(HOSPITALS);
  const patient = randomItem(PATIENT_NAMES);
  const isRanap = Math.random() > 0.4;
  const los = isRanap ? randomInt(2, 5) : 0;
  
  const normalCases = [
    {
      diagAwal: 'I10',
      namaDiag: 'Essential (primary) hypertension',
      cbgCode: 'I-4-17-I',
      cbgTariff: 3200000,
      tarifRs: 3100000,
      prosedur: ['89.07'],
      sekunder: []
    },
    {
      diagAwal: 'E11.9',
      namaDiag: 'Type 2 diabetes mellitus without complications',
      cbgCode: 'E-4-10-I',
      cbgTariff: 2850000,
      tarifRs: 2750000,
      prosedur: ['90.59'],
      sekunder: ['K30']
    },
    {
      diagAwal: 'K29.7',
      namaDiag: 'Gastritis, unspecified',
      cbgCode: 'K-4-17-I',
      cbgTariff: 2400000,
      tarifRs: 2350000,
      prosedur: [],
      sekunder: []
    },
    {
      diagAwal: 'K35.8',
      namaDiag: 'Acute appendicitis, other and unspecified',
      cbgCode: 'K-1-12-I',
      cbgTariff: 7800000,
      tarifRs: 7600000,
      prosedur: ['47.09'],
      sekunder: []
    }
  ];

  const selectedCase = randomItem(normalCases);
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: `CLM-${Date.now()}-${randomInt(100, 999)}`,
    noSep: generateSepNumber(faskes.code),
    noKartu: generateBpjsCard(),
    namaPeserta: patient,
    nik: generateNik(),
    tglSep: today,
    ppkPelayanan: faskes.code,
    namaFaskes: faskes.name,
    kelasFaskes: faskes.kelas,
    jnsPelayanan: isRanap ? 1 : 2,
    klsRawat: randomItem(['1', '2', '3'] as KelasRawat[]),
    lamaHariRawat: los,
    ruangPerawatan: isRanap ? 'Bangsal' : 'RawatJalan',
    diagAwal: selectedCase.diagAwal,
    namaDiagnosaAwal: selectedCase.namaDiag,
    diagnosaSekunder: selectedCase.sekunder,
    prosedur: selectedCase.prosedur,
    tarifRs: selectedCase.tarifRs,
    cbgCode: selectedCase.cbgCode,
    cbgTariff: selectedCase.cbgTariff,
    severityLevel: 'I',
    isHariLibur: false,
    hasElectronicMedicalRecord: true,
    hasDigitalSignature: true,
    hasPreOpDiagnosticImage: true,
    auditTrailStatus: 'verified',
    isAnomaly: false,
    fraudRiskScore: randomInt(5, 20),
    riskLevel: 'LOW',
    fraudTypology: 'NORMAL',
    recommendedAction: 'Klaim terverifikasi wajar oleh VEDIKA (Memenuhi Syarat Pembayaran DJS)'
  };
}

/**
 * Generate Scenario 1: KPK 2024 Benchmark — Fisioterapi Phantom Billing
 */
export function generateKpkPhysiotherapyClaim(): JknClaimRecord {
  const faskes = HOSPITALS[2]!; // RS Sejahtera Abadi Medan (Sumut KPK Case RS)
  const patient = randomItem(PATIENT_NAMES);
  const sessions = randomInt(18, 30);
  const tariffPerSession = 185000;
  const totalBilled = sessions * tariffPerSession;
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: `CLM-KPK-PT-${Date.now()}-${randomInt(100, 999)}`,
    noSep: generateSepNumber(faskes.code),
    noKartu: generateBpjsCard(),
    namaPeserta: patient,
    nik: generateNik(),
    tglSep: today,
    ppkPelayanan: faskes.code,
    namaFaskes: faskes.name,
    kelasFaskes: faskes.kelas,
    jnsPelayanan: 2, // Rawat Jalan
    klsRawat: '3',
    poliTujuan: 'Kedokteran Fisik & Rehabilitasi (KFR)',
    lamaHariRawat: 0,
    ruangPerawatan: 'RawatJalan',
    diagAwal: 'M54.5',
    namaDiagnosaAwal: 'Low back pain (Nyeri Punggung Bawah)',
    diagnosaSekunder: ['M79.1', 'M25.5'],
    prosedur: ['93.39', '93.11'], // Physical therapy exercises & other physical therapy
    tarifRs: totalBilled,
    cbgCode: 'Q-5-44-0',
    cbgTariff: totalBilled,
    severityLevel: 'I',
    isHariLibur: true, // Tagihan di hari libur/minggu
    hasElectronicMedicalRecord: false, // 75.3% fiktif tanpa rekam medis
    hasDigitalSignature: false,
    hasPreOpDiagnosticImage: false,
    auditTrailStatus: 'missing',
    isAnomaly: true,
    fraudRiskScore: 94,
    riskLevel: 'CRITICAL',
    fraudTypology: 'PHANTOM_BILLING',
    anomalyTitle: 'Temuan Benchmark KPK 2024: Tagihan Fisioterapi Fiktif (Phantom Billing)',
    anomalyDescription: `Terdeteksi klaim fisioterapi ${sessions} kali sebulan berulang termasuk pada hari libur nasional saat klinik tutup. Berkas tidak memiliki catatan rekam medis dan TTD dokter DPJP (Identik temuan audit KPK Sumut/Jateng 2024: 3.269 klaim fiktif senilai Rp 35 M).`,
    legalCitations: [
      {
        regulation: 'Permenkes No. 36 Tahun 2015',
        article: 'Pasal 5 ayat (4) huruf c',
        summary: 'Klaim palsu (Phantom Billing): Menagihkan tindakan medis atau terapi yang tidak pernah diberikan kepada pasien.'
      },
      {
        regulation: 'Permenkes No. 16 Tahun 2019',
        article: 'Pasal 6 ayat (2)',
        summary: 'Perintah pengembalian kerugian ke Dana Jaminan Sosial (DJS) BPJS dalam waktu maksimal 14 hari kerja dan pelimpahan ke KPK.'
      },
      {
        regulation: 'SE Menkes No. HK.02.01/MENKES/1567/2024',
        article: 'Instruksi Kendali Biaya',
        summary: 'Kewajiban audit internal dan pelaporan ganti rugi atas klaim fiktif ke Kemenkes RI.'
      }
    ],
    recommendedAction: 'TOLAK KLAIM SEGERA: Terbitkan Surat Tagihan Pengembalian DJS 14 Hari Kerja & Rekomendasikan Investigasi Khusus Tim PK-JKN.'
  };
}

/**
 * Generate Scenario 2: KPK 2024 Benchmark — Katarak Upcoding & Unbundling
 */
export function generateKpkCataractClaim(): JknClaimRecord {
  const faskes = HOSPITALS[1]!; // RS Mitra Husada Semarang (Jateng Case RS)
  const patient = randomItem(PATIENT_NAMES);
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: `CLM-KPK-CAT-${Date.now()}-${randomInt(100, 999)}`,
    noSep: generateSepNumber(faskes.code),
    noKartu: generateBpjsCard(),
    namaPeserta: patient,
    nik: generateNik(),
    tglSep: today,
    ppkPelayanan: faskes.code,
    namaFaskes: faskes.name,
    kelasFaskes: faskes.kelas,
    jnsPelayanan: 1, // Rawat Inap
    klsRawat: '1',
    poliTujuan: 'Spesialis Mata',
    lamaHariRawat: 1,
    ruangPerawatan: 'Bangsal',
    diagAwal: 'H25.0',
    namaDiagnosaAwal: 'Senile incipient cataract (Katarak Imatur)',
    diagnosaSekunder: ['H40.1', 'E11.3'], // Glaukoma & Retinopati Diabetik sekunder fiktif untuk menaikkan severity
    prosedur: ['13.41', '13.71'], // Phacoemulsification & Insertion of intraocular lens
    tarifRs: 15400000,
    cbgCode: 'H-3-13-III', // Upcoded to Severity III (seharusnya H-3-13-I tarif 6.8jt)
    cbgTariff: 14800000,
    severityLevel: 'III',
    isHariLibur: false,
    hasElectronicMedicalRecord: true,
    hasDigitalSignature: true,
    hasPreOpDiagnosticImage: false, // Tidak ada foto slit lamp pra-operasi
    auditTrailStatus: 'unverified',
    isAnomaly: true,
    fraudRiskScore: 88,
    riskLevel: 'HIGH',
    fraudTypology: 'UPCODING',
    anomalyTitle: 'KPK 2024 Benchmark: Upcoding & Unbundling Operasi Katarak Tanpa Indikasi',
    anomalyDescription: 'Klaim operasi fakoemulsifikasi dinaikkan ke Severity Level III dengan komorbiditas mayor yang tidak terkonfirmasi penunjang klinis. Ditemukan penagihan implan lensa IOL terpisah di luar paket INA-CBG dan ketiadaan hasil keratometri pra-operasi (64.1% temuan KPK tanpa indikasi medis bedah).',
    legalCitations: [
      {
        regulation: 'Permenkes No. 36 Tahun 2015',
        article: 'Pasal 5 ayat (4) huruf a & e',
        summary: 'Upcoding dan Services Unbundling memecah tagihan paket koding tarif INA-CBG.'
      },
      {
        regulation: 'Permenkes No. 3 Tahun 2023',
        article: 'Pedoman Koding Katarak',
        summary: 'Implan lensa IOL adalah satu kesatuan dalam tarif paket operasi katarak H-3-13, dilarang di-unbundle.'
      }
    ],
    recommendedAction: 'DOWNCODE KE SEVERITY I: Koreksi tarif klaim ke H-3-13-I (hemat Rp 8.000.000 DJS) dan sita berkas keratometri pra-operasi.'
  };
}

/**
 * Generate Scenario 3: Seksio Sesarea Upcoding
 */
export function generateSectioCesareanClaim(): JknClaimRecord {
  const faskes = HOSPITALS[0]!;
  const patient = randomItem(['Dewi Sartika', 'Rina Wati', 'Siti Aminah', 'Fitri Handayani']);
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: `CLM-SC-${Date.now()}-${randomInt(100, 999)}`,
    noSep: generateSepNumber(faskes.code),
    noKartu: generateBpjsCard(),
    namaPeserta: patient,
    nik: generateNik(),
    tglSep: today,
    ppkPelayanan: faskes.code,
    namaFaskes: faskes.name,
    kelasFaskes: faskes.kelas,
    jnsPelayanan: 1,
    klsRawat: '2',
    lamaHariRawat: 2, // Rawat singkat 2 hari tidak cocok untuk Severity III
    ruangPerawatan: 'Bangsal', // Bukan ICU padahal klaim Sepsis Berat
    diagAwal: 'O82.0',
    namaDiagnosaAwal: 'Delivery by elective caesarean section',
    diagnosaSekunder: ['A41.9', 'O14.1'], // Sepsis & Preeklampsia berat fiktif
    prosedur: ['74.1'], // Low cervical cesarean section
    tarifRs: 18200000,
    cbgCode: 'O-6-10-III', // Seharusnya O-6-10-I (Rp 6.5jt)
    cbgTariff: 17800000,
    severityLevel: 'III',
    isHariLibur: false,
    hasElectronicMedicalRecord: true,
    hasDigitalSignature: true,
    hasPreOpDiagnosticImage: true,
    auditTrailStatus: 'unverified',
    isAnomaly: true,
    fraudRiskScore: 82,
    riskLevel: 'HIGH',
    fraudTypology: 'UPCODING',
    anomalyTitle: 'Upcoding Severity Level III Persalinan Seksio Sesarea',
    anomalyDescription: 'Penambahan diagnosa sekunder Sepsis Berat (A41.9) pada pasien SC dengan lama rawat hanya 2 hari di bangsal perawatan biasa non-ICU. Pelanggaran nyata aturan koding Permenkes 3/2023.',
    legalCitations: [
      {
        regulation: 'Permenkes No. 3 Tahun 2023',
        article: 'Aturan Diagnosa Sekunder',
        summary: 'Komorbiditas sekunder hanya sah jika memerlukan penanganan intensif, pemeriksaan khusus, atau memperpanjang hari rawat.'
      },
      {
        regulation: 'Permenkes No. 16 Tahun 2019',
        article: 'Pasal 6 ayat (2) huruf e',
        summary: 'Penundaan pembayaran klaim (payment freeze) untuk audit rekam medis dan catatan pemberian antibiotik injeksi intensif.'
      }
    ],
    recommendedAction: 'PENDING KLAIM: Minta bukti lembar hasil kultur darah laboratorium dan catatan observasi ICU.'
  };
}

/**
 * Generate Scenario 4: Inappropriate Readmission (< 14 Hari)
 */
export function generateReadmissionClaim(): JknClaimRecord {
  const faskes = HOSPITALS[3]!;
  const patient = randomItem(PATIENT_NAMES);
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: `CLM-READM-${Date.now()}-${randomInt(100, 999)}`,
    noSep: generateSepNumber(faskes.code),
    noKartu: generateBpjsCard(),
    namaPeserta: patient,
    nik: generateNik(),
    tglSep: today,
    ppkPelayanan: faskes.code,
    namaFaskes: faskes.name,
    kelasFaskes: faskes.kelas,
    jnsPelayanan: 1,
    klsRawat: '3',
    lamaHariRawat: 3,
    ruangPerawatan: 'Bangsal',
    diagAwal: 'A90',
    namaDiagnosaAwal: 'Dengue fever (Demam Berdarah Dengue)',
    diagnosaSekunder: [],
    prosedur: ['99.18'],
    tarifRs: 4800000,
    cbgCode: 'I-4-15-I',
    cbgTariff: 4600000,
    severityLevel: 'I',
    isHariLibur: false,
    hasElectronicMedicalRecord: true,
    hasDigitalSignature: true,
    hasPreOpDiagnosticImage: false,
    auditTrailStatus: 'verified',
    isAnomaly: true,
    fraudRiskScore: 78,
    riskLevel: 'MEDIUM',
    fraudTypology: 'INAPPROPRIATE_READMISSION',
    anomalyTitle: 'Readmisi Berulang Prematur (< 14 Hari) DBD',
    anomalyDescription: 'Pasien DBD dipulangkan 4 hari lalu dan didaftarkan kembali dengan nomor SEP baru untuk diagnosa yang sama tanpa jeda stabilitas klinis yang memadai (Pola Early Discharge demi klaim paket ganda).',
    legalCitations: [
      {
        regulation: 'Permenkes No. 36 Tahun 2015',
        article: 'Pasal 5 ayat (4) huruf g',
        summary: 'Klaim readmisi tidak tepat: Memulangkan pasien prematur untuk menagihkan kembali paket INA-CBG baru.'
      }
    ],
    recommendedAction: 'GABUNGKAN EPISODE KLAIM: Satukan tagihan SEP kedua ke dalam episode perawatan pertama.'
  };
}

/**
 * Generate Scenario 5: Rujukan Monopolistik (Self-Referral)
 */
export function generateMonopolisticReferralClaim(): JknClaimRecord {
  const faskes = HOSPITALS[4]!;
  const patient = randomItem(PATIENT_NAMES);
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: `CLM-REF-${Date.now()}-${randomInt(100, 999)}`,
    noSep: generateSepNumber(faskes.code),
    noKartu: generateBpjsCard(),
    namaPeserta: patient,
    nik: generateNik(),
    tglSep: today,
    ppkPelayanan: faskes.code,
    namaFaskes: faskes.name,
    kelasFaskes: faskes.kelas,
    jnsPelayanan: 2,
    klsRawat: '3',
    lamaHariRawat: 0,
    ruangPerawatan: 'RawatJalan',
    diagAwal: 'N18.9',
    namaDiagnosaAwal: 'Chronic kidney disease, unspecified',
    diagnosaSekunder: ['I10'],
    prosedur: ['39.95'], // Hemodialysis
    tarifRs: 1250000,
    cbgCode: 'N-3-10-0',
    cbgTariff: 1100000,
    severityLevel: 'I',
    isHariLibur: false,
    hasElectronicMedicalRecord: true,
    hasDigitalSignature: true,
    hasPreOpDiagnosticImage: false,
    auditTrailStatus: 'verified',
    isAnomaly: true,
    fraudRiskScore: 74,
    riskLevel: 'MEDIUM',
    fraudTypology: 'SELF_REFERRAL',
    anomalyTitle: 'Anomali Rujukan Terpusat Monopolistik (Self-Referral / Fee-Splitting)',
    anomalyDescription: 'Puskesmas perujuk mengarahkan 94% rujukan pasien gagal ginjal kronis khusus ke Klinik Utama ini dengan melewati 2 RSUD Tipe B yang lebih dekat (indikasi kickback / fee-splitting).',
    legalCitations: [
      {
        regulation: 'Permenkes No. 36 Tahun 2015',
        article: 'Pasal 5 ayat (3) huruf d & ayat (4) huruf h',
        summary: 'Rujukan fiktif atau pembagian komisi rujukan (Self-referral / Fee-splitting).'
      },
      {
        regulation: 'Peraturan BPJS Kesehatan No. 6 Tahun 2020',
        article: 'Pilar Deteksi Pasca Bayar (DEFRADA)',
        summary: 'Pemberian sanksi pemutusan kerja sama pada faskes yang memanipulasi alur rujukan berjenjang.'
      }
    ],
    recommendedAction: 'AUDIT POLA RUJUKAN: Kirim Tim Auditor BPJS Kantor Cabang untuk memeriksa dokter perujuk di FKTP.'
  };
}

/**
 * Master Generator based on selected scenario preset
 */
export function generateClaimByScenario(scenario: SimulationScenarioPreset): JknClaimRecord {
  switch (scenario) {
    case 'KPK_PHYSIOTHERAPY_PHANTOM':
      return Math.random() > 0.3 ? generateKpkPhysiotherapyClaim() : generateNormalClaim();
    case 'KPK_CATARACT_UPCODING':
      return Math.random() > 0.3 ? generateKpkCataractClaim() : generateNormalClaim();
    case 'SECTIO_CESAREAN_UPCODING':
      return Math.random() > 0.3 ? generateSectioCesareanClaim() : generateNormalClaim();
    case 'INAPPROPRIATE_READMISSION':
      return Math.random() > 0.3 ? generateReadmissionClaim() : generateNormalClaim();
    case 'MONOPOLISTIC_REFERRAL':
      return Math.random() > 0.3 ? generateMonopolisticReferralClaim() : generateNormalClaim();
    case 'ALL_RANDOM':
    default: {
      const dice = Math.random();
      if (dice < 0.45) return generateNormalClaim();
      if (dice < 0.60) return generateKpkPhysiotherapyClaim();
      if (dice < 0.75) return generateKpkCataractClaim();
      if (dice < 0.85) return generateSectioCesareanClaim();
      if (dice < 0.93) return generateReadmissionClaim();
      return generateMonopolisticReferralClaim();
    }
  }
}
