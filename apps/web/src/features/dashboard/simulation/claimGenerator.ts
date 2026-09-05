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
 * Generate a Normal Claim (No Fraud - Verified Clean Claim)
 */
export function generateNormalClaim(): JknClaimRecord {
  const faskes = randomItem(HOSPITALS);
  const patient = randomItem(PATIENT_NAMES);
  const isRanap = Math.random() > 0.4;
  const los = isRanap ? randomInt(2, 5) : 0;
  
  const normalCases = [
    {
      diagAwal: 'I10',
      namaDiag: 'Essential (primary) hypertension - Kontrol Rutin',
      cbgCode: 'I-4-17-I',
      cbgTariff: 2800000,
      tarifRs: 2750000,
      prosedur: ['89.07'],
      sekunder: []
    },
    {
      diagAwal: 'E11.9',
      namaDiag: 'Type 2 diabetes mellitus without complications (PRB Patuh)',
      cbgCode: 'E-4-10-I',
      cbgTariff: 2450000,
      tarifRs: 2390000,
      prosedur: ['90.59'],
      sekunder: ['K30']
    },
    {
      diagAwal: 'K29.7',
      namaDiag: 'Gastritis, unspecified (Terapi PPI Sesuai Formularium)',
      cbgCode: 'K-4-17-I',
      cbgTariff: 1950000,
      tarifRs: 1900000,
      prosedur: [],
      sekunder: []
    },
    {
      diagAwal: 'K35.8',
      namaDiag: 'Acute appendicitis (Apendektomi Sesuai Indikasi Akut)',
      cbgCode: 'K-1-12-I',
      cbgTariff: 7800000,
      tarifRs: 7600000,
      prosedur: ['47.09'],
      sekunder: []
    },
    {
      diagAwal: 'N18.5',
      namaDiag: 'Chronic kidney disease, stage 5 (Hemodialisis Terjadwal Rutin)',
      cbgCode: 'N-3-13-0',
      cbgTariff: 825000,
      tarifRs: 825000,
      prosedur: ['39.95'],
      sekunder: ['I10']
    },
    {
      diagAwal: 'O82.0',
      namaDiag: 'Delivery by caesarean section (Partograf Lengkap & CPD Terverifikasi)',
      cbgCode: 'O-6-10-I',
      cbgTariff: 7450000,
      tarifRs: 7200000,
      prosedur: ['74.1'],
      sekunder: []
    },
    {
      diagAwal: 'H25.0',
      namaDiag: 'Senile incipient cataract (Fakoemulsifikasi Visus < 6/60 Valid)',
      cbgCode: 'H-1-30-I',
      cbgTariff: 5800000,
      tarifRs: 5650000,
      prosedur: ['13.41'],
      sekunder: []
    },
    {
      diagAwal: 'A91',
      namaDiag: 'Dengue haemorrhagic fever (Trombosit < 100k, Rawat Inap Sesuai Kriteria)',
      cbgCode: 'A-4-13-I',
      cbgTariff: 4100000,
      tarifRs: 3950000,
      prosedur: ['90.59'],
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
    fraudRiskScore: randomInt(4, 16),
    riskLevel: 'LOW',
    fraudTypology: 'NORMAL',
    anomalyTitle: 'Klaim Wajar & Terverifikasi (Lolos VEDIKA)',
    anomalyDescription: 'Seluruh rekam medis elektronik, kepatuhan tarif INA-CBG, dan indikasi klinis terverifikasi absah sesuai regulasi JKN.',
    recommendedAction: 'Klaim terverifikasi wajar oleh VEDIKA (Memenuhi Syarat Pembayaran DJS)'
  };
}

/**
 * Generate a Borderline Administrative Review Claim (Non-fraud, needs documentation check)
 */
export function generateAdministrativeReviewClaim(): JknClaimRecord {
  const faskes = randomItem(HOSPITALS);
  const patient = randomItem(PATIENT_NAMES);
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: `CLM-REV-${Date.now()}-${randomInt(100, 999)}`,
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
    diagAwal: 'M54.5',
    namaDiagnosaAwal: 'Low back pain (Konsultasi Poli Saraf)',
    diagnosaSekunder: [],
    prosedur: ['89.07'],
    tarifRs: 480000,
    cbgCode: 'M-4-10-I',
    cbgTariff: 450000,
    severityLevel: 'I',
    isHariLibur: false,
    hasElectronicMedicalRecord: true,
    hasDigitalSignature: true,
    hasPreOpDiagnosticImage: false,
    auditTrailStatus: 'verified',
    isAnomaly: false,
    fraudRiskScore: randomInt(22, 36),
    riskLevel: 'LOW',
    fraudTypology: 'NORMAL',
    anomalyTitle: 'Verifikasi Administratif: Sinkronisasi Rujukan Digital',
    anomalyDescription: 'Klaim secara klinis wajar. Menunggu sinkronisasi berkas rujukan berjenjang dari FKTP tingkat pertama ke poli spesialis.',
    recommendedAction: 'Klaim Wajar Bersyarat: Loloskan pembayaran setelah verifikasi berkas rujukan digital di VClaim.'
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
 * Generate Scenario: Participant Identity Sharing (Impossible Travel)
 */
export function generateParticipantIdentitySharingClaim(): JknClaimRecord {
  const patient = 'Budi Santoso (Kartu Dipinjamkan)';
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `CLM-ID-SHARE-${Date.now()}-${randomInt(100, 999)}`,
    noSep: `1101R0050926V${randomInt(1000, 9999)}`,
    noKartu: '0001847291038',
    namaPeserta: patient,
    nik: '3374**********01',
    tglSep: today,
    ppkPelayanan: '1101R005',
    namaFaskes: 'RS Mitra Husada Semarang',
    kelasFaskes: 'B',
    jnsPelayanan: 2,
    klsRawat: '2',
    lamaHariRawat: 0,
    ruangPerawatan: 'RawatJalan',
    diagAwal: 'M54.5',
    namaDiagnosaAwal: 'Low back pain',
    diagnosaSekunder: [],
    prosedur: ['89.07'],
    tarifRs: 350000,
    cbgCode: 'M-4-10-I',
    cbgTariff: 320000,
    severityLevel: 'I',
    isHariLibur: false,
    hasElectronicMedicalRecord: true,
    hasDigitalSignature: true,
    hasPreOpDiagnosticImage: false,
    auditTrailStatus: 'missing',
    isAnomaly: true,
    fraudRiskScore: 96,
    riskLevel: 'CRITICAL',
    fraudTypology: 'SERVICES_UNBUNDLING', // Will be treated as IDENTITY_SHARING in participant risk
    anomalyTitle: 'Anomali Impossible Travel: Kartu Digunakan Bersamaan di Surakarta & Semarang',
    anomalyDescription: 'Kartu 0001847291038 terbit SEP di RSUD Moewardi Surakarta pk 08.30 WIB lalu terbit kembali di RS Mitra Husada Semarang pk 09.15 WIB (selang 45 menit, jarak 63.5 km). Indikasi peminjaman kartu BPJS ke kerabat.',
    legalCitations: [
      {
        regulation: 'Peraturan BPJS Kesehatan No. 6 Tahun 2020',
        article: 'Pasal Penanganan Kecurangan Peserta',
        summary: 'Larangan meminjamkan identitas jaminan kepada pihak ketiga yang tidak berhak.'
      },
      {
        regulation: 'KUHP Pasal 263',
        article: 'Pemalsuan Surat',
        summary: 'Tindak pidana pemalsuan identitas untuk memperoleh penjaminan pembiayaan.'
      }
    ],
    recommendedAction: 'BATALKAN SEP BERJALAN: Bekukan eligibilitas kartu dan tagih ganti rugi biaya rawat ke peserta.'
  };
}

/**
 * Generate Scenario: Participant Doctor Shopping
 */
export function generateParticipantDoctorShoppingClaim(): JknClaimRecord {
  const patient = 'Hendra Wijaya';
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `CLM-DOC-SHOP-${Date.now()}-${randomInt(100, 999)}`,
    noSep: `0112R0050926V${randomInt(1000, 9999)}`,
    noKartu: '0002938471920',
    namaPeserta: patient,
    nik: '3273**********88',
    tglSep: today,
    ppkPelayanan: '0112R005',
    namaFaskes: 'RS Advent Bandung',
    kelasFaskes: 'B',
    jnsPelayanan: 2,
    klsRawat: '3',
    lamaHariRawat: 0,
    ruangPerawatan: 'RawatJalan',
    diagAwal: 'R42',
    namaDiagnosaAwal: 'Dizziness and giddiness (Vertigo)',
    diagnosaSekunder: [],
    prosedur: ['87.03'],
    tarifRs: 1550000,
    cbgCode: 'R-4-10-I',
    cbgTariff: 1450000,
    severityLevel: 'I',
    isHariLibur: false,
    hasElectronicMedicalRecord: true,
    hasDigitalSignature: true,
    hasPreOpDiagnosticImage: false,
    auditTrailStatus: 'missing',
    isAnomaly: true,
    fraudRiskScore: 88,
    riskLevel: 'HIGH',
    fraudTypology: 'NO_MEDICAL_NECESSITY',
    anomalyTitle: 'Doctor Shopping: 3 Kunjungan Redundan Diagnosa Identik (R42) dalam 5 Hari',
    anomalyDescription: 'Peserta mendatangi 3 faskes berbeda di Bandung dalam rentang 5 hari untuk keluhan pusing vertigo demi meminta pemeriksaan CT-Scan kepala berulang tanpa indikasi kedaruratan medis.',
    legalCitations: [
      {
        regulation: 'Permenkes No. 16 Tahun 2019',
        article: 'Pasal 5 ayat (3)',
        summary: 'Pemanfaatan hak pelayanan berulang yang tidak berindikasi medis (unnecessary utilization).'
      }
    ],
    recommendedAction: 'KUNCI RUJUKAN POLI: Batasi rujukan spesialis mandiri dan kembalikan ke dokter keluarga FKTP.'
  };
}

/**
 * Generate Scenario: Participant PRB Resale
 */
export function generateParticipantPrbResaleClaim(): JknClaimRecord {
  const patient = 'Nurul Hidayati';
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `CLM-PRB-RESALE-${Date.now()}-${randomInt(100, 999)}`,
    noSep: `0201R0120926V${randomInt(1000, 9999)}`,
    noKartu: '0003847192834',
    namaPeserta: patient,
    nik: '1271**********54',
    tglSep: today,
    ppkPelayanan: '0201R012',
    namaFaskes: 'Apotek Kimia Farma Rujukan Medan',
    kelasFaskes: 'FKTP',
    jnsPelayanan: 2,
    klsRawat: '3',
    lamaHariRawat: 0,
    ruangPerawatan: 'RawatJalan',
    diagAwal: 'E11.9',
    namaDiagnosaAwal: 'Type 2 diabetes mellitus (PRB)',
    diagnosaSekunder: ['I10'],
    prosedur: [],
    tarifRs: 1200000,
    cbgCode: 'E-4-10-I',
    cbgTariff: 1200000,
    severityLevel: 'I',
    isHariLibur: false,
    hasElectronicMedicalRecord: true,
    hasDigitalSignature: true,
    hasPreOpDiagnosticImage: false,
    auditTrailStatus: 'missing',
    isAnomaly: true,
    fraudRiskScore: 94,
    riskLevel: 'CRITICAL',
    fraudTypology: 'SERVICES_UNBUNDLING',
    anomalyTitle: 'Penyalahgunaan Obat PRB: Resale Arbitrage (Prescription Overlap 190%)',
    anomalyDescription: 'Peserta Program Rujuk Balik mengambil suplai 90 hari Insulin Glargine dan Amlodipine hanya dalam waktu 22 hari di 3 apotek jejaring berbeda Kota Medan.',
    legalCitations: [
      {
        regulation: 'Panduan Klinis PRB & Permenkes 16/2019',
        article: 'Ketentuan Batas Maksimal Peresepan 30 Hari',
        summary: 'Larangan penimbunan dan pemindahtanganan obat yang dibiayai Dana Jaminan Sosial.'
      }
    ],
    recommendedAction: 'BLOKIR AKSES APOTEK MITRA: Kunci penebusan obat di luar FKTP induk dan audit kepatuhan konsumsi.'
  };
}

/**
 * Generate Scenario: Gender Discordance
 */
export function generateParticipantIdentityFalsifyClaim(): JknClaimRecord {
  const patient = 'Agus Pratama (Identitas Disalahgunakan)';
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `CLM-ID-FALSIFY-${Date.now()}-${randomInt(100, 999)}`,
    noSep: `3578R0040926V${randomInt(1000, 9999)}`,
    noKartu: '0004928172938',
    namaPeserta: patient,
    nik: '3578**********11',
    tglSep: today,
    ppkPelayanan: '3578R004',
    namaFaskes: 'RS Ibu dan Anak Surabaya',
    kelasFaskes: 'C',
    jnsPelayanan: 1,
    klsRawat: '2',
    lamaHariRawat: 3,
    ruangPerawatan: 'Bangsal',
    diagAwal: 'O82.0',
    namaDiagnosaAwal: 'Delivery by elective caesarean section',
    diagnosaSekunder: [],
    prosedur: ['74.1'],
    tarifRs: 13100000,
    cbgCode: 'O-6-10-I',
    cbgTariff: 12800000,
    severityLevel: 'I',
    isHariLibur: false,
    hasElectronicMedicalRecord: false,
    hasDigitalSignature: false,
    hasPreOpDiagnosticImage: false,
    auditTrailStatus: 'missing',
    isAnomaly: true,
    fraudRiskScore: 99,
    riskLevel: 'CRITICAL',
    fraudTypology: 'PHANTOM_BILLING',
    anomalyTitle: 'Diskordansi Gender: Peserta Pria Terbit SEP Persalinan Seksio Sesarea',
    anomalyDescription: 'Nomor kartu peserta dengan data kependudukan LAKI-LAKI terbit SEP persalinan Seksio Sesarea Rp 12.800.000 di RSIA Surabaya. Identitas diduga kuat dipakai oleh pihak lain.',
    legalCitations: [
      {
        regulation: 'KUHP Pasal 263 & Permenkes No. 16 Tahun 2019',
        article: 'Pasal 6 ayat (2) Pemalsuan Identitas',
        summary: 'Pemalsuan surat/identitas kepesertaan jaminan sosial untuk menanggung biaya persalinan faskes.'
      }
    ],
    recommendedAction: 'TOLAK PENJAMINAN 100%: Alihkan biaya menjadi tagihan mandiri pasien dan buat Berita Acara Pelanggaran.'
  };
}

/**
 * Master Generator based on selected scenario preset
 */
export function generateClaimByScenario(scenario: SimulationScenarioPreset): JknClaimRecord {
  switch (scenario) {
    case 'PARTICIPANT_IDENTITY_SHARING':
      return Math.random() > 0.2 ? generateParticipantIdentitySharingClaim() : generateNormalClaim();
    case 'PARTICIPANT_DOCTOR_SHOPPING':
      return Math.random() > 0.2 ? generateParticipantDoctorShoppingClaim() : generateNormalClaim();
    case 'PARTICIPANT_PRB_RESALE':
      return Math.random() > 0.2 ? generateParticipantPrbResaleClaim() : generateNormalClaim();
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
      // 88% Normal Clean Claims (Unbiased: legitimate healthcare needs are approved)
      if (dice < 0.88) return generateNormalClaim();
      // 6% Administrative Review / Clarification (Non-fraud documentation checks)
      if (dice < 0.94) return generateAdministrativeReviewClaim();
      // 6% Genuine Outliers & Participant Fraud Anomalies
      const anomalyDice = Math.random();
      if (anomalyDice < 0.35) return generateParticipantIdentitySharingClaim();
      if (anomalyDice < 0.65) return generateParticipantDoctorShoppingClaim();
      if (anomalyDice < 0.85) return generateParticipantPrbResaleClaim();
      return generateParticipantIdentityFalsifyClaim();
    }
  }
}

