import type { AiToolDefinition } from './tool.types.js';

/**
 * 10 Official INFERA Forensic Tools Definitions
 * Standard OpenAI Function Calling Schema used across Backend (Realtime API) and Frontend (Dispatcher)
 */
export const INFERA_TOOL_DEFINITIONS: AiToolDefinition[] = [
  // 1. READ / ANALYSIS TOOLS
  {
    type: 'function',
    function: {
      name: 'analyze_participant',
      description:
        'Menganalisis rekam data klaim, fasilitas kesehatan (Faskes), dan profil risiko peserta JKN berdasarkan Nama Peserta, Nama Faskes (Puskesmas/RS/Klinik), No SEP, No Kartu, NIK, atau ID Kasus. Mengambil data aktual dari database dan aliran transaksi aktif.',
      parameters: {
        type: 'object',
        properties: {
          participant_query: {
            type: 'string',
            description:
              'Kata kunci pencarian: Nama Peserta (misal "Budi Santoso", "Hendra Wijaya"), Nama Fasilitas Kesehatan / Faskes (misal "Puskesmas Gambir", "RS Mitra Husada Semarang", "RS Sejahtera Abadi Medan", "Klinik Utama Sehat Mandiri"), Nomor SEP, Nomor Kartu BPJS, NIK, atau ID Kasus.',
          },
          include_encounters: {
            type: 'boolean',
            description: 'Sertakan daftar detail riwayat kunjungan faskes / SEP.',
          },
        },
        required: ['participant_query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_claim_history',
      description:
        'Mengambil riwayat kunjungan klaim/SEP peserta secara kronologis lengkap dengan waktu, faskes, diagnosa, dan tarif klaim untuk verifikasi anomali.',
      parameters: {
        type: 'object',
        properties: {
          participant_id: {
            type: 'string',
            description: 'Nomor Kartu BPJS, NIK, atau No SEP peserta.',
          },
        },
        required: ['participant_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'detect_fraud_pattern',
      description:
        'Mengevaluasi indikator pola fraud spesifik menggunakan formula matematika analitik: Impossible Travel (kecepatan > 100 km/jam), Doctor Shopping (indeks DSI), Diskordansi Biologis (gender vs diagnosa), atau Resale Obat PRB.',
      parameters: {
        type: 'object',
        properties: {
          pattern_type: {
            type: 'string',
            enum: ['impossible_travel', 'doctor_shopping', 'prb_resale', 'biological_discordance', 'all'],
            description: 'Jenis pola kecurangan yang ingin diuji.',
          },
          target_id: {
            type: 'string',
            description: 'Nomor Kartu, NIK, No SEP, atau Nama Peserta yang diuji.',
          },
        },
        required: ['pattern_type', 'target_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_risk_score',
      description:
        'Menghitung skor risiko fraud resmi (0 - 100) dan menentukan level risiko (CRITICAL, HIGH, MEDIUM, LOW) berdasarkan akumulasi sinyal anomali terverifikasi.',
      parameters: {
        type: 'object',
        properties: {
          target_id: {
            type: 'string',
            description: 'Nomor Kartu, NIK, atau ID Kasus peserta.',
          },
        },
        required: ['target_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_regulations_rag',
      description:
        'Mencari rujukan pasal dan ketentuan regulasi resmi JKN (Permenkes 16/2019, UU BPJS 24/2011, Permenkes 3/2023, KUHP 263) untuk dasar hukum audit.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Kata kunci pencarian regulasi, sanksi, atau pasal pelanggaran.',
          },
          category: {
            type: 'string',
            enum: ['DEFINISI_HUKUM', 'TIPOLOGI_FRAUD', 'SANKSI_HUKUM', 'SISTEM_BPJS', 'ALL'],
            description: 'Kategori pasal regulasi yang dicari.',
          },
        },
        required: ['query'],
      },
    },
  },

  // 2. ACTION PROPOSAL TOOLS (Two-Phase Action Model — Safe Proposals Only)
  {
    type: 'function',
    function: {
      name: 'propose_participant_suspension',
      description:
        'Mengajukan rekomendasi penangguhan sementara (suspensi) status kepesertaan atau eligibilitas klaim untuk kasus pelanggaran berat. TIDAK mengeksekusi langsung, melainkan menyajikan kartu rekomendasi kepada auditor untuk persetujuan manusia.',
      parameters: {
        type: 'object',
        properties: {
          participant_id: {
            type: 'string',
            description: 'Nomor Kartu BPJS atau NIK peserta yang direkomendasikan untuk disuspensi.',
          },
          participant_name: {
            type: 'string',
            description: 'Nama lengkap peserta.',
          },
          reason: {
            type: 'string',
            description: 'Alasan substantif pengajuan suspensi berdasarkan temuan bukti.',
          },
          severity: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH'],
            description: 'Tingkat keparahan anomali.',
          },
          legal_basis: {
            type: 'string',
            description: 'Pasal atau regulasi acuan (contoh: Permenkes 16/2019 Pasal 6).',
          },
        },
        required: ['participant_id', 'participant_name', 'reason', 'severity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_warning_letter',
      description:
        'Mengajukan draft surat peringatan atau klarifikasi resmi kepada peserta atau faskes atas indikasi kecurangan. Menyajikan kartu rekomendasi kepada auditor untuk persetujuan manusia.',
      parameters: {
        type: 'object',
        properties: {
          recipient_type: {
            type: 'string',
            enum: ['PESERTA', 'FASKES'],
            description: 'Penerima surat peringatan.',
          },
          recipient_id: {
            type: 'string',
            description: 'Nomor Kartu / NIK Peserta atau Kode PPK Faskes.',
          },
          recipient_name: {
            type: 'string',
            description: 'Nama Peserta atau Faskes yang dituju.',
          },
          letter_type: {
            type: 'string',
            enum: ['KLARIFIKASI', 'PERINGATAN', 'TAGIHAN', 'SUSPENSI'],
            description: 'Jenis template surat yang direkomendasikan.',
          },
          violation_details: {
            type: 'string',
            description: 'Uraian ringkas pelanggaran yang terjadi.',
          },
          legal_basis: {
            type: 'string',
            description: 'Dasar hukum penerbitan surat peringatan.',
          },
        },
        required: ['recipient_type', 'recipient_id', 'recipient_name', 'letter_type', 'violation_details'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_case_review',
      description:
        'Mengajukan jadwal sidang ad-hoc telaah forensik atau audit faskes terpadu bersama tim pencegahan kecurangan (PK) BPJS. Menyajikan kartu rekomendasi kepada auditor untuk persetujuan manusia.',
      parameters: {
        type: 'object',
        properties: {
          case_id: {
            type: 'string',
            description: 'ID Kasus investigasi (misal CASE-001, CASE-002, dll).',
          },
          title: {
            type: 'string',
            description: 'Judul topik telaah forensik.',
          },
          priority: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM'],
            description: 'Prioritas penanganan kasus.',
          },
          estimated_loss: {
            type: 'number',
            description: 'Estimasi kerugian finansial Dana Jaminan Sosial (Rp).',
          },
        },
        required: ['case_id', 'title', 'priority'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_workflow',
      description: 'Menyediakan shortcut navigasi langsung ke halaman audit atau visualisasi teknis terkait.',
      parameters: {
        type: 'object',
        properties: {
          route: {
            type: 'string',
            enum: [
              '/dashboard',
              '/dashboard/identity-risk',
              '/dashboard/unnecessary-services',
              '/dashboard/pharmacy-alkes',
              '/dashboard/cases',
              '/dashboard/transactions',
              '/dashboard/master-data',
              '/dashboard/regulations',
            ],
            description: 'Rute tujuan pada dashboard.',
          },
          reason: {
            type: 'string',
            description: 'Alasan membuka workflow tersebut.',
          },
        },
        required: ['route', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_simulation_cases',
      description:
        'Mengambil daftar kasus anomali dan klaim berisiko terbaru yang sedang terdeteksi di simulasi live real-time sistem INFERA tahun 2026.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Jumlah kasus maksimal yang ingin diambil (default 5).',
          },
        },
      },
    },
  },
];
