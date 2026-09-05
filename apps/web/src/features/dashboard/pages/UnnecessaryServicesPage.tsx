import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Repeat,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { MetricCard } from '../components/charts/MetricCard';

interface ClinicVisit {
  faskes: string;
  tipeFaskes: string;
  tgl: string;
  intervalHari: string;
  keluhan: string;
  tindakan: string;
  biaya: string;
  isRedundant?: boolean;
}

interface DoctorShoppingCase {
  id: string;
  patientName: string;
  nik: string;
  score: number;
  diagnosa: string;
  totalInefisiensi: string;
  dsiValue: number;
  dsiThreshold: number;
  visits: ClinicVisit[];
  aiExplanation: string;
  legalBasis: string;
  recommendations: string[];
}

const CASES_DATA: DoctorShoppingCase[] = [
  {
    id: 'HK-DS-01',
    patientName: 'Hendra Wijaya',
    nik: '3273**********88',
    score: 88,
    diagnosa: 'R42 - Vertigo & Gangguan Keseimbangan',
    totalInefisiensi: 'Rp 4.200.000',
    dsiValue: 1.0,
    dsiThreshold: 0.3,
    visits: [
      {
        faskes: 'Klinik Pratama Sehat Sejahtera',
        tipeFaskes: 'FKTP Pertama',
        tgl: '26 Agu 2026',
        intervalHari: 'Hari ke-1',
        keluhan: 'Pusing berputar, mual',
        tindakan: 'Betahistine 6mg (Jatah 14 hari)',
        biaya: 'Rp 180.000',
        isRedundant: false,
      },
      {
        faskes: 'RS Rajawali Bandung',
        tipeFaskes: 'Poli Saraf (Kelas C)',
        tgl: '28 Agu 2026',
        intervalHari: '+2 Hari',
        keluhan: 'Pusing berputar, minta obat lebih kuat',
        tindakan: 'Flunarizine + Lab Darah Rutin',
        biaya: 'Rp 950.000',
        isRedundant: true,
      },
      {
        faskes: 'RS Advent Bandung',
        tipeFaskes: 'Instalasi Gawat Darurat (IGD)',
        tgl: '31 Agu 2026',
        intervalHari: '+3 Hari',
        keluhan: 'Pusing berputar (tanpa defisit neurologis)',
        tindakan: 'CT-Scan Kepala Non-Kontras Redundan',
        biaya: 'Rp 1.450.000',
        isRedundant: true,
      },
    ],
    aiExplanation:
      'Pasien mengunjungi 3 fasilitas kesehatan berbeda dalam kurun waktu 5 hari dengan diagnosa keluhan vertigo yang identik. Pemeriksaan penunjang laboratorium dan CT-Scan diulang tanpa indikasi kegawatdaruratan medis baru, sementara obat sebelumnya masih aktif. Pola ini terbukti sebagai Doctor Shopping untuk akumulasi resep dan utilisasi pemeriksaan yang tidak perlu.',
    legalBasis: 'Permenkes No. 16/2019 Pasal 5 ayat (3) & Pedoman Layanan INA-CBG (Unnecessary Utilization)',
    recommendations: [
      'Kunci rujukan mandiri bertingkat di sistem VClaim untuk diagnosa R42.',
      'Wajibkan review dokter keluarga FKTP sebelum penerbitan SEP subspesialis.',
      'Notifikasi edukasi hak layanan terbit ke akun Mobile JKN peserta.',
    ],
  },
  {
    id: 'HK-DS-02',
    patientName: 'Siti Rahayu',
    nik: '3204**********42',
    score: 74,
    diagnosa: 'M54.5 - Low Back Pain Kronis',
    totalInefisiensi: 'Rp 2.850.000',
    dsiValue: 0.67,
    dsiThreshold: 0.3,
    visits: [
      {
        faskes: 'Klinik Harapan Medika',
        tipeFaskes: 'FKTP Pertama',
        tgl: '02 Sep 2026',
        intervalHari: 'Hari ke-1',
        keluhan: 'Nyeri punggung bawah',
        tindakan: 'Meloxicam + Vitamin B Neuro',
        biaya: 'Rp 150.000',
        isRedundant: false,
      },
      {
        faskes: 'RS Al-Islam Bandung',
        tipeFaskes: 'Poli Bedah Tulang',
        tgl: '04 Sep 2026',
        intervalHari: '+2 Hari',
        keluhan: 'Nyeri punggung bawah menetap',
        tindakan: 'Rontgen Lumbal Redundan + Terapi Analgetik',
        biaya: 'Rp 820.000',
        isRedundant: true,
      },
    ],
    aiExplanation:
      'Pemeriksaan radiologi rontgen diulang di rumah sakit rujukan dalam 48 jam tanpa melampirkan hasil foto dari faskes tingkat pertama, menimbulkan duplikasi klaim tarif INA-CBG.',
    legalBasis: 'Permenkes No. 26/2021 tentang Efisiensi Penjaminan Mutu & Biaya Layanan',
    recommendations: [
      'Sinkronisasi riwayat radiologi digital melalui integrasi SATUSEHAT.',
      'Tolak tagihan klaim sekunder rontgen non-emergency.',
    ],
  },
];

export const UnnecessaryServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCaseId, setSelectedCaseId] = useState<string>('HK-DS-01');
  const [analyzedCases, setAnalyzedCases] = useState<Record<string, boolean>>({
    'HK-DS-01': true,
  });
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const currentCase = CASES_DATA.find((c) => c.id === selectedCaseId) || CASES_DATA[0]!;
  const isAnalyzed = !!analyzedCases[selectedCaseId];

  const handleRunAiAudit = () => {
    setIsScanning(true);
    setTimeout(() => {
      setAnalyzedCases((prev) => ({ ...prev, [selectedCaseId]: true }));
      setIsScanning(false);
    }, 550);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Doctor Shopping &amp; Layanan Redundan
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              MODUS 3
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analisis indeks pemanfaatan berulang (Doctor Shopping Index) untuk menghentikan pemborosan dana jaminan.
          </p>
        </div>

        <button
          onClick={handleRunAiAudit}
          disabled={isScanning}
          className="px-4 py-2 rounded-xl bg-[#007a3d] hover:bg-[#006633] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer self-start sm:self-auto disabled:opacity-60"
        >
          {isScanning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Memvalidasi Rekam Medis...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>{isAnalyzed ? 'Uji Analisis Ulang' : 'Jalankan Audit AI'}</span>
            </>
          )}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricCard
          title="DSI Rata-Rata Terindikasi"
          value="0.84"
          subtitle="Ambang batas aman BPJS: < 0.30"
          badgeText="Tinggi"
          icon={Repeat}
          iconColorClass="text-rose-600"
          iconBgClass="bg-rose-50"
        />
        <MetricCard
          title="Klaim Penunjang Redundan"
          value="42 Kasus"
          subtitle="Lab / CT-Scan diulang dalam 7 hari"
          badgeText="Audit VEDIKA"
          icon={Building2}
          iconColorClass="text-amber-600"
          iconBgClass="bg-amber-50"
        />
        <MetricCard
          title="Efisiensi Biaya Dicegah"
          value="Rp 194.2 Jt"
          subtitle="Duplikasi berhasil dibatalkan"
          badgeText="DJS Efisien"
          icon={ShieldCheck}
          iconColorClass="text-emerald-600"
          iconBgClass="bg-emerald-50"
        />
      </div>

      {/* Main Grid: Queue & Interactive Journey */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 4 Cols: Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Daftar Peserta Terindikasi
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Pilih Kasus</span>
          </div>

          <div className="space-y-2.5">
            {CASES_DATA.map((item) => {
              const isSelected = item.id === selectedCaseId;
              const hasAnalyzed = !!analyzedCases[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCaseId(item.id)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-[#007a3d] dark:border-emerald-500 shadow-md shadow-emerald-900/5 -translate-y-0.5'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.patientName}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                      Skor {item.score}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {item.diagnosa}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Inefisiensi: <strong className="font-mono text-rose-600 dark:text-rose-400">{item.totalInefisiensi}</strong></span>
                    {hasAnalyzed ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Audit Selesai
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                        <Clock className="w-3 h-3" /> Siap Diaudit
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Interactive Visual Journey & Reasoning */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Alur Kunjungan Faskes: {currentCase.patientName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">({currentCase.nik})</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Indeks Doctor Shopping: <strong className="font-mono text-rose-600 dark:text-rose-400">DSI {currentCase.dsiValue.toFixed(2)}</strong> (Ambang Batas: 0.30)
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block">Total Beban Klaim:</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {currentCase.totalInefisiensi}
                </span>
              </div>
            </div>

            {/* Clean Visual Timeline of Visits */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">
                Kronologi Kunjungan Faskes Terdeteksi
              </span>

              <div className="space-y-2.5">
                {currentCase.visits.map((visit, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      visit.isRedundant
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          visit.isRedundant
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{visit.faskes}</span>
                        <span className="text-[10px] text-slate-400">({visit.tipeFaskes})</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {visit.tgl} ({visit.intervalHari})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Keluhan &amp; Terapi</span>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {visit.tindakan}
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-slate-400 text-[10px] block">Biaya Klaim</span>
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {visit.biaya}
                          {visit.isRedundant && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300">
                              REDUNDAN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Reasoning Box */}
            {isAnalyzed ? (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-600/40 dark:border-emerald-500/40 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Kesimpulan AI &amp; Dasar Regulasi</span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentCase.aiExplanation}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    Regulasi: <strong className="text-slate-700 dark:text-slate-300">{currentCase.legalBasis}</strong>
                  </span>

                  <button
                    onClick={() => navigate('/dashboard/master-data')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Tindak Lanjuti di Master Data &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Data Kunjungan Siap Dievaluasi
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Klik tombol &quot;Jalankan Audit AI&quot; untuk menghitung rasio redundansi klinis dan memvalidasi dasar regulasi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
