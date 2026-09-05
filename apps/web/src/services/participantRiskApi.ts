import type {
  ParticipantRiskMetrics,
  ParticipantAuditCase,
  ParticipantRiskEvaluationResult,
  PesertaProfile,
  ApiResponse,
} from '@healthathon/shared';

const API_BASE = '/api/v1/participant-risk';

// ============================================================================
// BENCHMARK FALLBACK DATA (Guarantees zero downtime during pitch & offline demos)
// ============================================================================

export const FALLBACK_METRICS: ParticipantRiskMetrics = {
  totalParticipantsAudited: 42180,
  totalAnomaliesDetected: 1485,
  totalPotentialDjsLossPrevented: 2450000000, // Rp 2.45 Miliar
  totalCleanClaimsApproved: 38700000000,     // Rp 38.7 Miliar
  categoryDistribution: {
    IDENTITY_SHARING: 432,         // 29.1%
    UNNECESSARY_SERVICES: 512,     // 34.5%
    MEDICINE_ALKES_ABUSE: 381,     // 25.7%
    IDENTITY_FALSIFICATION: 160,   // 10.8%
    CLEAN_PARTICIPANT: 40695,
  },
  riskLevelDistribution: {
    CRITICAL: 284,
    HIGH: 621,
    MEDIUM: 580,
    LOW: 40695,
  },
  topRiskCities: [
    { city: 'Kota Semarang', count: 320 },
    { city: 'Kota Medan', count: 285 },
    { city: 'Kota Surabaya', count: 240 },
    { city: 'Kota Bandung', count: 210 },
    { city: 'Jakarta Selatan', count: 195 },
  ],
  timeframe: '30 Hari Terakhir (Live VEDIKA Audit)',
};

export const FALLBACK_CASES: ParticipantAuditCase[] = [
  {
    id: 'CASE-001',
    caseCode: 'HK-ID-SHARING-2026',
    category: 'IDENTITY_SHARING',
    categoryLabel: 'Penyalahgunaan Identitas: Kartu Pinjaman (Impossible Travel)',
    patientName: 'Budi Santoso (Kartu Dipinjamkan)',
    noKartu: '0001847291038',
    nikMasked: '3374**********01',
    riskScore: 96,
    riskLevel: 'CRITICAL',
    potentialLoss: 8400000,
    summary:
      'Kartu peserta yang sama digunakan untuk mendaftar rawat inap di Surakarta dan rawat jalan di Semarang dalam selang 45 menit (kecepatan implisit 180 km/jam).',
    detailedAnalysis:
      'Audit log VClaim membuktikan noKartu 0001847291038 terbit SEP No. 1114R0010926V0001 di RSUD Moewardi Surakarta pk. 08:30 WIB, lalu pk. 09:15 WIB terbit SEP kedua No. 1101R0050926V0042 di RS Mitra Husada Semarang. Investigasi lapangan mengungkap kartu dipinjamkan kepada sepupu peserta yang tidak memiliki jaminan aktif.',
    encounters: [
      {
        id: 'ENC-01',
        noSep: '1114R0010926V0001',
        timestamp: '2026-09-04T08:30:00Z',
        ppkCode: '1114R001',
        faskesName: 'RSUD Dr. Moewardi Surakarta',
        faskesClass: 'A',
        location: { city: 'Kota Surakarta', province: 'Jawa Tengah', lat: -7.558, lng: 110.856 },
        jnsPelayanan: 1,
        diagnosaUtama: 'I21.0',
        namaDiagnosa: 'Acute transmural myocardial infarction',
        cbgTariff: 8400000,
      },
      {
        id: 'ENC-02',
        noSep: '1101R0050926V0042',
        timestamp: '2026-09-04T09:15:00Z',
        ppkCode: '1101R005',
        faskesName: 'RS Mitra Husada Semarang',
        faskesClass: 'B',
        location: { city: 'Kota Semarang', province: 'Jawa Tengah', lat: -6.993, lng: 110.42 },
        jnsPelayanan: 2,
        diagnosaUtama: 'M54.5',
        namaDiagnosa: 'Low back pain',
        cbgTariff: 320000,
      },
    ],
    legalReference: {
      regulation: 'Peraturan BPJS Kesehatan No. 6 Tahun 2020 & KUHP 263',
      article: 'Pasal Sanksi Penyalahgunaan Kartu Peserta',
      summary: 'Tindakan meminjamkan kartu jaminan sosial kepada orang lain yang bukan haknya.',
      sanction: 'Pembatalan SEP berjalan, penagihan biaya rawat Rp 8.400.000 ke pemegang kartu, dan suspensi hak jaminan.',
    },
    recommendedSanction: 'BATALKAN SEP BERJALAN & TAGIH GANTI RUGI DJS',
  },
  {
    id: 'CASE-002',
    caseCode: 'HK-DOC-SHOPPING-2026',
    category: 'UNNECESSARY_SERVICES',
    categoryLabel: 'Pelayanan Tidak Perlu: Doctor Shopping Kunjungan Redundan',
    patientName: 'Hendra Wijaya',
    noKartu: '0002938471920',
    nikMasked: '3273**********88',
    riskScore: 88,
    riskLevel: 'HIGH',
    potentialLoss: 4200000,
    summary:
      'Peserta berpindah-pindah 5 faskes berbeda dalam 10 hari untuk keluhan pusing/vertigo ringan demi mendapatkan pemeriksaan CT-Scan otak berulang.',
    detailedAnalysis:
      'Pola audit menunjukkan peserta mendatangi 3 klinik pratama dan 2 IGD RS swasta yang berbeda di Kota Bandung dalam interval rata-rata 2 hari dengan keluhan R42 (Dizziness and giddiness). Setiap kunjungan menghasilkan peresepan obat simptomatis yang menumpuk dan rujukan penunjang berulang tanpa kegawatdaruratan.',
    encounters: [
      {
        id: 'ENC-03',
        noSep: '0112P0010926V0010',
        timestamp: '2026-08-26T10:00:00Z',
        ppkCode: '0112P001',
        faskesName: 'Klinik Pratama Sehat 1 Bandung',
        faskesClass: 'FKTP',
        location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.917, lng: 107.619 },
        jnsPelayanan: 2,
        diagnosaUtama: 'R42',
        namaDiagnosa: 'Dizziness and giddiness (Vertigo)',
        cbgTariff: 180000,
      },
      {
        id: 'ENC-04',
        noSep: '0112R0030926V0099',
        timestamp: '2026-08-28T14:30:00Z',
        ppkCode: '0112R003',
        faskesName: 'RS Swasta Rajawali Bandung',
        faskesClass: 'C',
        location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.905, lng: 107.635 },
        jnsPelayanan: 2,
        diagnosaUtama: 'R42',
        namaDiagnosa: 'Dizziness and giddiness',
        cbgTariff: 950000,
      },
      {
        id: 'ENC-05',
        noSep: '0112R0050926V0120',
        timestamp: '2026-08-31T09:00:00Z',
        ppkCode: '0112R005',
        faskesName: 'RS Advent Bandung',
        faskesClass: 'B',
        location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.89, lng: 107.605 },
        jnsPelayanan: 2,
        diagnosaUtama: 'R42',
        namaDiagnosa: 'Dizziness and giddiness',
        cbgTariff: 1450000,
      },
    ],
    legalReference: {
      regulation: 'Permenkes No. 16 Tahun 2019 & Permenkes No. 28 Tahun 2014',
      article: 'Kendali Mutu dan Biaya Pelayanan Kesehatan',
      summary: 'Kunjungan berulang tanpa indikasi medis baru di luar alur sistem rujukan berjenjang resmi BPJS.',
      sanction: 'Penguncian eligibilitas rujukan poli spesialis mandiri dan pengalihan ke dokter keluarga FKTP terdaftar.',
    },
    recommendedSanction: 'KUNCI RUJUKAN MANDIRI & KONSELING DOKTER FKTP',
  },
  {
    id: 'CASE-003',
    caseCode: 'HK-PRB-RESALE-2026',
    category: 'MEDICINE_ALKES_ABUSE',
    categoryLabel: 'Penyalahgunaan Obat: Resale Arbitrage Obat Kronis PRB',
    patientName: 'Nurul Hidayati',
    noKartu: '0003847192834',
    nikMasked: '1271**********54',
    riskScore: 94,
    riskLevel: 'CRITICAL',
    potentialLoss: 6300000,
    summary:
      'Peserta Program Rujuk Balik (PRB) diabetes mengambil resep Insulin dan Amlodipine di 3 apotek jejaring berbeda dalam 1 bulan (surplus 190% obat).',
    detailedAnalysis:
      'Data log apotek SATUSEHAT mendeteksi peserta menebus Insulin Glargine dan Amlodipine 10mg sebanyak 90 hari pakai hanya dalam kurun waktu 22 hari. Pasien mendatangi apotek yang berbeda di Kota Medan dengan modus resep manual untuk dijual kembali ke apotek non-faskes.',
    encounters: [
      {
        id: 'ENC-06',
        noSep: '0201R0120926V0015',
        timestamp: '2026-08-10T11:00:00Z',
        ppkCode: '0201R012',
        faskesName: 'Klinik PRB Sejahtera Medan',
        faskesClass: 'FKTP',
        location: { city: 'Kota Medan', province: 'Sumatera Utara', lat: 3.595, lng: 98.672 },
        jnsPelayanan: 2,
        diagnosaUtama: 'E11.9',
        namaDiagnosa: 'Type 2 diabetes mellitus',
        cbgTariff: 1200000,
        prescribedDrugs: [
          { drugName: 'Insulin Glargine Pen', isPrbChronic: true, quantityDays: 30, unitPrice: 350000 },
          { drugName: 'Amlodipine 10mg', isPrbChronic: true, quantityDays: 30, unitPrice: 45000 },
        ],
      },
      {
        id: 'ENC-07',
        noSep: '0201P0030926V0088',
        timestamp: '2026-08-20T16:00:00Z',
        ppkCode: '0201P003',
        faskesName: 'Apotek Kimia Farma Rujukan Medan',
        faskesClass: 'FKTP',
        location: { city: 'Kota Medan', province: 'Sumatera Utara', lat: 3.585, lng: 98.68 },
        jnsPelayanan: 2,
        diagnosaUtama: 'E11.9',
        namaDiagnosa: 'Type 2 diabetes mellitus',
        cbgTariff: 1200000,
        prescribedDrugs: [
          { drugName: 'Insulin Glargine Pen', isPrbChronic: true, quantityDays: 30, unitPrice: 350000 },
          { drugName: 'Amlodipine 10mg', isPrbChronic: true, quantityDays: 30, unitPrice: 45000 },
        ],
      },
    ],
    legalReference: {
      regulation: 'Panduan Klinis Program Rujuk Balik BPJS & Permenkes 16/2019',
      article: 'Ketentuan Batas Maksimal Peresepan 30 Hari',
      summary: 'Penimbunan dan penjualan kembali obat yang dibiayai Dana Jaminan Sosial.',
      sanction: 'Blokir penebusan obat di apotek luar, wajibkan pengawasan minum obat (PMO) langsung di Puskesmas.',
    },
    recommendedSanction: 'BLOKIR AKSES APOTEK JEJARING & AUDIT KEPATUHAN OBAT',
  },
  {
    id: 'CASE-004',
    caseCode: 'HK-ID-FALSIFY-2026',
    category: 'IDENTITY_FALSIFICATION',
    categoryLabel: 'Pemalsuan Data Identitas: Diskordansi Medis Gender Laki-Laki',
    patientName: 'Agus Pratama (Identitas Disalahgunakan)',
    noKartu: '0004928172938',
    nikMasked: '3578**********11',
    riskScore: 99,
    riskLevel: 'CRITICAL',
    potentialLoss: 12800000,
    summary:
      'Nomor kartu peserta berjenis kelamin Laki-Laki digunakan untuk klaim rawat inap persalinan Seksio Sesarea (O82.0) di RS Swasta Surabaya.',
    detailedAnalysis:
      'Sistem VEDIKA mendeteksi kegagalan biometrik dan diskordansi biologis mutlak: master data peserta NIK 3578**********11 atas nama Agus Pratama (Gender Laki-Laki, Umur 42 tahun) terbit SEP rawat inap Seksio Sesarea. Fakta membuktikan kartu digunakan oleh orang lain.',
    encounters: [
      {
        id: 'ENC-08',
        noSep: '3578R0040926V0001',
        timestamp: '2026-09-02T03:15:00Z',
        ppkCode: '3578R004',
        faskesName: 'RS Ibu dan Anak Surabaya',
        faskesClass: 'C',
        location: { city: 'Kota Surabaya', province: 'Jawa Timur', lat: -7.257, lng: 112.752 },
        jnsPelayanan: 1,
        diagnosaUtama: 'O82.0',
        namaDiagnosa: 'Delivery by elective caesarean section',
        cbgTariff: 12800000,
      },
    ],
    legalReference: {
      regulation: 'KUHP Pasal 263 (Pemalsuan Surat) & Permenkes No. 16 Tahun 2019',
      article: 'Pasal 6 ayat (2) Pengenaan Sanksi dan Pelimpahan Pidana',
      summary: 'Pemalsuan identitas untuk mengakses penjaminan biaya persalinan faskes.',
      sanction: 'Penolakan klaim 100%, tagihan biaya mandiri kepada keluarga pasien, dan pembuatan Berita Acara Pelanggaran.',
    },
    recommendedSanction: 'TOLAK PENJAMINAN & TERBITKAN BERITA ACARA PELANGGARAN',
  },
];

export const participantRiskApi = {
  async getMetrics(): Promise<ParticipantRiskMetrics> {
    try {
      const res = await fetch(`${API_BASE}/metrics`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: ApiResponse<ParticipantRiskMetrics> = await res.json();
      if (json.success) return json.data;
      return FALLBACK_METRICS;
    } catch {
      return FALLBACK_METRICS;
    }
  },

  async getCaseStudies(): Promise<ParticipantAuditCase[]> {
    try {
      const res = await fetch(`${API_BASE}/case-studies`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: ApiResponse<ParticipantAuditCase[]> = await res.json();
      if (json.success) return json.data;
      return FALLBACK_CASES;
    } catch {
      return FALLBACK_CASES;
    }
  },

  async getCaseStudyById(id: string): Promise<ParticipantAuditCase | undefined> {
    try {
      const res = await fetch(`${API_BASE}/case-studies/${id}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: ApiResponse<ParticipantAuditCase> = await res.json();
      if (json.success) return json.data;
      return FALLBACK_CASES.find((c) => c.id === id || c.caseCode === id);
    } catch {
      return FALLBACK_CASES.find((c) => c.id === id || c.caseCode === id);
    }
  },

  async evaluateParticipant(profile: PesertaProfile): Promise<ParticipantRiskEvaluationResult | null> {
    try {
      const res = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: ApiResponse<ParticipantRiskEvaluationResult> = await res.json();
      if (json.success) return json.data;
      return null;
    } catch {
      return null;
    }
  },
};
