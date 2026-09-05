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
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          Master Data &amp; Tindakan Kepesertaan
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Suspensi kepesertaan bermasalah, penerbitan surat peringatan, dan audit trail penindakan JKN.
        </p>
      </div>

      {/* Real-time Stream Recommendations Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <span className="text-xs font-bold text-slate-900">
              Rekomendasi Tindakan dari Deteksi Real-Time
            </span>
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              (Live Stream Integritas Klaim)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Pilih tindakan cepat untuk pre-fill formulir
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{rec.nama}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-mono text-slate-500">{rec.nik}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Skor {rec.riskScore}/100
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-700">{rec.typology}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{rec.faskes}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-rose-600 font-semibold">{rec.tarif}</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleQuickAction(rec, 'suspend')}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ajukan Suspensi untuk peserta ini"
                >
                  <ShieldOff className="w-3.5 h-3.5" />
                  <span>Suspend</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction(rec, 'surat')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
          <div className="flex p-1 bg-slate-100 rounded-xl gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('suspend')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'suspend'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldOff className="w-3.5 h-3.5 text-rose-600" />
              Suspend Peserta
            </button>
            <button
              onClick={() => setActiveTab('surat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'surat'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-slate-700" />
              Kirim Surat / Layangan
            </button>
          </div>

          {/* Suspend Form */}
          {activeTab === 'suspend' && (
            <form
              onSubmit={handleSubmitSuspend}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-2xs"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <UserX className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-bold text-slate-900">
                  Formulir Suspensi Hak Kepesertaan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIK Peserta *
                  </label>
                  <input
                    type="text"
                    value={nikInput}
                    onChange={(e) => setNikInput(e.target.value)}
                    placeholder="16 digit NIK"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Peserta
                  </label>
                  <input
                    type="text"
                    value={namaInput}
                    onChange={(e) => setNamaInput(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alasan Suspensi *
                </label>
                <select
                  value={alasanSuspend}
                  onChange={(e) => setAlasanSuspend(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs cursor-pointer"
                >
                  <option value="">Pilih alasan...</option>
                  {ALASAN_SUSPEND.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Tindakan suspensi akan memblokir penerbitan SEP baru di seluruh faskes dan membutuhkan
                  verifikasi manual pejabat BPJS Kesehatan untuk pemulihan hak jaminan.
                </span>
              </div>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
              className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-2xs"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileText className="w-4 h-4 text-[#007a3d]" />
                <span className="text-sm font-bold text-slate-900">
                  Penerbitan Surat Klarifikasi &amp; Peringatan Resmi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIK Peserta *
                  </label>
                  <input
                    type="text"
                    value={nikInput}
                    onChange={(e) => setNikInput(e.target.value)}
                    placeholder="16 digit NIK"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Peserta
                  </label>
                  <input
                    type="text"
                    value={namaInput}
                    onChange={(e) => setNamaInput(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Template Surat Resmi *
                </label>
                <div className="space-y-2">
                  {TEMPLATE_SURAT.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateSurat(t.id)}
                      className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all cursor-pointer ${
                        templateSurat === t.id
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div
                        className={`font-semibold text-xs ${
                          templateSurat === t.id ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {t.label}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          templateSurat === t.id ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {t.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#007a3d] hover:bg-[#006834] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim Surat via Mobile JKN
              </button>
            </form>
          )}
        </div>

        {/* Right: Action Log */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Riwayat Tindakan</span>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {logs.length} aksi
              </span>
            </div>

            {/* Log Search Filter */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Cari NIK, nama, atau alasan..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* List of Action Logs */}
            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada catatan tindakan yang cocok.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="px-4 py-3 space-y-1.5 hover:bg-slate-50/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          log.type === 'SUSPEND'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {log.type === 'SUSPEND' ? 'SUSPEND' : 'SURAT'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleLogStatus(log.id)}
                        className={`text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-slate-100 ${
                          log.status === 'EXECUTED' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                        title="Klik untuk toggle status"
                      >
                        {log.status === 'EXECUTED' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Dieksekusi</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-slate-900">{log.nama}</div>
                    <div className="font-mono text-[10px] text-slate-500">{log.nik}</div>
                    <div className="text-[11px] text-slate-600 leading-relaxed">{log.alasan}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
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
