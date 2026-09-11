import { API_PREFIX } from '@healthathon/shared';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'INFERA — BPJS Kesehatan Fraud Early-Warning & Risk Analytics API',
    version: '1.0.0',
    description: `
**INFERA (Integrated Fraud Early-Warning & Risk Analytics)** adalah sistem analitik terpadu dan agen investigasi otonom berbasis kecerdasan artifisial untuk perlindungan integritas Dana Jaminan Sosial (DJS) pada Program Jaminan Kesehatan Nasional (JKN) BPJS Kesehatan.

### Fitur Utama Platform:
- **Participant Risk Intelligence**: Deteksi Impossible Travel (Haversine velocity), Doctor Shopping (Doctor Shopping Index/DSI), Diskordansi Biologis (Gender/Usia), dan Penyalahgunaan Obat PRB (30-hari) & Cooling-off Alkes (Permenkes 3/2023).
- **RAG Regulatory Knowledge Engine**: Pencarian semantik regulasi JKN menggunakan model vektor embedding 1536-dimensi berbasis pgvector (Permenkes 16/2019, KUHP 263, UU 24/2011, Perpres 82/2018 & Perpres 59/2024).
- **Forensic AI Agent & SSE Stream**: Server-Sent Events real-time response dengan function-calling dan Two-Way Human-in-the-Loop Governance.
- **Enterprise RBAC & Security**: Strict CORS, PostgreSQL Row Level Security (RLS), dan audit trail investigasi.
    `,
    contact: {
      name: 'Tim INFERA — BPJS Kesehatan HealthAthon',
      url: 'https://bpjs-kesehatan.go.id',
    },
    license: {
      name: 'Proprietary — BPJS Kesehatan HealthAthon 2026',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local API Development Server',
    },
    {
      url: 'https://api.infera.health',
      description: 'Production Railway Gateway',
    },
  ],
  tags: [
    { name: 'System & Health', description: 'Status server, database Supabase, dan OpenRouter' },
    { name: 'Auth & Session', description: 'Autentikasi akun, sesi JWT, dan integrasi OAuth' },
    { name: 'Participant Risk Analytics', description: 'Deteksi anomali peserta, skor risiko, dan audit kasus' },
    { name: 'RAG Regulations', description: 'Pencarian semantik regulasi JKN dan korpus hukum' },
    { name: 'AI Agent & LLM', description: 'Streaming analisis investigasi AI dan function-calling' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan token JWT Supabase dengan awalan Bearer [token]',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              version: { type: 'string', example: 'v1' },
            },
          },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Permintaan tidak valid' },
              code: { type: 'string', example: 'BAD_REQUEST' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      EncounterLocation: {
        type: 'object',
        required: ['city', 'province', 'lat', 'lng'],
        properties: {
          city: { type: 'string', example: 'Jakarta Selatan' },
          province: { type: 'string', example: 'DKI Jakarta' },
          lat: { type: 'number', format: 'float', example: -6.2297 },
          lng: { type: 'number', format: 'float', example: 106.8295 },
        },
      },
      PrescribedDrug: {
        type: 'object',
        required: ['drugName', 'isPrbChronic', 'quantityDays', 'unitPrice'],
        properties: {
          drugName: { type: 'string', example: 'Amlodipine 10mg' },
          isPrbChronic: { type: 'boolean', example: true },
          quantityDays: { type: 'integer', example: 30 },
          unitPrice: { type: 'number', example: 45000 },
        },
      },
      Encounter: {
        type: 'object',
        required: [
          'id',
          'noSep',
          'timestamp',
          'ppkCode',
          'faskesName',
          'faskesClass',
          'location',
          'jnsPelayanan',
          'diagnosaUtama',
          'namaDiagnosa',
          'cbgTariff',
        ],
        properties: {
          id: { type: 'string', example: 'ENC-001' },
          noSep: { type: 'string', example: '0001R0010326V000123' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-03-01T08:30:00Z' },
          ppkCode: { type: 'string', example: '0112R001' },
          faskesName: { type: 'string', example: 'RSUP Dr. Sardjito' },
          faskesClass: { type: 'string', example: 'A' },
          location: { $ref: '#/components/schemas/EncounterLocation' },
          jnsPelayanan: { type: 'integer', enum: [1, 2], description: '1: Rawat Inap, 2: Rawat Jalan' },
          diagnosaUtama: { type: 'string', example: 'E11.9' },
          namaDiagnosa: { type: 'string', example: 'Type 2 diabetes mellitus without complications' },
          cbgTariff: { type: 'number', example: 4850000 },
          prescribedDrugs: {
            type: 'array',
            items: { $ref: '#/components/schemas/PrescribedDrug' },
          },
        },
      },
      PesertaProfile: {
        type: 'object',
        required: ['noKartu', 'fullName', 'gender', 'dateOfBirth', 'encounters'],
        properties: {
          noKartu: { type: 'string', example: '0001234567890' },
          fullName: { type: 'string', example: 'Budi Santoso' },
          nikMasked: { type: 'string', example: '3201************' },
          gender: { type: 'string', enum: ['L', 'P'], example: 'L' },
          dateOfBirth: { type: 'string', format: 'date', example: '1985-05-12' },
          membershipSegment: { type: 'string', example: 'PPU Badan Usaha' },
          encounters: {
            type: 'array',
            items: { $ref: '#/components/schemas/Encounter' },
          },
        },
      },
      ParticipantRiskEvaluationResult: {
        type: 'object',
        properties: {
          noKartu: { type: 'string', example: '0001234567890' },
          fullName: { type: 'string', example: 'Budi Santoso' },
          overallRiskScore: { type: 'number', example: 92 },
          overallRiskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], example: 'CRITICAL' },
          primaryModus: { type: 'string', example: 'IMPOSSIBLE_TRAVEL' },
          potentialDjsLoss: { type: 'number', example: 14800000 },
          anomaliesDetectedCount: { type: 'integer', example: 2 },
          anomalies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                ruleCode: { type: 'string', example: 'RULE-IMP-TRAV-01' },
                title: { type: 'string', example: 'Impossible Travel Velocity Alert' },
                category: { type: 'string', example: 'IDENTITY_SHARING' },
                severity: { type: 'string', example: 'CRITICAL' },
                confidenceScore: { type: 'number', example: 0.95 },
                description: { type: 'string' },
                regulatoryBasis: { type: 'string', example: 'Permenkes No. 16/2019 Pasal 7 & KUHP 263' },
              },
            },
          },
        },
      },
      RagSearchResult: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'REG-001' },
          title: { type: 'string', example: 'Permenkes 16/2019: Definisi Fraud JKN' },
          regulation: { type: 'string', example: 'Permenkes No. 16 Tahun 2019' },
          chapter: { type: 'string', example: 'BAB I' },
          article: { type: 'string', example: 'Pasal 1 & Pasal 2' },
          category: { type: 'string', example: 'DEFINISI_HUKUM' },
          content: { type: 'string' },
          similarity: { type: 'number', format: 'float', example: 0.94 },
        },
      },
      AiChatMessage: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          role: { type: 'string', enum: ['user', 'assistant'], example: 'user' },
          content: { type: 'string', example: 'Bagaimana analisis risiko klaim peserta Budi Santoso?' },
        },
      },
      AiChatRequest: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            items: { $ref: '#/components/schemas/AiChatMessage' },
          },
          model: { type: 'string', example: 'openai/gpt-oss-120b:nitro' },
          mode: { type: 'string', enum: ['chat', 'voice'], default: 'chat' },
          temperature: { type: 'number', example: 0.5 },
          maxTokens: { type: 'integer', example: 2500 },
        },
      },
    },
  },
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['System & Health'],
        summary: 'Pemeriksaan Kesehatan Layanan API & Integrasi',
        description: 'Mengembalikan status koneksi backend, database Supabase (pgvector), dan engine OpenRouter AI.',
        responses: {
          200: {
            description: 'Layanan beroperasi normal (Healthy)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        uptime: { type: 'number', example: 342.15 },
                        services: {
                          type: 'object',
                          properties: {
                            supabase: { type: 'object' },
                            openrouter: { type: 'object' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/v1/auth/status': {
      get: {
        tags: ['Auth & Session'],
        summary: 'Status Layanan Autentikasi',
        responses: {
          200: {
            description: 'Konfigurasi provider auth',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth & Session'],
        summary: 'Login Akun Auditor / Verifikator',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'auditor@bpjs-kesehatan.go.id' },
                  password: { type: 'string', format: 'password', example: 'RahasiaKuat123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login berhasil, mengembalikan token JWT dan data user' },
          400: { description: 'Kredensial salah atau email tidak terdaftar' },
          429: { description: 'Terlalu banyak percobaan login (Rate limit exceeded)' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth & Session'],
        summary: 'Profil Pengguna Terautentikasi (JWT)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Data pengguna dari token JWT' },
          401: { description: 'Token tidak diberikan atau sesi kedaluwarsa' },
        },
      },
    },

    '/api/v1/participant-risk/evaluate': {
      post: {
        tags: ['Participant Risk Analytics'],
        summary: 'Evaluasi Komprehensif Risiko & Deteksi Anomali Klaim Peserta',
        description: 'Menganalisis riwayat kunjungan peserta secara deterministik berdasarkan 4 modul fraud utama: Impossible Travel, Doctor Shopping (DSI), Diskordansi Biologis, dan Penyalahgunaan Obat PRB/Alkes.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PesertaProfile' },
            },
          },
        },
        responses: {
          200: {
            description: 'Evaluasi selesai, mengembalikan skor risiko dan anomali terverifikasi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/ParticipantRiskEvaluationResult' },
                  },
                },
              },
            },
          },
          400: { description: 'Validasi Zod gagal (misal: koordinat di luar jangkauan atau format kunjungan cacat)' },
        },
      },
    },
    '/api/v1/participant-risk/metrics': {
      get: {
        tags: ['Participant Risk Analytics'],
        summary: 'Metrik & KPI Agregat Investigasi Fraud',
        responses: {
          200: {
            description: 'Statistik agregat efisiensi risiko peserta',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/api/v1/participant-risk/case-studies': {
      get: {
        tags: ['Participant Risk Analytics'],
        summary: 'Daftar Kasus Benchmark Investigasi Forensik',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'riskLevel', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Daftar benchmark kasus nyata (Budi Santoso, Hendra Wijaya, Nurul Hidayati, Agus Pratama)' },
        },
      },
    },
    '/api/v1/participant-risk/case-studies/{id}': {
      get: {
        tags: ['Participant Risk Analytics'],
        summary: 'Detail Kasus Berdasarkan ID atau Kode Kasus',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'case-01' },
        ],
        responses: {
          200: { description: 'Data lengkap kasus forensik dan log SEP' },
          404: { description: 'Kasus tidak ditemukan' },
        },
      },
    },
    '/api/v1/participant-risk/anomalies': {
      get: {
        tags: ['Participant Risk Analytics'],
        summary: 'Antrean Temuan Anomali Klaim Peserta',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Daftar anomali klaim aktif' },
        },
      },
    },

    '/api/v1/rag/search': {
      get: {
        tags: ['RAG Regulations'],
        summary: 'Pencarian Semantik Regulasi JKN (Supabase pgvector)',
        description: 'Mencari pasal regulasi hukum JKN yang relevan dengan pertanyaan penyelidikan fraud.',
        parameters: [
          { name: 'query', in: 'query', required: true, schema: { type: 'string' }, example: 'larangan peminjaman kartu dan sanksi' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 3 } },
          { name: 'threshold', in: 'query', schema: { type: 'number', default: 0.35 } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Hasil pencarian semantik berperingkat kemiripan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RagSearchResult' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/rag/regulations': {
      get: {
        tags: ['RAG Regulations'],
        summary: 'Daftar Seluruh Korpus Regulasi JKN (38 Regulasi Terverifikasi)',
        responses: {
          200: { description: 'Seluruh pasal regulasi JKN yang terdaftar' },
        },
      },
    },

    '/api/v1/ai/status': {
      get: {
        tags: ['AI Agent & LLM'],
        summary: 'Status Mesin Kecerdasan Artifisial (OpenRouter AI)',
        responses: {
          200: { description: 'Status kredensial model AI dan latency' },
        },
      },
    },
    '/api/v1/ai/chat': {
      post: {
        tags: ['AI Agent & LLM'],
        summary: 'Analisis Chat Non-Streaming AI dengan RAG Grounding',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AiChatRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Respon analitis lengkap dari model bahasa' },
          429: { description: 'Rate limit AI terlampaui (25 req/menit)' },
        },
      },
    },
    '/api/v1/ai/chat/stream': {
      post: {
        tags: ['AI Agent & LLM'],
        summary: 'Server-Sent Events (SSE) Real-Time AI Investigation Stream',
        description: 'Aliran SSE dengan event: `metadata` (sitasi RAG & model), `delta` (potongan teks), dan `done` (finishReason & token usage). Dilengkapi timeout 60 detik dan keep-alive ping 15 detik.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AiChatRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Aliran transmisi Server-Sent Events',
            content: {
              'text/event-stream': {
                schema: { type: 'string', example: 'event: delta\ndata: {"content":"Berdasarkan"}\n\n' },
              },
            },
          },
          429: { description: 'Rate limit streaming terlampaui' },
        },
      },
    },
  },
};
