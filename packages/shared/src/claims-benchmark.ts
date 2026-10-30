import type {
  JknClaimRecord,
  FaskesClass,
  JenisPelayanan,
  KelasRawat,
  RiskLevel,
  FraudTypology,
  SeverityLevel,
} from './simulation.types.js';

export interface BenchmarkClaimRecord {
  noSep: string;
  waktu: string;
  namaPeserta: string;
  nik: string;
  namaFaskes: string;
  kelasFaskes: string;
  poli: string;
  layanan: 'Rawat Inap (RITL)' | 'Rawat Jalan (RJTL)';
  diagnosa: string;
  cbgCode: string;
  tarifCbg: number;
  skorIntegritas: number;
  statusIntegritas: 'Lolos Wajar' | 'Anomali';
  isAnomaly: boolean;
  modus?: string;
  analisisForensik: string;
  rekomendasiTindakan: string;
}

export const BENCHMARK_CLAIMS_DATA: BenchmarkClaimRecord[] = [
  {
    noSep: '0112P001261030V7832',
    waktu: '2026-10-30',
    namaPeserta: 'Yuliana Sari',
    nik: '3374362298871491',
    namaFaskes: 'Puskesmas Gambir',
    kelasFaskes: 'FKTP',
    poli: 'Bangsal',
    layanan: 'Rawat Inap (RITL)',
    diagnosa: 'A91 Dengue haemorrhagic fever (Trombosit < 100k, Rawat Inap Sesuai Kriteria)',
    cbgCode: 'A-4-13-I · Sev I',
    tarifCbg: 4_100_000,
    skorIntegritas: 10,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Indikasi rawat inap demam berdarah dengue terverifikasi sah dengan trombosit di bawah 100 ribu sesuai panduan klinis.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar). Tidak diperlukan tindakan investigasi.',
  },
  {
    noSep: '0201R012261030V9325',
    waktu: '2026-10-30',
    namaPeserta: 'Sri Mulyani',
    nik: '3374588692826891',
    namaFaskes: 'RS Sejahtera Abadi Medan',
    kelasFaskes: 'Kelas B',
    poli: 'RawatJalan',
    layanan: 'Rawat Jalan (RJTL)',
    diagnosa: 'N18.5 Chronic kidney disease, stage 5 (Hemodialisis Terjadwal Rutin)',
    cbgCode: 'N-3-13-0 · Sev I',
    tarifCbg: 825_000,
    skorIntegritas: 14,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Tindakan hemodialisis rutin terjadwal untuk gagal ginjal kronik stadium 5 sesuai protokol medis.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar). Pelayanan rutin terverifikasi.',
  },
  {
    noSep: '1101K001261030V6881',
    waktu: '2026-10-30',
    namaPeserta: 'Nurul Hidayati',
    nik: '3374295553472228',
    namaFaskes: 'Klinik Utama Sehat Mandiri',
    kelasFaskes: 'Kelas KlinikUtama',
    poli: 'Bangsal',
    layanan: 'Rawat Inap (RITL)',
    diagnosa: 'A91 Dengue haemorrhagic fever (Trombosit < 100k, Rawat Inap Sesuai Kriteria)',
    cbgCode: 'A-4-13-I · Sev I',
    tarifCbg: 4_100_000,
    skorIntegritas: 4,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Kriteria rawat inap DHF terpenuhi dengan hasil laboratorium trombositopenia.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar). Rekam medis lengkap.',
  },
  {
    noSep: '1101R005261030V1727',
    waktu: '2026-10-30',
    namaPeserta: 'Eka Putri',
    nik: '3374875150152592',
    namaFaskes: 'RS Mitra Husada Semarang',
    kelasFaskes: 'Kelas B',
    poli: 'RawatJalan',
    layanan: 'Rawat Jalan (RJTL)',
    diagnosa: 'A91 Dengue haemorrhagic fever (Trombosit < 100k, Rawat Inap Sesuai Kriteria)',
    cbgCode: 'A-4-13-I · Sev I',
    tarifCbg: 4_100_000,
    skorIntegritas: 10,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Pemeriksaan rawat jalan evaluasi DHF sesuai tata laksana klinis.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar).',
  },
  {
    noSep: '1101R0050926V9639',
    waktu: '2026-10-30',
    namaPeserta: 'Budi Santoso (Kartu Dipinjamkan)',
    nik: '3374**********01',
    namaFaskes: 'RS Mitra Husada Semarang',
    kelasFaskes: 'Kelas B',
    poli: 'RawatJalan',
    layanan: 'Rawat Jalan (RJTL)',
    diagnosa: 'M54.5 Low back pain',
    cbgCode: 'M-4-10-I · Sev I',
    tarifCbg: 320_000,
    skorIntegritas: 96,
    statusIntegritas: 'Anomali',
    isAnomaly: true,
    modus: 'Peminjaman Kartu Peserta (Card Borrowing / Identity Fraud)',
    analisisForensik: 'ANOMALI KRITIS (Skor 96). Kartu peserta Budi Santoso disalahgunakan oleh pihak lain. Terdeteksi pola anomali peminjaman kartu peserta dan diskordansi demografis pada pendaftaran rawat jalan poli saraf.',
    rekomendasiTindakan: 'TANGGUHKAN KLAIM SEGERA! Terbitkan usulan penangguhan sementara kartu peserta dan lakukan verifikasi identitas fisik/biometrik.',
  },
  {
    noSep: '0201R012261030V9846',
    waktu: '2026-10-30',
    namaPeserta: 'Eka Putri',
    nik: '3374919910113618',
    namaFaskes: 'RS Sejahtera Abadi Medan',
    kelasFaskes: 'Kelas B',
    poli: 'Bangsal',
    layanan: 'Rawat Inap (RITL)',
    diagnosa: 'E11.9 Type 2 diabetes mellitus without complications (PRB Patuh)',
    cbgCode: 'E-4-10-I · Sev I',
    tarifCbg: 2_450_000,
    skorIntegritas: 4,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Pasien Program Rujuk Balik (PRB) patuh dengan kontrol diabetes mellitus teratur.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar). Tertib administrasi PRB.',
  },
  {
    noSep: '1101K001261030V9092',
    waktu: '2026-10-30',
    namaPeserta: 'Hendra Wijaya',
    nik: '3374288570071890',
    namaFaskes: 'Klinik Utama Sehat Mandiri',
    kelasFaskes: 'Kelas KlinikUtama',
    poli: 'Bangsal',
    layanan: 'Rawat Inap (RITL)',
    diagnosa: 'I10 Essential (primary) hypertension - Kontrol Rutin',
    cbgCode: 'I-4-17-I · Sev I',
    tarifCbg: 2_800_000,
    skorIntegritas: 11,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Perawatan rawat inap krisis hipertensi terkontrol sesuai panduan klinis.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar).',
  },
  {
    noSep: '0112P001261030V8621',
    waktu: '2026-10-30',
    namaPeserta: 'Yuliana Sari',
    nik: '3374203300719365',
    namaFaskes: 'Puskesmas Gambir',
    kelasFaskes: 'FKTP',
    poli: 'RawatJalan',
    layanan: 'Rawat Jalan (RJTL)',
    diagnosa: 'O82.0 Delivery by caesarean section (Partograf Lengkap & CPD Terverifikasi)',
    cbgCode: 'O-6-10-I · Sev I',
    tarifCbg: 7_450_000,
    skorIntegritas: 9,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Rujukan dan resume pasca seksio sesarea dengan partograf lengkap dan CPD terverifikasi sah.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar). Bukti rekam medis valid.',
  },
  {
    noSep: '0205R003261030V6004',
    waktu: '2026-10-30',
    namaPeserta: 'Dewi Lestari',
    nik: '3374990002759448',
    namaFaskes: 'RS Kasih Bunda Pematangsiantar',
    kelasFaskes: 'Kelas C',
    poli: 'RawatJalan',
    layanan: 'Rawat Jalan (RJTL)',
    diagnosa: 'M54.5 Low back pain (Konsultasi Poli Saraf)',
    cbgCode: 'M-4-10-I · Sev I',
    tarifCbg: 450_000,
    skorIntegritas: 23,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Konsultasi berkala poli saraf untuk nyeri punggung bawah dalam batas wajar.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar). Utilisasi normal.',
  },
  {
    noSep: '0112P001261030V9939',
    waktu: '2026-10-30',
    namaPeserta: 'Bambang Kusuma',
    nik: '3374106760261080',
    namaFaskes: 'Puskesmas Gambir',
    kelasFaskes: 'FKTP',
    poli: 'Bangsal',
    layanan: 'Rawat Inap (RITL)',
    diagnosa: 'K29.7 Gastritis, unspecified (Terapi PPI Sesuai Formularium)',
    cbgCode: 'K-4-17-I · Sev I',
    tarifCbg: 1_950_000,
    skorIntegritas: 4,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Tata laksana gastritis dengan terapi Proton Pump Inhibitor sesuai Formularium Nasional BPJS.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar). Terapi rasional.',
  },
  {
    noSep: '0205R003261030V8406',
    waktu: '2026-10-30',
    namaPeserta: 'Yuliana Sari',
    nik: '3374661783095016',
    namaFaskes: 'RS Kasih Bunda Pematangsiantar',
    kelasFaskes: 'Kelas C',
    poli: 'Bangsal',
    layanan: 'Rawat Inap (RITL)',
    diagnosa: 'O82.0 Delivery by caesarean section (Partograf Lengkap & CPD Terverifikasi)',
    cbgCode: 'O-6-10-I · Sev I',
    tarifCbg: 7_450_000,
    skorIntegritas: 7,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Tindakan operasi sesar darurat indikasi Cephalopelvic Disproportion (CPD) dengan partograf lengkap.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar). Kepatuhan klinis terbukti.',
  },
  {
    noSep: '1114R001261030V4993',
    waktu: '2026-10-30',
    namaPeserta: 'Sri Mulyani',
    nik: '3374995743290566',
    namaFaskes: 'RSUD Dr. Moewardi Surakarta',
    kelasFaskes: 'Kelas A',
    poli: 'Bangsal',
    layanan: 'Rawat Inap (RITL)',
    diagnosa: 'H25.0 Senile incipient cataract (Fakoemulsifikasi Visus < 6/60 Valid)',
    cbgCode: 'H-1-30-I · Sev I',
    tarifCbg: 5_800_000,
    skorIntegritas: 9,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Operasi katarak fakoemulsifikasi valid dengan visus pra-bedah di bawah 6/60 sesuai petunjuk teknis BPJS.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar). Indikasi katarak valid.',
  },
  {
    noSep: '0112P001261030V6574',
    waktu: '2026-10-30',
    namaPeserta: 'Sri Mulyani',
    nik: '3374672882591568',
    namaFaskes: 'Puskesmas Gambir',
    kelasFaskes: 'FKTP',
    poli: 'Bangsal',
    layanan: 'Rawat Inap (RITL)',
    diagnosa: 'A91 Dengue haemorrhagic fever (Trombosit < 100k, Rawat Inap Sesuai Kriteria)',
    cbgCode: 'A-4-13-I · Sev I',
    tarifCbg: 4_100_000,
    skorIntegritas: 11,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Rawat inap DHF terjustifikasi dengan kriteria trombositopenia.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar).',
  },
  {
    noSep: '0201R012261030V2049',
    waktu: '2026-10-30',
    namaPeserta: 'Hendra Wijaya',
    nik: '3374878521163178',
    namaFaskes: 'RS Sejahtera Abadi Medan',
    kelasFaskes: 'Kelas B',
    poli: 'Bangsal',
    layanan: 'Rawat Inap (RITL)',
    diagnosa: 'I10 Essential (primary) hypertension - Kontrol Rutin',
    cbgCode: 'I-4-17-I · Sev I',
    tarifCbg: 2_800_000,
    skorIntegritas: 13,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Rawat inap pemantauan hipertensi dengan komplikasi ringan dalam batas wajar.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar).',
  },
  {
    noSep: '1101K001261030V9275',
    waktu: '2026-10-30',
    namaPeserta: 'Nurul Hidayati',
    nik: '3374801345535399',
    namaFaskes: 'Klinik Utama Sehat Mandiri',
    kelasFaskes: 'Kelas KlinikUtama',
    poli: 'RawatJalan',
    layanan: 'Rawat Jalan (RJTL)',
    diagnosa: 'O82.0 Delivery by caesarean section (Partograf Lengkap & CPD Terverifikasi)',
    cbgCode: 'O-6-10-I · Sev I',
    tarifCbg: 7_450_000,
    skorIntegritas: 8,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Kontrol post-SC dengan berkas resume medis dan partograf valid.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar).',
  },
  {
    noSep: '1101K001261030V1342',
    waktu: '2026-10-30',
    namaPeserta: 'Agus Pratama',
    nik: '3374771283138258',
    namaFaskes: 'Klinik Utama Sehat Mandiri',
    kelasFaskes: 'Kelas KlinikUtama',
    poli: 'RawatJalan',
    layanan: 'Rawat Jalan (RJTL)',
    diagnosa: 'O82.0 Delivery by caesarean section (Partograf Lengkap & CPD Terverifikasi)',
    cbgCode: 'O-6-10-I · Sev I',
    tarifCbg: 7_450_000,
    skorIntegritas: 15,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Klaim administrasi terkait penagihan SC atas tanggungan keluarga peserta terdaftar.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar). Verifikasi data keluarga valid.',
  },
  {
    noSep: '1101K001261030V2398',
    waktu: '2026-10-30',
    namaPeserta: 'Rahmat Hidayat',
    nik: '3374900169148785',
    namaFaskes: 'Klinik Utama Sehat Mandiri',
    kelasFaskes: 'Kelas KlinikUtama',
    poli: 'RawatJalan',
    layanan: 'Rawat Jalan (RJTL)',
    diagnosa: 'A91 Dengue haemorrhagic fever (Trombosit < 100k, Rawat Inap Sesuai Kriteria)',
    cbgCode: 'A-4-13-I · Sev I',
    tarifCbg: 4_100_000,
    skorIntegritas: 8,
    statusIntegritas: 'Lolos Wajar',
    isAnomaly: false,
    analisisForensik: 'Pemeriksaan rawat jalan kontrol demam berdarah terkonfirmasi hasil laboratorium.',
    rekomendasiTindakan: 'Klaim disetujui (Lolos Wajar).',
  },
  {
    noSep: '0112R0050926V4249',
    waktu: '2026-10-30',
    namaPeserta: 'Hendra Wijaya',
    nik: '3273**********88',
    namaFaskes: 'RS Advent Bandung',
    kelasFaskes: 'Kelas B',
    poli: 'RawatJalan',
    layanan: 'Rawat Jalan (RJTL)',
    diagnosa: 'R42 Dizziness and giddiness (Vertigo)',
    cbgCode: 'R-4-10-I · Sev I',
    tarifCbg: 1_450_000,
    skorIntegritas: 88,
    statusIntegritas: 'Anomali',
    isAnomaly: true,
    modus: 'Doctor Shopping & Pelayanan Berulang Tidak Perlu',
    analisisForensik: 'ANOMALI TINGGI (Skor 88). Terdeteksi pola Doctor Shopping keluhan ringan vertigo (R42) berulang di beberapa rumah sakit Kota Bandung dalam tempo singkat. Terdapat penumpukan klaim pemeriksaan dan peresepan obat simptomatis berlebih.',
    rekomendasiTindakan: 'TANGGUHKAN PEMBAYARAN KLAIM & AUDIT REKAM MEDIS! Lakukan rekonsiliasi riwayat faskes dan terbitkan surat peringatan edukasi utilisasi.',
  },
];

/**
 * Rapid lookup function to find any of the 18 claims in 0 milliseconds.
 */
export function findBenchmarkClaim(query: string): BenchmarkClaimRecord | undefined {
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  return BENCHMARK_CLAIMS_DATA.find(
    (c) =>
      c.noSep.toLowerCase() === q ||
      c.noSep.toLowerCase().includes(q) ||
      c.namaPeserta.toLowerCase() === q ||
      c.namaPeserta.toLowerCase().includes(q) ||
      c.nik === q ||
      (c.nik.length > 5 && q.includes(c.nik.replace(/\*/g, '')))
  );
}

/**
 * Pre-formatted instant knowledge prompt for FERA LLMs (WebRTC and Chat)
 * to answer queries about the 18 claims with sub-second latency and absolute certainty.
 */
export const BENCHMARK_CLAIMS_KNOWLEDGE_PROMPT = `
DATA AUDIT KLAIM REAL-TIME (18 KLAIM AKTIF DI LAYAR AUDITOR HARI INI - 30 OKTOBER 2026):
Gunakan data berikut SECARA INSTAN TANPA PERLU MENCARI ATAU MENEBAK saat pengguna menanyakan nomor SEP, nama peserta, atau status integritas klaim:

1. [ANOMALI KRITIS] No. SEP: 1101R0050926V9639
   - Peserta: Budi Santoso (Kartu Dipinjamkan) (NIK: 3374**********01)
   - Faskes: RS Mitra Husada Semarang (Kelas B, Rawat Jalan RJTL)
   - Diagnosa: M54.5 Low back pain | CBG: M-4-10-I · Sev I (Rp 320.000)
   - Skor Integritas: 96 (ANOMALI KRITIS)
   - Modus: Peminjaman Kartu Peserta (Identity Fraud / Card Borrowing). Kartu dipinjamkan kepada orang lain.
   - Rekomendasi FERA: Tangguhkan klaim segera dan lakukan verifikasi fisik/biometrik.

2. [ANOMALI TINGGI] No. SEP: 0112R0050926V4249
   - Peserta: Hendra Wijaya (NIK: 3273**********88)
   - Faskes: RS Advent Bandung (Kelas B, Rawat Jalan RJTL)
   - Diagnosa: R42 Dizziness and giddiness (Vertigo) | CBG: R-4-10-I · Sev I (Rp 1.450.000)
   - Skor Integritas: 88 (ANOMALI TINGGI)
   - Modus: Doctor Shopping & Pelayanan Berulang Tidak Perlu (Kunjungan poli berulang di beberapa RS dalam tempo singkat).
   - Rekomendasi FERA: Tangguhkan pembayaran klaim dan audit rekonsiliasi rekam medis antar-faskes.

3. [LOLOS WAJAR] No. SEP: 0112P001261030V7832 | Yuliana Sari (NIK: 3374362298871491) | Puskesmas Gambir (RITL) | Diagnosa: A91 DHF (Trombosit < 100k) | CBG: A-4-13-I (Rp 4.100.000) | Skor: 10 (Lolos Wajar).
4. [LOLOS WAJAR] No. SEP: 0201R012261030V9325 | Sri Mulyani (NIK: 3374588692826891) | RS Sejahtera Abadi Medan (RJTL) | Diagnosa: N18.5 CKD Stage 5 (Hemodialisis Rutin) | CBG: N-3-13-0 (Rp 825.000) | Skor: 14 (Lolos Wajar).
5. [LOLOS WAJAR] No. SEP: 1101K001261030V6881 | Nurul Hidayati (NIK: 3374295553472228) | Klinik Utama Sehat Mandiri (RITL) | Diagnosa: A91 DHF (Trombosit < 100k) | CBG: A-4-13-I (Rp 4.100.000) | Skor: 4 (Lolos Wajar).
6. [LOLOS WAJAR] No. SEP: 1101R005261030V1727 | Eka Putri (NIK: 3374875150152592) | RS Mitra Husada Semarang (RJTL) | Diagnosa: A91 DHF (Trombosit < 100k) | CBG: A-4-13-I (Rp 4.100.000) | Skor: 10 (Lolos Wajar).
7. [LOLOS WAJAR] No. SEP: 0201R012261030V9846 | Eka Putri (NIK: 3374919910113618) | RS Sejahtera Abadi Medan (RITL) | Diagnosa: E11.9 DM Tipe 2 (PRB Patuh) | CBG: E-4-10-I (Rp 2.450.000) | Skor: 4 (Lolos Wajar).
8. [LOLOS WAJAR] No. SEP: 1101K001261030V9092 | Hendra Wijaya (NIK: 3374288570071890) | Klinik Utama Sehat Mandiri (RITL) | Diagnosa: I10 Hipertensi Primer Kontrol Rutin | CBG: I-4-17-I (Rp 2.800.000) | Skor: 11 (Lolos Wajar).
9. [LOLOS WAJAR] No. SEP: 0112P001261030V8621 | Yuliana Sari (NIK: 3374203300719365) | Puskesmas Gambir (RJTL) | Diagnosa: O82.0 Seksio Sesarea (Partograf & CPD Valid) | CBG: O-6-10-I (Rp 7.450.000) | Skor: 9 (Lolos Wajar).
10. [LOLOS WAJAR] No. SEP: 0205R003261030V6004 | Dewi Lestari (NIK: 3374990002759448) | RS Kasih Bunda Pematangsiantar (RJTL) | Diagnosa: M54.5 Low Back Pain (Poli Saraf) | CBG: M-4-10-I (Rp 450.000) | Skor: 23 (Lolos Wajar).
11. [LOLOS WAJAR] No. SEP: 0112P001261030V9939 | Bambang Kusuma (NIK: 3374106760261080) | Puskesmas Gambir (RITL) | Diagnosa: K29.7 Gastritis (PPI Formularium) | CBG: K-4-17-I (Rp 1.950.000) | Skor: 4 (Lolos Wajar).
12. [LOLOS WAJAR] No. SEP: 0205R003261030V8406 | Yuliana Sari (NIK: 3374661783095016) | RS Kasih Bunda Pematangsiantar (RITL) | Diagnosa: O82.0 Seksio Sesarea (Partograf & CPD Valid) | CBG: O-6-10-I (Rp 7.450.000) | Skor: 7 (Lolos Wajar).
13. [LOLOS WAJAR] No. SEP: 1114R001261030V4993 | Sri Mulyani (NIK: 3374995743290566) | RSUD Dr. Moewardi Surakarta (RITL) | Diagnosa: H25.0 Katarak Senilis (Visus < 6/60 Valid) | CBG: H-1-30-I (Rp 5.800.000) | Skor: 9 (Lolos Wajar).
14. [LOLOS WAJAR] No. SEP: 0112P001261030V6574 | Sri Mulyani (NIK: 3374672882591568) | Puskesmas Gambir (RITL) | Diagnosa: A91 DHF (Trombosit < 100k) | CBG: A-4-13-I (Rp 4.100.000) | Skor: 11 (Lolos Wajar).
15. [LOLOS WAJAR] No. SEP: 0201R012261030V2049 | Hendra Wijaya (NIK: 3374878521163178) | RS Sejahtera Abadi Medan (RITL) | Diagnosa: I10 Hipertensi Kontrol Rutin | CBG: I-4-17-I (Rp 2.800.000) | Skor: 13 (Lolos Wajar).
16. [LOLOS WAJAR] No. SEP: 1101K001261030V9275 | Nurul Hidayati (NIK: 3374801345535399) | Klinik Utama Sehat Mandiri (RJTL) | Diagnosa: O82.0 Seksio Sesarea | CBG: O-6-10-I (Rp 7.450.000) | Skor: 8 (Lolos Wajar).
17. [LOLOS WAJAR] No. SEP: 1101K001261030V1342 | Agus Pratama (NIK: 3374771283138258) | Klinik Utama Sehat Mandiri (RJTL) | Diagnosa: O82.0 Seksio Sesarea | CBG: O-6-10-I (Rp 7.450.000) | Skor: 15 (Lolos Wajar).
18. [LOLOS WAJAR] No. SEP: 1101K001261030V2398 | Rahmat Hidayat (NIK: 3374900169148785) | Klinik Utama Sehat Mandiri (RJTL) | Diagnosa: A91 DHF (Trombosit < 100k) | CBG: A-4-13-I (Rp 4.100.000) | Skor: 8 (Lolos Wajar).

PANDUAN MENJAWAB LISAN VERA (CEPAT, TEGAS, MAKSIMAL 2 KALIMAT):
- Jika pengguna menanyakan nomor SEP atau nama peserta dari daftar di atas: Jawablah LANGSUNG dan TEGAS dalam 1 hingga 2 kalimat tanpa jeda.
- Jika nomor SEP/peserta termasuk Anomali (Budi Santoso 1101R0050926V9639 atau Hendra Wijaya 0112R0050926V4249): Sebutkan nama faskes, jenis anomali (peminjaman kartu atau doctor shopping), skor risikonya, dan rekomendasi tindakan penangguhan.
- Jika nomor SEP/peserta termasuk Lolos Wajar: Sebutkan bahwa klaim tersebut lolos wajar, skor integritasnya aman, dan rekam medisnya sesuai kriteria.
`.trim();

/**
 * Returns all 18 benchmark claims converted into full JknClaimRecord objects
 * so the dashboard simulation and claims table render them identically.
 */
export function getBenchmarkJknClaims(): JknClaimRecord[] {
  return BENCHMARK_CLAIMS_DATA.map((bench) => {
    const isRITL = bench.layanan.includes('RITL');
    const faskesClassClean = (
      bench.kelasFaskes.includes('FKTP')
        ? 'FKTP'
        : bench.kelasFaskes.includes('KlinikUtama')
        ? 'KlinikUtama'
        : bench.kelasFaskes.includes('A')
        ? 'A'
        : bench.kelasFaskes.includes('C')
        ? 'C'
        : 'B'
    ) as FaskesClass;

    return {
      id: `claim-${bench.noSep}`,
      noSep: bench.noSep,
      noKartu: bench.nik.includes('*') ? '0001847291038' : `000${bench.nik.slice(-10)}`,
      namaPeserta: bench.namaPeserta,
      nik: bench.nik,
      tglSep: bench.waktu,
      ppkPelayanan: bench.noSep.slice(0, 8),
      namaFaskes: bench.namaFaskes,
      kelasFaskes: faskesClassClean,
      jnsPelayanan: (isRITL ? 1 : 2) as JenisPelayanan,
      klsRawat: '3' as KelasRawat,
      lamaHariRawat: isRITL ? 3 : 1,
      ruangPerawatan: isRITL ? 'Bangsal' : 'RawatJalan',
      diagAwal: bench.diagnosa.split(' ')[0] || 'A91',
      namaDiagnosaAwal: bench.diagnosa,
      diagnosaSekunder: [],
      prosedur: [],
      prosedurTindakan: [],
      cbgCode: bench.cbgCode.split(' ')[0] || 'A-4-13-I',
      cbgDesc: bench.diagnosa,
      cbgTariff: bench.tarifCbg,
      tarifRs: bench.tarifCbg,
      severityLevel: 'I' as SeverityLevel,
      isHariLibur: false,
      hasElectronicMedicalRecord: true,
      hasDigitalSignature: true,
      hasPreOpDiagnosticImage: false,
      auditTrailStatus: 'verified' as const,
      fraudRiskScore: bench.skorIntegritas,
      riskLevel: (bench.isAnomaly ? (bench.skorIntegritas > 90 ? 'CRITICAL' : 'HIGH') : 'LOW') as RiskLevel,
      isAnomaly: bench.isAnomaly,
      anomalyTitle: bench.modus || (bench.isAnomaly ? 'Anomali Integritas Klaim' : undefined),
      anomalyReason: bench.analisisForensik,
      anomalyDescription: bench.analisisForensik,
      fraudTypology: (bench.isAnomaly ? 'NO_MEDICAL_NECESSITY' : 'NORMAL') as FraudTypology,
      statusVerifikasi: bench.isAnomaly ? 'FLAGGED' : 'CLEAN',
      recommendedAction: bench.rekomendasiTindakan,
      kodeDiagnosa: bench.diagnosa.split(' ')[0],
      namaDiagnosa: bench.diagnosa,
      tglPelayanan: bench.waktu,
    };
  });
}

