import React, { useState } from 'react';
import {
  Mail,
  Clock,
  CheckCircle2,
  Send,
  ShieldOff,
  Check,
  Search,
} from 'lucide-react';
import { useSimulationStream } from '../simulation/SimulationContext';
import { supabase } from '../../../lib/supabase';
import type { JknClaimRecord } from '@healthathon/shared';

const HEADING_FONT = '"Bricolage Grotesque", "Inter", sans-serif';

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
    alasan: 'Penyalahgunaan identitas — Impossible Travel terdeteksi',
    timestamp: '04/09/2026 08:30',
    status: 'EXECUTED',
  },
  {
    id: 'ACT-002',
    type: 'SURAT',
    nik: '3273**********88',
    nama: 'Hendra Wijaya',
    alasan: 'Doctor Shopping Index 1.00 — pelayanan redundan',
    timestamp: '04/09/2026 09:15',
    status: 'PENDING',
  },
  {
    id: 'ACT-003',
    type: 'SURAT',
    nik: '1271**********54',
    nama: 'Nurul Hidayati',
    alasan: 'Resale obat PRB terdeteksi & kuota tumpang tindih',
    timestamp: '03/09/2026 14:20',
    status: 'EXECUTED',
  },
];

const ALASAN_SUSPEND = [
  'Penyalahgunaan identitas kepesertaan (kartu pinjaman)',
  'Pemalsuan data klaim / manipulasi SEP',
  'Impossible Travel terdeteksi antar-faskes',
  'Doctor Shopping berulang (DSI >= 1.0)',
  'Resale obat PRB & alkes overlap quota',
  'Klaim ganda dalam periode yang sama',
];

const TEMPLATE_SURAT = [
  { id: 'KLARIFIKASI', label: 'Surat Klarifikasi Standar', desc: 'Permintaan penjelasan kepesertaan atas anomali terdeteksi.' },
  { id: 'PERINGATAN', label: 'Surat Peringatan Pertama', desc: 'Peringatan resmi atas pelanggaran ketentuan layanan JKN.' },
  { id: 'TAGIHAN', label: 'Surat Tagihan Ganti Rugi', desc: 'Penagihan pengembalian dana klaim akibat pelanggaran.' },
  { id: 'SUSPENSI', label: 'Surat Notifikasi Suspensi', desc: 'Pemberitahuan resmi pembekuan hak jaminan kepesertaan.' },
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
      nik: '3374**********01',
      nama: 'Budi Santoso',
      typology: 'Impossible Travel (Kartu Pinjaman)',
      riskScore: 96,
      tarif: 'Rp 8.400.000',
      faskes: 'RSUD Dr. Moewardi Surakarta',
    },
    {
      nik: '3273**********88',
      nama: 'Hendra Wijaya',
      typology: 'Doctor Shopping (Vertigo Redundan)',
      riskScore: 88,
      tarif: 'Rp 4.200.000',
      faskes: 'RS Rajawali & Advent Bandung',
    },
    {
      nik: '1271**********54',
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
        setAlasanSuspend('Impossible Travel terdeteksi antar-faskes');
      } else if (rec.typology.toLowerCase().includes('doctor') || rec.typology.toLowerCase().includes('shopping')) {
        setAlasanSuspend('Doctor Shopping berulang (DSI >= 1.0)');
      } else if (rec.typology.toLowerCase().includes('obat') || rec.typology.toLowerCase().includes('resale')) {
        setAlasanSuspend('Resale obat PRB & alkes overlap quota');
      } else {
        setAlasanSuspend('Penyalahgunaan identitas kepesertaan (kartu pinjaman)');
      }
    } else {
      if (rec.typology.toLowerCase().includes('shopping')) {
        setTemplateSurat('KLARIFIKASI');
      } else {
        setTemplateSurat('PERINGATAN');
      }
    }

    const formEl = document.getElementById('form-penindakan');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
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
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date().toLocaleDateString('id-ID'),
      status: 'PENDING',
    };
    setLogs([newLog, ...logs]);

    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from('audit_access_logs').insert({
          accessed_by_user_id: session?.user?.id ?? null,
          auditor_role: 'AUDITOR_SENIOR',
          action_performed: 'SUSPEND_PESERTA',
          target_no_kartu: nikInput.slice(0, 13),
          user_agent: navigator.userAgent,
        });
      } catch {
        // Handled silently
      }
    }

    setNikInput('');
    setNamaInput('');
    setAlasanSuspend('');
    setSuccessMsg('Permintaan suspensi dicatat dan dikirim ke sistem VEDIKA.');
    setTimeout(() => setSuccessMsg(''), 3500);
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
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date().toLocaleDateString('id-ID'),
      status: 'PENDING',
    };
    setLogs([newLog, ...logs]);

    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from('audit_access_logs').insert({
          accessed_by_user_id: session?.user?.id ?? null,
          auditor_role: 'AUDITOR_SENIOR',
          action_performed: 'SEND_WARNING_LETTER',
          target_no_kartu: nikInput.slice(0, 13),
          user_agent: navigator.userAgent,
        });
      } catch {
        // Handled silently
      }
    }

    setNikInput('');
    setNamaInput('');
    setTemplateSurat('');
    setSuccessMsg('Surat resmi diterbitkan dan dikirim ke Mobile JKN.');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.nama.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.nik.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.alasan.toLowerCase().includes(logSearch.toLowerCase())
  );

  const totalSuspended = logs.filter((l) => l.type === 'SUSPEND').length;
  const totalLetters = logs.filter((l) => l.type === 'SURAT').length;

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
      {/* ================================================================ */}
      {/* 1. Header & Quick Stat Pills                                     */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight leading-none"
            style={{ fontFamily: HEADING_FONT }}
          >
            Tata Kelola &amp; Tindakan Kepesertaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Eksekusi sanksi suspensi hak kepesertaan, penerbitan surat resmi, dan log audit penindakan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Diaudit:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">84.394 Peserta</span>
          </div>
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Suspensi:</span>
            <span className="font-bold text-rose-500 font-mono">{totalSuspended}</span>
          </div>
          <div className="h-9 px-3.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Surat:</span>
            <span className="font-bold text-blue-500 font-mono">{totalLetters}</span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. Rekomendasi Cepat dari Live Stream (Tiered Quick Selection)   */}
      {/* ================================================================ */}
      <div className="rounded-2xl bg-white dark:bg-[#131418] border border-slate-200/80 dark:border-white/[0.08] p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Rekomendasi Tindakan Cepat (Deteksi Real-Time)</span>
          </div>
          <span className="text-[11px] text-slate-400">Klik tombol untuk pre-fill formulir</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {rec.nama}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold shrink-0">
                    Skor {rec.riskScore}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {rec.typology} · <span className="font-mono text-rose-500">{rec.tarif}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => handleQuickAction(rec, 'suspend')}
                  className="flex-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <ShieldOff className="w-3 h-3" />
                  <span>Suspend</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction(rec, 'surat')}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Mail className="w-3 h-3" />
                  <span>Kirim Surat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. Action Center: Formulir & Log Riwayat                          */}
      {/* ================================================================ */}
      <div id="form-penindakan" className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left (3 cols): Action Form */}
        <div className="lg:col-span-3 space-y-3.5">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl gap-1 border border-slate-200/80 dark:border-white/[0.08]">
            <button
              onClick={() => setActiveTab('suspend')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'suspend'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldOff className="w-3.5 h-3.5" />
              <span>Suspensi Hak Kepesertaan</span>
            </button>
            <button
              onClick={() => setActiveTab('surat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'surat'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Penerbitan Surat Resmi</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl bg-white dark:bg-[#131418] border border-slate-200/80 dark:border-white/[0.08] p-5 space-y-4">
            <form onSubmit={activeTab === 'suspend' ? handleSubmitSuspend : handleSubmitSurat} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIK Peserta *
                  </label>
                  <input
                    type="text"
                    value={nikInput}
                    onChange={(e) => setNikInput(e.target.value)}
                    placeholder="16 digit NIK"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Peserta
                  </label>
                  <input
                    type="text"
                    value={namaInput}
                    onChange={(e) => setNamaInput(e.target.value)}
                    placeholder="Nama peserta"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              {activeTab === 'suspend' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alasan Suspensi *
                  </label>
                  <select
                    value={alasanSuspend}
                    onChange={(e) => setAlasanSuspend(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="" className="dark:bg-[#131418]">Pilih alasan penindakan...</option>
                    {ALASAN_SUSPEND.map((a) => (
                      <option key={a} value={a} className="dark:bg-[#131418]">
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Template Surat *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TEMPLATE_SURAT.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTemplateSurat(t.id)}
                        className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          templateSurat === t.id
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{t.label}</span>
                          {templateSurat === t.id && <Check className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-0.5 truncate">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  activeTab === 'suspend'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {activeTab === 'suspend' ? (
                  <>
                    <ShieldOff className="w-3.5 h-3.5" />
                    <span>Eksekusi Suspensi Hak JKN</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Surat via Mobile JKN</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right (2 cols): Action Log */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white dark:bg-[#131418] border border-slate-200/80 dark:border-white/[0.08] p-4 flex flex-col h-full">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Log Riwayat Tindakan
              </span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
                {logs.length} Aksi
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Cari NIK, nama..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.05] overflow-y-auto max-h-[380px] flex-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        log.type === 'SUSPEND'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {log.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleLogStatus(log.id)}
                      className={`text-[10px] font-semibold cursor-pointer px-1.5 py-0.5 rounded ${
                        log.status === 'EXECUTED'
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : 'text-amber-500 bg-amber-500/10'
                      }`}
                    >
                      {log.status === 'EXECUTED' ? 'Dieksekusi' : 'Pending'}
                    </button>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{log.nama}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{log.alasan}</div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
