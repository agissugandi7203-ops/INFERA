import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Glasses,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { MetricCard } from '../components/charts/MetricCard';

interface PharmacyCase {
  id: string;
  patientName: string;
  nik: string;
  score: number;
  tipeModus: string;
  namaObat: string;
  totalHariSuplai: number;
  intervalPengambilanHari: number;
  overlapPercentage: number;
  totalBiaya: string;
  apotekList: Array<{
    nama: string;
    tgl: string;
    jatahHari: number;
    biaya: string;
    isOverLimit?: boolean;
  }>;
  aiExplanation: string;
  legalBasis: string;
}

const PHARMACY_CASES: PharmacyCase[] = [
  {
    id: 'HK-PRB-01',
    patientName: 'Nurul Hidayati',
    nik: '1271**********54',
    score: 94,
    tipeModus: 'Resale Arbitrage Obat PRB',
    namaObat: 'Insulin Glargine Pen + Amlodipine 10mg',
    totalHariSuplai: 90,
    intervalPengambilanHari: 22,
    overlapPercentage: 190,
    totalBiaya: 'Rp 1.185.000',
    apotekList: [
      {
        nama: 'Apotek Kimia Farma Juanda',
        tgl: '10 Agu 2026',
        jatahHari: 30,
        biaya: 'Rp 395.000',
        isOverLimit: false,
      },
      {
        nama: 'Apotek K-24 Gatot Subroto',
        tgl: '20 Agu 2026 (+10h)',
        jatahHari: 30,
        biaya: 'Rp 395.000',
        isOverLimit: false,
      },
      {
        nama: 'Apotek Sehat Sentosa Medan',
        tgl: '31 Agu 2026 (+11h)',
        jatahHari: 30,
        biaya: 'Rp 395.000',
        isOverLimit: true,
      },
    ],
    aiExplanation:
      'Pasien mengambil suplai obat kronis Program Rujuk Balik (PRB) untuk kebutuhan 90 hari hanya dalam rentang waktu 22 hari di 3 apotek jejaring berbeda. Terjadi overlap kuota 190% di atas kebutuhan wajar medis, mengindikasikan kuat pengumpulan obat bersubsidi untuk tujuan resale (dijual kembali ke pasar gelap).',
    legalBasis: 'Permenkes No. 26/2021 & Panduan Tata Laksana PRB BPJS Kesehatan (Maksimal 30 hari/siklus)',
  },
  {
    id: 'HK-ALKES-01',
    patientName: 'Ahmad Fauzi',
    nik: '3374**********89',
    score: 82,
    tipeModus: 'Pelanggaran Cooling-Off Kacamata',
    namaObat: 'Klaim Kacamata Koreksi Visus Sferis -2.5',
    totalHariSuplai: 0,
    intervalPengambilanHari: 0,
    overlapPercentage: 0,
    totalBiaya: 'Rp 330.000',
    apotekList: [
      {
        nama: 'Optik Melawai Semarang',
        tgl: '14 Nov 2025',
        jatahHari: 730,
        biaya: 'Rp 330.000',
        isOverLimit: false,
      },
      {
        nama: 'Optik Seis Mall Paragon',
        tgl: '18 Agu 2026 (9 bln kemudian)',
        jatahHari: 730,
        biaya: 'Rp 330.000',
        isOverLimit: true,
      },
    ],
    aiExplanation:
      'Klaim kacamata diajukan kembali setelah 9 bulan dari klaim sebelumnya. Sesuai regulasi penjaminan alat kesehatan BPJS Kesehatan, klaim kacamata memiliki masa jeda (cooling-off period) minimal 2 tahun (24 bulan) sekali.',
    legalBasis: 'Perpres No. 82/2018 Pasal 54 & Permenkes No. 3/2023 tentang Manfaat Alat Kesehatan JKN',
  },
];

export const PharmacyAlkesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCaseId, setSelectedCaseId] = useState<string>('HK-PRB-01');
  const [analyzedCases, setAnalyzedCases] = useState<Record<string, boolean>>({
    'HK-PRB-01': true,
  });
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const currentCase = PHARMACY_CASES.find((c) => c.id === selectedCaseId) || PHARMACY_CASES[0]!;
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
              Resep PRB &amp; Klaim Alkes
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              MODUS 4
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pengawasan rasio tumpang tindih resep kronis (POR) dan penegakan batas jeda (cooling-off) alat kesehatan.
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
              <span>Memvalidasi Kuota Apotek...</span>
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
          title="Prescription Overlap Ratio"
          value="182%"
          subtitle="Ambang batas normal: 100% - 120%"
          badgeText="Kritikal"
          icon={Pill}
          iconColorClass="text-rose-600"
          iconBgClass="bg-rose-50"
        />
        <MetricCard
          title="Pelanggaran Cooling-Off"
          value="29 Klaim"
          subtitle="Kacamata &amp; alat bantu < 24 bulan"
          badgeText="Audit Alkes"
          icon={Glasses}
          iconColorClass="text-amber-600"
          iconBgClass="bg-amber-50"
        />
        <MetricCard
          title="Dana Farmasi Diamankan"
          value="Rp 84.6 Jt"
          subtitle="Suplai ilegal berhasil diblokir"
          badgeText="DJS Terlindungi"
          icon={ShieldCheck}
          iconColorClass="text-emerald-600"
          iconBgClass="bg-emerald-50"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 4 Cols: Cases Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Antrean Verifikasi Farmasi
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Pilih Kasus</span>
          </div>

          <div className="space-y-2.5">
            {PHARMACY_CASES.map((item) => {
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
                  <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1">
                    {item.tipeModus}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono text-rose-600 dark:text-rose-400 font-semibold">{item.totalBiaya}</span>
                    {hasAnalyzed ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Terverifikasi AI
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

        {/* Right 8 Cols: Interactive Visual Overlap Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
            {/* Case Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Audit Peresepan: {currentCase.patientName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">({currentCase.nik})</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Item: <strong className="text-slate-700 dark:text-slate-300">{currentCase.namaObat}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block">Total Klaim Farmasi:</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {currentCase.totalBiaya}
                </span>
              </div>
            </div>

            {/* Visual Overlap Bar (Intuitive, Clean) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Visualisasi Kuota vs Realisasi Pengambilan
                </span>
                {currentCase.overlapPercentage > 0 && (
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    Overlap {currentCase.overlapPercentage}% (Surplus {currentCase.totalHariSuplai - 30} Hari)
                  </span>
                )}
              </div>

              {/* Visual Progress Bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>Jatah Maksimal Pasien PRB (1 Bulan):</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">30 Hari</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[33%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>Total Obat Diambil (dalam 22 Hari):</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{currentCase.totalHariSuplai || 180} Hari</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-600 rounded-full w-[100%]" />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Obat diambil 3x sebelum jatah obat pertama habis (indikasi kuat penimbunan stok/resale).</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shrink-0">
                  ANOMALI ARBITRAGE
                </span>
              </div>
            </div>

            {/* Apotek Breakdown Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">
                Jejaring Titik Pengambilan Terdaftar
              </span>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 text-xs">
                {currentCase.apotekList.map((ap, idx) => (
                  <div
                    key={idx}
                    className={`p-3 flex items-center justify-between gap-2 ${
                      ap.isOverLimit
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{ap.nama}</div>
                      <div className="text-[11px] text-slate-400">{ap.tgl}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">{ap.biaya}</div>
                      <div className="text-[10px] text-slate-400">Suplai {ap.jatahHari} Hari</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Reasoning Response Card */}
            {isAnalyzed ? (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-600/40 dark:border-emerald-500/40 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Penalaran Klinis AI &amp; Dasar Hukum</span>
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
                  Siap untuk Pemindaian Integritas Resep
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Klik &quot;Jalankan Audit AI&quot; untuk menghitung rasio overlap dan memeriksa kepatuhan batas interval hari suplai.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
