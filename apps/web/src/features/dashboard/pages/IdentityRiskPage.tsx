import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  ShieldCheck,
  UserX,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { MetricCard } from '../components/charts/MetricCard';

interface TravelCase {
  id: string;
  patientName: string;
  nik: string;
  score: number;
  originCity: string;
  originHospital: string;
  originTime: string;
  originDiag: string;
  originTarif: string;
  destCity: string;
  destHospital: string;
  destTime: string;
  destDiag: string;
  destTarif: string;
  distanceKm: number;
  timeDiffMinutes: number;
  velocityKmH: number;
  aiExplanation: string;
  legalBasis: string;
  recommendation: string;
}

interface BiologyCase {
  id: string;
  patientName: string;
  nik: string;
  score: number;
  gender: 'LAKI-LAKI' | 'PEREMPUAN';
  age: number;
  hospital: string;
  claimDiag: string;
  diagCode: string;
  cbgTarif: string;
  aiExplanation: string;
  legalBasis: string;
  recommendation: string;
}

const TRAVEL_DATA: TravelCase[] = [
  {
    id: 'HK-TRAVEL-01',
    patientName: 'Budi Santoso',
    nik: '3374**********01',
    score: 96,
    originCity: 'Surakarta',
    originHospital: 'RSUD Dr. Moewardi',
    originTime: '08:30 WIB',
    originDiag: 'I21.0 - Infark Miokard Akut',
    originTarif: 'Rp 8.400.000',
    destCity: 'Semarang',
    destHospital: 'RS Mitra Husada',
    destTime: '09:15 WIB',
    destDiag: 'M54.5 - Low Back Pain',
    destTarif: 'Rp 320.000',
    distanceKm: 63.5,
    timeDiffMinutes: 45,
    velocityKmH: 84.7,
    aiExplanation:
      'Pasien terdaftar rawat inap di Surakarta pada jam 08:30, namun kartu yang sama dipakai berobat rawat jalan di Semarang pada jam 09:15. Kecepatan fisik yang dibutuhkan 84.7 km/jam melewati estimasi lalu lintas normal Jawa Tengah, mengindikasikan kuat kartu dipinjamkan.',
    legalBasis: 'Perpres No. 82/2018 Pasal 97 & KUHP Pasal 263 (Pemalsuan Dokumen/Identitas)',
    recommendation: 'Kunci penerbitan SEP kedua seketika & bekukan hak penjaminan klaim.',
  },
  {
    id: 'HK-TRAVEL-02',
    patientName: 'Dewi Lestari',
    nik: '3273**********44',
    score: 92,
    originCity: 'Bandung',
    originHospital: 'RSUP Dr. Hasan Sadikin',
    originTime: '10:00 WIB',
    originDiag: 'E11.9 - DM Tipe 2',
    originTarif: 'Rp 210.000',
    destCity: 'Jakarta Selatan',
    destHospital: 'RS Fatmawati',
    destTime: '10:30 WIB',
    destDiag: 'K29.7 - Gastritis Akut',
    destTarif: 'Rp 195.000',
    distanceKm: 142.0,
    timeDiffMinutes: 30,
    velocityKmH: 284.0,
    aiExplanation:
      'Jarak Bandung-Jakarta (142 km) diakses dalam rentang 30 menit membutuhkan kecepatan rata-rata 284 km/jam. Secara fisik mustahil menggunakan moda transportasi darat umum, terbukti kartu diakses secara paralel.',
    legalBasis: 'UU ITE Pasal 35 & Permenkes No. 16/2019 Pasal 22 (Penyalahgunaan Identitas Elektronik)',
    recommendation: 'Wajibkan verifikasi biometrik face-match di loket pendaftaran kedua.',
  },
];

const BIOLOGY_DATA: BiologyCase[] = [
  {
    id: 'HK-BIO-01',
    patientName: 'Agus Pratama',
    nik: '3201**********77',
    score: 98,
    gender: 'LAKI-LAKI',
    age: 38,
    hospital: 'RSIA Bunda Medika Bogor',
    claimDiag: 'O82 - Persalinan Sectio Caesarea Tunggal',
    diagCode: 'O82',
    cbgTarif: 'Rp 6.800.000',
    aiExplanation:
      'Master data Dukcapil dan biometric SATUSEHAT memvalidasi peserta berjenis kelamin Laki-laki (38 tahun). Klaim diajukan dengan diagnosa persalinan caesar (O82). AI mendeteksi diskordansi biologis absolut (kemustahilan klinis 100%).',
    legalBasis: 'Permenkes No. 16/2019 Pasal 5 & KUHP Pasal 378 (Kecurangan Klaim Fiktif)',
    recommendation: 'Tolak klaim secara permanen dan rujuk faskes ke Unit Kepatuhan BPJS.',
  },
  {
    id: 'HK-BIO-02',
    patientName: 'Rudi Hartono',
    nik: '3171**********12',
    score: 95,
    gender: 'LAKI-LAKI',
    age: 45,
    hospital: 'RS Citra Sehat Jakarta',
    claimDiag: 'N80.0 - Endometriosis Uterus',
    diagCode: 'N80.0',
    cbgTarif: 'Rp 4.150.000',
    aiExplanation:
      'Diagnosa kelainan ginekologi uterus ditagihkan atas nama peserta laki-laki. AI memvalidasi tidak ada riwayat medis pendukung yang relevan, membuktikan pemakaian kartu istri/keluarga tanpa verifikasi kepesertaan.',
    legalBasis: 'Permenkes No. 26/2021 tentang Pedoman Klaim INA-CBG',
    recommendation: 'Keluarkan nota koreksi klaim dan terbitkan surat teguran ke manajemen RS.',
  },
];

export const IdentityRiskPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'TRAVEL' | 'BIOLOGY'>('TRAVEL');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('HK-TRAVEL-01');
  const [analyzedCases, setAnalyzedCases] = useState<Record<string, boolean>>({
    'HK-TRAVEL-01': true, // Pre-analyzed for instant insight
  });
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const isCurrentAnalyzed = !!analyzedCases[selectedCaseId];

  const handleRunAiInspection = () => {
    setIsScanning(true);
    setTimeout(() => {
      setAnalyzedCases((prev) => ({ ...prev, [selectedCaseId]: true }));
      setIsScanning(false);
    }, 550);
  };

  const currentTravel = TRAVEL_DATA.find((c) => c.id === selectedCaseId) || TRAVEL_DATA[0]!;
  const currentBio = BIOLOGY_DATA.find((c) => c.id === selectedCaseId) || BIOLOGY_DATA[0]!;

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Identitas &amp; Impossible Travel
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              MODUS 1 &amp; 2
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deteksi kecurangan kartu pinjaman melalui audit geospasial waktu nyata &amp; diskordansi biologis.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('TRAVEL');
              setSelectedCaseId('HK-TRAVEL-01');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'TRAVEL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Impossible Travel
          </button>
          <button
            onClick={() => {
              setActiveTab('BIOLOGY');
              setSelectedCaseId('HK-BIO-01');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'BIOLOGY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Diskordansi Biologis
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricCard
          title="Disparitas Geospasial"
          value="18 Kasus"
          subtitle="Kecepatan perpindahan > 80 km/jam"
          badgeText="Live Radar"
          icon={Navigation}
          iconColorClass="text-rose-600"
          iconBgClass="bg-rose-50"
        />
        <MetricCard
          title="Diskordansi Gender/Usia"
          value="7 Kasus"
          subtitle="Ketidaksesuaian klinis anatomis"
          badgeText="Kritikal"
          icon={UserX}
          iconColorClass="text-amber-600"
          iconBgClass="bg-amber-50"
        />
        <MetricCard
          title="Pencegahan Kebocoran"
          value="Rp 128.4 Jt"
          subtitle="Klaim berhasil ditangguhkan"
          badgeText="DJS Selamat"
          icon={ShieldCheck}
          iconColorClass="text-emerald-600"
          iconBgClass="bg-emerald-50"
        />
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 4 Cols: Cases Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Antrean Kasus Terindikasi
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Pilih untuk Audit</span>
          </div>

          {activeTab === 'TRAVEL' ? (
            <div className="space-y-2.5">
              {TRAVEL_DATA.map((item) => {
                const isSelected = item.id === selectedCaseId;
                const isAnalyzed = !!analyzedCases[item.id];
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
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <span>{item.originCity}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span>{item.destCity}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">{item.velocityKmH} km/h</span>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Status Audit:</span>
                      {isAnalyzed ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Terverifikasi AI
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                          <Clock className="w-3 h-3" /> Siap Dianalisis
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {BIOLOGY_DATA.map((item) => {
                const isSelected = item.id === selectedCaseId;
                const isAnalyzed = !!analyzedCases[item.id];
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
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {item.claimDiag}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{item.gender} ({item.age} th)</span>
                      {isAnalyzed ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Terverifikasi AI
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                          <Clock className="w-3 h-3" /> Siap Dianalisis
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 8 Cols: Interactive AI Workspace */}
        <div className="lg:col-span-8 space-y-4">
          {activeTab === 'TRAVEL' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
              {/* Header with Inspection Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Audit Spasio-Temporal: {currentTravel.patientName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      ({currentTravel.nik})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Membandingkan 2 riwayat terbit SEP simultan pada faskes lintas wilayah.
                  </p>
                </div>

                <button
                  onClick={handleRunAiInspection}
                  disabled={isScanning}
                  className="px-4 py-2 rounded-xl bg-[#007a3d] hover:bg-[#006633] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer self-start sm:self-auto disabled:opacity-60"
                >
                  {isScanning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AI Menganalisis...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>{isCurrentAnalyzed ? 'Uji Analisis Ulang' : 'Jalankan Audit AI'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Clean Intuitive Route Visualization (No Cluttered Formulas) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Diagram Perpindahan Fisik
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Sistem Koordinat SATUSEHAT
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-3">
                  {/* Origin */}
                  <div className="sm:col-span-5 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{currentTravel.originCity}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{currentTravel.originTime}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{currentTravel.originHospital}</div>
                    <div className="text-[10px] text-slate-500 truncate">{currentTravel.originDiag}</div>
                    <div className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                      Tarif: {currentTravel.originTarif}
                    </div>
                  </div>

                  {/* Velocity Connector Indicator */}
                  <div className="sm:col-span-1 flex flex-col items-center justify-center py-1">
                    <div className="w-full border-t-2 border-dashed border-rose-300 dark:border-rose-700 sm:block hidden" />
                    <div className="p-1.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-bold font-mono">
                      {currentTravel.timeDiffMinutes}m
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="sm:col-span-5 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{currentTravel.destCity}</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{currentTravel.destTime}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{currentTravel.destHospital}</div>
                    <div className="text-[10px] text-slate-500 truncate">{currentTravel.destDiag}</div>
                    <div className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                      Tarif: {currentTravel.destTarif}
                    </div>
                  </div>
                </div>

                {/* Velocity Flag Banner */}
                <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-rose-900 dark:text-rose-200 font-medium">
                      Jarak {currentTravel.distanceKm} km ditempuh dalam {currentTravel.timeDiffMinutes} menit. Kecepatan rata-rata: <strong className="font-mono">{currentTravel.velocityKmH} km/jam</strong>.
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shrink-0">
                    MUSTAHIL FISIK
                  </span>
                </div>
              </div>

              {/* AI Reasoning Response Card */}
              {isCurrentAnalyzed ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-600/40 dark:border-emerald-500/40 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Penalaran Klinis AI &amp; Dasar Hukum</span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentTravel.aiExplanation}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      Dasar Hukum: <strong className="text-slate-700 dark:text-slate-300">{currentTravel.legalBasis}</strong>
                    </span>

                    <button
                      onClick={() => navigate('/dashboard/master-data')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      Buka di Master Data &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kasus Siap Dianalisis oleh Engine AI
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Klik tombol &quot;Jalankan Audit AI&quot; di atas untuk mengevaluasi parameter spasio-temporal dan mengeluarkan kesimpulan regulasi.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
              {/* Biology Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Diskordansi Biologis: {currentBio.patientName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      ({currentBio.nik})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Memvalidasi kesesuaian anatomis master demografi vs klaim diagnosa ICD-10.
                  </p>
                </div>

                <button
                  onClick={handleRunAiInspection}
                  disabled={isScanning}
                  className="px-4 py-2 rounded-xl bg-[#007a3d] hover:bg-[#006633] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer self-start sm:self-auto disabled:opacity-60"
                >
                  {isScanning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AI Menganalisis...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>{isCurrentAnalyzed ? 'Uji Analisis Ulang' : 'Jalankan Audit AI'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Biological Discordance Visual Panel */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                      Master Demografi Dukcapil
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Jenis Kelamin: <span className="font-mono text-sky-600 dark:text-sky-400">{currentBio.gender}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Usia Terdaftar: {currentBio.age} Tahun
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 space-y-1">
                    <span className="text-[10px] text-rose-500 block uppercase tracking-wider font-semibold">
                      Klaim Medis Ditagihkan
                    </span>
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      {currentBio.claimDiag}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Tarif INA-CBG: <strong className="font-mono">{currentBio.cbgTarif}</strong> ({currentBio.hospital})
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs">
                  <span className="text-rose-900 dark:text-rose-300 font-medium">
                    Inkompatibilitas Mutlak: Laki-laki tidak memiliki organ biologis untuk tindakan persalinan/ginekologi.
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shrink-0">
                    FRAUD KLINIKAL
                  </span>
                </div>
              </div>

              {/* AI Reasoning Response Card */}
              {isCurrentAnalyzed ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-600/40 dark:border-emerald-500/40 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Penalaran Klinis AI &amp; Dasar Hukum</span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentBio.aiExplanation}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      Dasar Hukum: <strong className="text-slate-700 dark:text-slate-300">{currentBio.legalBasis}</strong>
                    </span>

                    <button
                      onClick={() => navigate('/dashboard/master-data')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      Buka di Master Data &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kasus Siap Dianalisis oleh Engine AI
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Klik tombol &quot;Jalankan Audit AI&quot; untuk memeriksa diskordansi biologis terhadap basis data rekam medis.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
