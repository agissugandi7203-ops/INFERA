-- ==============================================================================
-- INFERA — BPJS KESEHATAN HEALTHKATHON 2026: EFISIENSI RISIKO PADA PESERTA
-- DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Compliance: UU No. 27/2022 (UU Perlindungan Data Pribadi) & Permenkes No. 16/2019
-- Engine: PostgreSQL 15+ with Supabase pgvector & pgcrypto
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABEL: PESERTA PROFILES (MASTER DATA PESERTA JKN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.peserta_profiles (
  no_kartu VARCHAR(13) PRIMARY KEY,
  nik_hash TEXT NOT NULL,                  -- SHA-256 hash untuk pencarian tanpa ekspos NIK mentah
  nik_masked VARCHAR(16) NOT NULL,         -- Masking sesuai UU PDP: "3374**********01"
  full_name TEXT NOT NULL,
  gender VARCHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
  date_of_birth DATE NOT NULL,
  faskes_tingkat_1 TEXT NOT NULL,          -- FKTP Terdaftar
  membership_segment VARCHAR(20) NOT NULL CHECK (
    membership_segment IN ('PBI_APBN', 'PBI_APBD', 'PPU', 'PBPU_MANDIRI')
  ),
  status_iuran VARCHAR(15) NOT NULL DEFAULT 'AKTIF' CHECK (
    status_iuran IN ('AKTIF', 'MENUNGGAK', 'NONAKTIF')
  ),
  overall_risk_score INT DEFAULT 0 CHECK (overall_risk_score BETWEEN 0 AND 100),
  risk_level VARCHAR(10) DEFAULT 'LOW' CHECK (
    risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),
  primary_risk_category VARCHAR(30) DEFAULT 'CLEAN_PARTICIPANT' CHECK (
    primary_risk_category IN (
      'IDENTITY_FALSIFICATION',
      'IDENTITY_SHARING',
      'UNNECESSARY_SERVICES',
      'MEDICINE_ALKES_ABUSE',
      'CLEAN_PARTICIPANT'
    )
  ),
  flagged_for_audit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABEL: PESERTA ENCOUNTERS (HISTORI KUNJUNGAN & TERBIT SEP)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.peserta_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_kartu VARCHAR(13) NOT NULL REFERENCES public.peserta_profiles(no_kartu) ON DELETE CASCADE,
  no_sep VARCHAR(25) NOT NULL UNIQUE,
  encounter_timestamp TIMESTAMPTZ NOT NULL,
  ppk_code VARCHAR(15) NOT NULL,
  faskes_name TEXT NOT NULL,
  faskes_class VARCHAR(15) NOT NULL,
  city VARCHAR(50) NOT NULL,
  province VARCHAR(50) NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  jns_pelayanan INT NOT NULL CHECK (jns_pelayanan IN (1, 2)), -- 1: Rawat Inap, 2: Rawat Jalan
  poli_tujuan TEXT,
  diagnosa_utama VARCHAR(10) NOT NULL,                       -- Kode ICD-10
  nama_diagnosa TEXT NOT NULL,
  cbg_code VARCHAR(10),
  cbg_tariff NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_encounters_no_kartu ON public.peserta_encounters(no_kartu);
CREATE INDEX IF NOT EXISTS idx_encounters_timestamp ON public.peserta_encounters(encounter_timestamp);
CREATE INDEX IF NOT EXISTS idx_encounters_diagnosa ON public.peserta_encounters(diagnosa_utama);

-- ==============================================================================
-- 4. TABEL: PRB MEDICATION LOGS (PROGRAM RUJUK BALIK & RESALE AUDIT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.prb_medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES public.peserta_encounters(id) ON DELETE CASCADE,
  no_kartu VARCHAR(13) NOT NULL REFERENCES public.peserta_profiles(no_kartu) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  is_prb_chronic BOOLEAN DEFAULT TRUE,
  quantity_days INT NOT NULL CHECK (quantity_days > 0),
  unit_price NUMERIC(15,2) NOT NULL,
  dispensed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prb_no_kartu ON public.prb_medication_logs(no_kartu);
CREATE INDEX IF NOT EXISTS idx_prb_dispensed ON public.prb_medication_logs(dispensed_at);

-- ==============================================================================
-- 5. TABEL: MEDICAL DEVICE CLAIMS (COOLING-OFF PERIOD ALKES AUDIT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medical_device_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES public.peserta_encounters(id) ON DELETE CASCADE,
  no_kartu VARCHAR(13) NOT NULL REFERENCES public.peserta_profiles(no_kartu) ON DELETE CASCADE,
  device_type VARCHAR(30) NOT NULL CHECK (
    device_type IN ('KACAMATA', 'ALAT_BANTU_DENGAR', 'KURSI_RODA')
  ),
  claim_amount NUMERIC(15,2) NOT NULL,
  claim_date DATE NOT NULL,
  cooling_off_days_required INT NOT NULL, -- 730 hari untuk kacamata, 1825 hari untuk alat bantu dengar
  is_violation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_no_kartu ON public.medical_device_claims(no_kartu);

-- ==============================================================================
-- 6. TABEL: PESERTA RISK ANOMALIES (HASIL TEMUAN AUDIT TIM PK-JKN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.peserta_risk_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_kartu VARCHAR(13) NOT NULL REFERENCES public.peserta_profiles(no_kartu) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL CHECK (
    category IN (
      'IDENTITY_FALSIFICATION',
      'IDENTITY_SHARING',
      'UNNECESSARY_SERVICES',
      'MEDICINE_ALKES_ABUSE'
    )
  ),
  title TEXT NOT NULL,
  severity_score INT NOT NULL CHECK (severity_score BETWEEN 1 AND 100),
  evidence_summary TEXT NOT NULL,
  potential_djs_loss NUMERIC(15,2) NOT NULL DEFAULT 0,
  legal_regulation TEXT NOT NULL,
  legal_article TEXT NOT NULL,
  legal_sanction TEXT,
  recommended_action TEXT,
  status VARCHAR(25) NOT NULL DEFAULT 'OPEN' CHECK (
    status IN ('OPEN', 'IN_INVESTIGATION', 'RESOLVED_RECOVERED', 'FALSE_POSITIVE')
  ),
  investigator_notes TEXT,
  assigned_auditor_id UUID,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_anomalies_category ON public.peserta_risk_anomalies(category);
CREATE INDEX IF NOT EXISTS idx_anomalies_status ON public.peserta_risk_anomalies(status);

-- ==============================================================================
-- 7. TABEL: AUDIT ACCESS LOGS (COMPLIANCE UU PDP PASAL 35)
-- Melacak setiap kali auditor melihat/mengunduh profil peserta atau data klaim
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by_user_id UUID,
  auditor_role VARCHAR(30) NOT NULL,
  action_performed VARCHAR(50) NOT NULL,  -- 'VIEW_PESERTA', 'EXPORT_REPORT', 'DISMISS_ANOMALY'
  target_no_kartu VARCHAR(13),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE public.peserta_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prb_medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_device_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta_risk_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_access_logs ENABLE ROW LEVEL SECURITY;

-- 8.1. Kebijakan untuk service_role (Backend API INFERA)
-- Backend memiliki hak penuh untuk sinkronisasi data & eksekusi evaluasi otomatis
CREATE POLICY "service_role_manage_profiles" ON public.peserta_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_manage_encounters" ON public.peserta_encounters
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_manage_prb" ON public.prb_medication_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_manage_devices" ON public.medical_device_claims
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_manage_anomalies" ON public.peserta_risk_anomalies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_manage_audit_logs" ON public.audit_access_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8.2. Kebijakan untuk authenticated users (Tim Verifikator & Auditor BPJS)
-- Auditor hanya dapat membaca peserta yang ditandai audit atau data anomali
CREATE POLICY "auditors_read_flagged_profiles" ON public.peserta_profiles
  FOR SELECT TO authenticated
  USING (flagged_for_audit = true OR auth.jwt() ->> 'role' IN ('admin', 'auditor'));

CREATE POLICY "auditors_read_encounters" ON public.peserta_encounters
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'auditor'));

CREATE POLICY "auditors_read_anomalies" ON public.peserta_risk_anomalies
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "auditors_update_anomaly_status" ON public.peserta_risk_anomalies
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'auditor'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'auditor'));

CREATE POLICY "auditors_insert_access_logs" ON public.audit_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 8.3. Anon users (Tidak ada izin akses langsung ke data identitas peserta)
-- Pengunjung anonim DILARANG membaca identitas peserta, hanya dapat melihat metrik agregat melalui RPC/View aman
CREATE POLICY "anon_read_anomalies_public_summary" ON public.peserta_risk_anomalies
  FOR SELECT TO anon
  USING (false); -- Block direct select by anon

-- ==============================================================================
-- 9. SECURE RPC: AGGREGATE DASHBOARD METRICS (SAFE FOR PUBLIC / ANON)
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_participant_risk_aggregate_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_audited', (SELECT COUNT(*) FROM public.peserta_profiles),
    'total_anomalies', (SELECT COUNT(*) FROM public.peserta_risk_anomalies),
    'total_potential_loss_prevented', COALESCE((SELECT SUM(potential_djs_loss) FROM public.peserta_risk_anomalies WHERE status != 'FALSE_POSITIVE'), 0),
    'critical_count', (SELECT COUNT(*) FROM public.peserta_risk_anomalies WHERE severity_score >= 85),
    'high_count', (SELECT COUNT(*) FROM public.peserta_risk_anomalies WHERE severity_score >= 70 AND severity_score < 85),
    'updated_at', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$;
