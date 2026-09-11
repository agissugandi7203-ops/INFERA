import React, { useState } from 'react';
import {
  UserX,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldOff,
  FileText,
  Check,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { useSimulationStream } from '../simulation/SimulationContext';
import { supabase } from '../../../lib/supabase';
import type { JknClaimRecord } from '@healthathon/shared';

type ActionLog = {
  id: string;
  type: 'SUSPEND' | 'SURAT';
  nik: string;
  nama: string;
  alasan: string;
  timestamp: string;
  status: 'PENDING' | 'EXECUTED';
};

const MOCK_LOGS: ActionLog[] = [
  {
    id: 'ACT-001',
    type: 'SUSPEND',
    nik: '3374**********01',
    nama: 'Budi Santoso',
    alasan: 'Penyalahgunaan identitas kepesertaan — Impossible Travel terdeteksi',
    timestamp: '04/09/2026 08:30',
    status: 'EXECUTED',
  },
  {
    id: 'ACT-002',
    type: 'SURAT',
    nik: '3273**********88',
    nama: 'Hendra Wijaya',
    alasan: 'Doctor Shopping Index 1.00 — pelayanan redundan 3 faskes',
    timestamp: '04/09/2026 09:15',
    status: 'PENDING',
  },
];

const ALASAN_SUSPEND = [
  'Penyalahgunaan identitas kepesertaan',
  'Pemalsuan data peserta',
  'Impossible Travel terdeteksi (kartu pinjaman)',
  'Doctor Shopping berulang (DSI >= 1.0)',
  'Resale obat PRB terdeteksi',
  'Klaim ganda dalam periode yang sama',
];

const TEMPLATE_SURAT = [
  { id: 'KLARIFIKASI', label: 'Surat Klarifikasi Standar', desc: 'Meminta penjelasan peserta atas anomali yang terdeteksi.' },
  { id: 'PERINGATAN', label: 'Surat Peringatan Pertama', desc: 'Peringatan resmi pertama atas pelanggaran ketentuan JKN.' },
  { id: 'TAGIHAN', label: 'Surat Tagihan Pengembalian', desc: 'Penagihan pengembalian dana JKN yang telah dibayarkan.' },
  { id: 'SUSPENSI', label: 'Surat Notifikasi Suspensi', desc: 'Pemberitahuan resmi suspensi sementara kepesertaan.' },
];

export const MasterDataPage: React.FC = () => {
  const { anomalies } = useSimulationStream();
  const [activeTab, setActiveTab] = useState<'suspend' | 'surat'>('suspend');
  const [nikInput, setNikInput] = useState('');
  const [namaInput, setNamaInput] = useState('');
  const [alasanSuspend, setAlasanSuspend] = useState('');
  const [templateSurat, setTemplateSurat] = useState('');
  const [logs, setLogs] = useState<ActionLog[]>(MOCK_LOGS);
  const [logSearch, setLogSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const defaultRecommended = [
    {
      nik: '3374021908850001',
      nama: 'Budi Santoso',
      typology: 'Impossible Travel (Kartu Pinjaman)',
      riskScore: 96,
      tarif: 'Rp 8.400.000',
      faskes: 'RSUD Dr. Moewardi Surakarta',
    },
    {
      nik: '3273012903820088',
      nama: 'Hendra Wijaya',
      typology: 'Doctor Shopping (Vertigo Redundan)',
      riskScore: 88,
      tarif: 'Rp 4.200.000',
      faskes: 'RS Rajawali & Advent Bandung',
    },
    {
      nik: '1271045906910054',
      nama: 'Nurul Hidayati',
      typology: 'Resale Obat PRB & Overlap Quota',
      riskScore: 94,
      tarif: 'Rp 3.555.000',
      faskes: 'Apotek Kimia Farma Medan',
    },
  ];

  const streamRecommendations = anomalies.slice(0, 3).map((item: JknClaimRecord) => ({
    nik: item.nik || '3201**********99',
    nama: item.namaPeserta || 'Peserta Terindikasi',
    typology: item.anomalyTitle || item.fraudTypology.replace(/_/g, ' '),
    riskScore: item.fraudRiskScore || 85,
    tarif: `Rp ${(item.cbgTariff || 1500000).toLocaleString('id-ID')}`,
    faskes: item.namaFaskes || 'Fasilitas Kesehatan JKN',
  }));

  const recommendations = streamRecommendations.length > 0 ? streamRecommendations : defaultRecommended;

  const handleQuickAction = (
    rec: { nik: string; nama: string; typology: string },
    action: 'suspend' | 'surat'
  ) => {
    setActiveTab(action);
    setNikInput(rec.nik);
    setNamaInput(rec.nama);

    if (action === 'suspend') {
      if (rec.typology.toLowerCase().includes('travel') || rec.typology.toLowerCase().includes('kartu')) {
        setAlasanSuspend('Impossible Travel terdeteksi (kartu pinjaman)');
      } else if (rec.typology.toLowerCase().includes('doctor') || rec.typology.toLowerCase().includes('shopping')) {
        setAlasanSuspend('Doctor Shopping berulang (DSI >= 1.0)');
      } else if (rec.typology.toLowerCase().includes('obat') || rec.typology.toLowerCase().includes('resale')) {
        setAlasanSuspend('Resale obat PRB terdeteksi');
      } else {
        setAlasanSuspend('Penyalahgunaan identitas kepesertaan');
      }
    } else {
      if (rec.typology.toLowerCase().includes('shopping')) {
        setTemplateSurat('KLARIFIKASI');
      } else {
        setTemplateSurat('PERINGATAN');
      }
    }

    const nikEl = document.getElementById('nik-input-field');
    if (nikEl) {
      nikEl.focus();
    }
  };

  const toggleLogStatus = (id: string) => {
    setLogs((prev) =>
      prev.map((log) =>
        log.id === id
          ? {
              ...log,
              status: log.status === 'PENDING' ? 'EXECUTED' : 'PENDING',
            }
          : log
      )
    );
  };

  const handleSubmitSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nikInput || !alasanSuspend) return;
    const newLog: ActionLog = {
      id: `ACT-${Date.now()}`,
      type: 'SUSPEND',
      nik: nikInput,
      nama: namaInput || 'Peserta JKN',
      alasan: alasanSuspend,
      timestamp: new Date().toLocaleString('id-ID'),
      status: 'PENDING',
    };
    setLogs([newLog, ...logs]);

    if (supabase) {
      try {
        await supabase.from('audit_access_logs').insert({
          auditor_role: 'AUDITOR_SENIOR',
          action_performed: 'SUSPEND_PESERTA',
          target_no_kartu: nikInput.slice(0, 13),
          user_agent: navigator.userAgent,
        });
      } catch {
        // Silently handled
      }
    }

    setNikInput('');
    setNamaInput('');
    setAlasanSuspend('');
    setSuccessMsg('Permintaan suspensi berhasil diajukan ke sistem VEDIKA & dicatat di audit log.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSubmitSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nikInput || !templateSurat) return;
    const newLog: ActionLog = {
      id: `ACT-${Date.now()}`,
      type: 'SURAT',
      nik: nikInput,
      nama: namaInput || 'Peserta JKN',
      alasan: TEMPLATE_SURAT.find((t) => t.id === templateSurat)?.label || templateSurat,
      timestamp: new Date().toLocaleString('id-ID'),
      status: 'PENDING',
    };
    setLogs([newLog, ...logs]);

    if (supabase) {
      try {
        await supabase.from('audit_access_logs').insert({
          auditor_role: 'AUDITOR_SENIOR',
          action_performed: 'SEND_WARNING_LETTER',
          target_no_kartu: nikInput.slice(0, 13),
          user_agent: navigator.userAgent,
        });
      } catch {
        // Silently handled
      }
    }

    setNikInput('');
    setNamaInput('');
    setTemplateSurat('');
    setSuccessMsg('Surat resmi berhasil diterbitkan dan dikirim ke peserta melalui Mobile JKN.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.nama.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.nik.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.alasan.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Master Data &amp; Tindakan Kepesertaan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Suspensi kepesertaan bermasalah, penerbitan surat peringatan, dan audit trail penindakan JKN.
        </p>
      </div>

      {/* Real-time Stream Recommendations Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Rekomendasi Tindakan dari Deteksi Real-Time
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
              (Live Stream Integritas Klaim)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Pilih tindakan cepat untuk pre-fill formulir
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{rec.nama}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{rec.nik}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      Skor {rec.riskScore}/100
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{rec.typology}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-slate-500 dark:text-slate-400">{rec.faskes}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">{rec.tarif}</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleQuickAction(rec, 'suspend')}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ajukan Suspensi untuk peserta ini"
                >
                  <ShieldOff className="w-3.5 h-3.5" />
                  <span>Suspend</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction(rec, 'surat')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Kirim Surat Peringatan/Klarifikasi"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Kirim Surat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="action-form-section" className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Form Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('suspend')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'suspend'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Suspend Peserta
            </button>
            <button
              onClick={() => setActiveTab('surat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'surat'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              Kirim Surat / Layangan
            </button>
          </div>

          {/* Suspend Form */}
          {activeTab === 'suspend' && (
            <form
              onSubmit={handleSubmitSuspend}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 shadow-2xs"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Formulir Suspensi Hak Kepesertaan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    NIK Peserta *
                  </label>
                  <input
                    type="text"
                    value={nikInput}
                    onChange={(e) => setNikInput(e.target.value)}
                    placeholder="16 digit NIK"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Peserta
                  </label>
                  <input
                    type="text"
                    value={namaInput}
                    onChange={(e) => setNamaInput(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alasan Suspensi *
                </label>
                <select
                  value={alasanSuspend}
                  onChange={(e) => setAlasanSuspend(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="">Pilih alasan...</option>
                  {ALASAN_SUSPEND.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Tindakan suspensi akan memblokir penerbitan SEP baru di seluruh faskes dan membutuhkan
                  verifikasi manual pejabat BPJS Kesehatan untuk pemulihan hak jaminan.
                </span>
              </div>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                Ajukan Suspensi Kepesertaan
              </button>
            </form>
          )}

          {/* Surat Form */}
          {activeTab === 'surat' && (
            <form
              onSubmit={handleSubmitSurat}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 shadow-2xs"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <FileText className="w-4 h-4 text-[#007a3d] dark:text-emerald-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Penerbitan Surat Klarifikasi &amp; Peringatan Resmi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    NIK Peserta *
                  </label>
                  <input
                    type="text"
                    value={nikInput}
                    onChange={(e) => setNikInput(e.target.value)}
                    placeholder="16 digit NIK"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Peserta
                  </label>
                  <input
                    type="text"
                    value={namaInput}
                    onChange={(e) => setNamaInput(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Template Surat Resmi BPJS *
                </label>
                <div className="space-y-2">
                  {TEMPLATE_SURAT.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateSurat(t.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        templateSurat === t.id
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/60 dark:border-emerald-500 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.label}</span>
                        {templateSurat === t.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          templateSurat === t.id
                            ? 'text-slate-600 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {t.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#007a3d] dark:bg-emerald-600 hover:bg-[#006834] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim Surat via Mobile JKN
              </button>
            </form>
          )}
        </div>

        {/* Right: Action Log */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Riwayat Tindakan</span>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {logs.length} aksi
              </span>
            </div>

            {/* Log Search Filter */}
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Cari NIK, nama, atau alasan..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* List of Action Logs */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  Tidak ada catatan tindakan yang cocok.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="px-4 py-3 space-y-1.5 hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          log.type === 'SUSPEND'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {log.type === 'SUSPEND' ? 'SUSPEND' : 'SURAT'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleLogStatus(log.id)}
                        className={`text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          log.status === 'EXECUTED'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                        title="Klik untuk toggle status"
                      >
                        {log.status === 'EXECUTED' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Dieksekusi</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Pending</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{log.nama}</div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{log.nik}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{log.alasan}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      {log.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
