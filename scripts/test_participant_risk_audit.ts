/**
 * Healthkathon BPJS 2026 - Participant Risk & Mathematical Fraud Algorithms Auditor
 * Automated Audit Suite against http://localhost:4000/api/v1/participant-risk/*
 */

const BASE_URL = 'http://localhost:4000/api/v1/participant-risk';

interface SearchResult {
  id: string;
  noKartu: string;
  patientName: string;
  nikMasked: string;
  gender?: string;
  riskScore?: number;
  riskLevel?: string;
  primaryCategory?: string;
  encounters?: any[];
}

interface EvaluationResult {
  noKartu: string;
  namaPeserta: string;
  nikMasked: string;
  gender: string;
  age: number;
  overallRiskScore: number;
  riskLevel: string;
  primaryCategory: string;
  potentialDjsLossAmount: number;
  recommendedAction: string;
  isFlaggedForAudit: boolean;
  anomalies: Array<{
    category: string;
    title: string;
    severityScore: number;
    evidenceSummary: string;
    velocityKmH?: number;
    distanceKm?: number;
    timeDeltaHours?: number;
    doctorShoppingCount?: number;
    prescriptionOverlapPercent?: number;
    legalGrounding?: {
      regulation: string;
      article: string;
      summary: string;
      sanction: string;
    };
  }>;
}

async function runAudit() {
  console.log('='.repeat(80));
  console.log(' AUDIT SUITE: BPJS PARTICIPANT RISK & FRAUD DETECTION ALGORITHMS');
  console.log(' Target Endpoint: ' + BASE_URL);
  console.log(' Date of Audit: ' + new Date().toISOString());
  console.log('='.repeat(80));

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] ${message}`);
    } else {
      console.error(`  [FAIL] ${message}`);
    }
  }

  // ============================================================================
  // TEST 1: DYNAMIC PARTICIPANT SEARCH
  // ============================================================================
  console.log('\n' + '-'.repeat(80));
  console.log('TEST 1: DYNAMIC PARTICIPANT SEARCH (GET /search?query=...)');
  console.log('-'.repeat(80));

  const searchCases = [
    { type: 'Nama', query: 'Budi', minExpected: 1, nameMatch: 'Budi' },
    { type: 'Nama', query: 'Hendra', minExpected: 1, nameMatch: 'Hendra' },
    { type: 'Nama', query: 'Siti Rahayu', minExpected: 1, nameMatch: 'Siti' },
    { type: 'Nama', query: 'Nurul', minExpected: 1, nameMatch: 'Nurul' },
    { type: 'No Kartu', query: '0001847291038', minExpected: 1, kartuMatch: '0001847291038' },
    { type: 'No Kartu', query: '0002938471920', minExpected: 1, kartuMatch: '0002938471920' },
    { type: 'Masked NIK', query: '3374**********01', minExpected: 1, nikMatch: '3374**********01' },
    { type: 'No SEP', query: '1114R0010926V0001', minExpected: 1, sepMatch: '1114R0010926V0001' },
    { type: 'No SEP', query: '0112P0010926V0010', minExpected: 1, sepMatch: '0112P0010926V0010' },
    { type: 'Fictitious Peserta', query: 'Nama Yang Tidak Pernah Ada', minExpected: 0, maxExpected: 0 },
  ];

  for (const sc of searchCases) {
    try {
      const url = `${BASE_URL}/search?query=${encodeURIComponent(sc.query)}`;
      const res = await fetch(url);
      const json = await res.json();

      assert(res.status === 200, `Query "${sc.query}" HTTP Status 200`);
      assert(json.success === true, `Query "${sc.query}" success flag is true`);

      const data: SearchResult[] = json.data || [];
      console.log(`    -> Query "${sc.query}" returned ${data.length} match(es).`);

      if (sc.maxExpected === 0) {
        assert(data.length === 0, `Query fiktif "${sc.query}" mengembalikan 0 hasil (bersih tanpa fallback palsu)`);
      } else {
        assert(data.length >= sc.minExpected, `Query "${sc.query}" mengembalikan minimal ${sc.minExpected} hasil`);
        if (sc.nameMatch && data[0]) {
          assert(data[0].patientName.toLowerCase().includes(sc.nameMatch.toLowerCase()), `Nama peserta pertama memuat "${sc.nameMatch}": (${data[0].patientName})`);
        }
        if (sc.kartuMatch && data[0]) {
          assert(data[0].noKartu === sc.kartuMatch, `No Kartu cocok: ${data[0].noKartu}`);
        }
        if (sc.nikMatch && data[0]) {
          assert(data[0].nikMasked === sc.nikMatch, `NIK Masked cocok: ${data[0].nikMasked}`);
        }
        if (sc.sepMatch && data[0]) {
          const hasSep = data.some(d => d.encounters?.some(e => e.noSep === sc.sepMatch));
          assert(hasSep, `SEP cocok ditemukan di encounter: ${sc.sepMatch}`);
        }
      }
    } catch (err: any) {
      console.error(`  [ERROR] Error querying "${sc.query}":`, err.message);
      totalTests++;
    }
  }

  // ============================================================================
  // TEST 2: ALGORITMA 1 - IMPOSSIBLE TRAVEL & HAVERSINE VELOCITY
  // ============================================================================
  console.log('\n' + '-'.repeat(80));
  console.log('TEST 2: ALGORITMA 1 - IMPOSSIBLE TRAVEL & HAVERSINE DISTANCE');
  console.log('-'.repeat(80));

  // 100 km distance: Semarang lat: -6.9930, lng: 110.4200.
  // 100 km south: lat = -6.9930 - (100 / 111.195) = -7.8923, lng: 110.4200.
  // Selang waktu: 30 menit (0.5 jam) -> Kecepatan implisit: 200 km/jam.
  const payloadImpossibleTravel = {
    noKartu: '0009988776655',
    fullName: 'Test Auditor Traveler',
    nikMasked: '3374**********99',
    gender: 'L',
    dateOfBirth: '1990-01-01',
    membershipSegment: 'PBPU_MANDIRI',
    encounters: [
      {
        id: 'ENC-TEST-01',
        noSep: '1101R0010926V0091',
        timestamp: '2026-09-12T08:00:00Z',
        ppkCode: '1101R001',
        faskesName: 'RSUD KRMT Wongsonegoro Semarang',
        faskesClass: 'B',
        location: {
          city: 'Kota Semarang',
          province: 'Jawa Tengah',
          lat: -6.9930,
          lng: 110.4200,
        },
        jnsPelayanan: 2,
        diagnosaUtama: 'I10',
        namaDiagnosa: 'Essential (primary) hypertension',
        cbgTariff: 450000,
      },
      {
        id: 'ENC-TEST-02',
        noSep: '1114R0020926V0092',
        timestamp: '2026-09-12T08:30:00Z', // 30 mins later
        ppkCode: '1114R002',
        faskesName: 'RSUD Pandan Arang Boyolali',
        faskesClass: 'B',
        location: {
          city: 'Kabupaten Boyolali',
          province: 'Jawa Tengah',
          lat: -7.8923, // ~100 km away
          lng: 110.4200,
        },
        jnsPelayanan: 2,
        diagnosaUtama: 'K29.7',
        namaDiagnosa: 'Gastritis, unspecified',
        cbgTariff: 550000,
      },
    ],
  };

  try {
    const res = await fetch(`${BASE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadImpossibleTravel),
    });
    const json = await res.json();
    assert(res.status === 200, 'POST /evaluate HTTP Status 200');
    assert(json.success === true, 'Response success is true');

    const evalData: EvaluationResult = json.data;
    console.log(`    -> Overall Risk Score: ${evalData.overallRiskScore} (${evalData.riskLevel})`);
    console.log(`    -> Primary Category: ${evalData.primaryCategory}`);
    console.log(`    -> Potential Loss: Rp ${evalData.potentialDjsLossAmount.toLocaleString('id-ID')}`);

    const anomaly = evalData.anomalies.find((a) => a.category === 'IDENTITY_SHARING');
    assert(!!anomaly, 'Anomali IDENTITY_SHARING terdeteksi');
    if (anomaly) {
      console.log(`    -> Anomaly Title: ${anomaly.title}`);
      console.log(`    -> Computed Distance: ${anomaly.distanceKm} km`);
      console.log(`    -> Computed Time Delta: ${anomaly.timeDeltaHours} jam (30 menit)`);
      console.log(`    -> Computed Velocity: ${anomaly.velocityKmH} km/jam`);

      assert(
        anomaly.distanceKm !== undefined && anomaly.distanceKm >= 99 && anomaly.distanceKm <= 101,
        `Jarak Haversine dihitung presisi ~100 km (aktual: ${anomaly.distanceKm} km)`
      );
      assert(
        anomaly.timeDeltaHours === 0.5,
        `Selang waktu terhitung presisi 0.5 jam (30 menit)`
      );
      assert(
        anomaly.velocityKmH !== undefined && anomaly.velocityKmH >= 198 && anomaly.velocityKmH <= 202,
        `Kecepatan terhitung presisi ~200 km/jam (aktual: ${anomaly.velocityKmH} km/jam)`
      );
      assert(
        evalData.potentialDjsLossAmount === 550000,
        `Potensi kerugian DJS dihitung dari tariff encounter kedua (Rp 550.000)`
      );
    }
  } catch (err: any) {
    console.error('  [ERROR] Impossible Travel test failed:', err.message);
    totalTests++;
  }

  // ============================================================================
  // TEST 3: ALGORITMA 2 - DOCTOR SHOPPING INDEX (DSI)
  // ============================================================================
  console.log('\n' + '-'.repeat(80));
  console.log('TEST 3: ALGORITMA 2 - DOCTOR SHOPPING INDEX (DSI)');
  console.log('-'.repeat(80));

  const payloadDoctorShopping = {
    noKartu: '0008877665544',
    fullName: 'Test Auditor Doctor Shopper',
    nikMasked: '3273**********77',
    gender: 'P',
    dateOfBirth: '1988-03-25',
    membershipSegment: 'PPU',
    encounters: [
      {
        id: 'ENC-DS-01',
        noSep: '0112P0010926V0101',
        timestamp: '2026-09-06T09:00:00Z',
        ppkCode: '0112P001',
        faskesName: 'Klinik Pratama Farma 1',
        faskesClass: 'FKTP',
        location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.917, lng: 107.619 },
        jnsPelayanan: 2,
        diagnosaUtama: 'R42',
        namaDiagnosa: 'Dizziness and giddiness (Vertigo)',
        cbgTariff: 180000,
      },
      {
        id: 'ENC-DS-02',
        noSep: '0112R0030926V0102',
        timestamp: '2026-09-08T11:00:00Z',
        ppkCode: '0112R003',
        faskesName: 'RS Santo Yusuf Bandung',
        faskesClass: 'C',
        location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.905, lng: 107.635 },
        jnsPelayanan: 2,
        diagnosaUtama: 'R42',
        namaDiagnosa: 'Dizziness and giddiness',
        cbgTariff: 850000,
      },
      {
        id: 'ENC-DS-03',
        noSep: '0112R0050926V0103',
        timestamp: '2026-09-11T14:30:00Z',
        ppkCode: '0112R005',
        faskesName: 'RS Halmahera Siaga Bandung',
        faskesClass: 'B',
        location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.908, lng: 107.620 },
        jnsPelayanan: 2,
        diagnosaUtama: 'R42',
        namaDiagnosa: 'Dizziness and giddiness',
        cbgTariff: 1450000,
      },
    ],
  };

  try {
    const res = await fetch(`${BASE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadDoctorShopping),
    });
    const json = await res.json();
    assert(res.status === 200, 'POST /evaluate HTTP Status 200');
    assert(json.success === true, 'Response success is true');

    const evalData: EvaluationResult = json.data;
    console.log(`    -> Overall Risk Score: ${evalData.overallRiskScore} (${evalData.riskLevel})`);
    console.log(`    -> Primary Category: ${evalData.primaryCategory}`);
    console.log(`    -> Potential Loss: Rp ${evalData.potentialDjsLossAmount.toLocaleString('id-ID')}`);

    const anomaly = evalData.anomalies.find((a) => a.category === 'UNNECESSARY_SERVICES');
    assert(!!anomaly, 'Anomali UNNECESSARY_SERVICES terdeteksi');
    if (anomaly) {
      console.log(`    -> Anomaly Title: ${anomaly.title}`);
      console.log(`    -> Doctor Shopping Count: ${anomaly.doctorShoppingCount}`);
      console.log(`    -> Severity Score: ${anomaly.severityScore}`);

      assert(
        anomaly.doctorShoppingCount === 3,
        `Doctor shopping count terhitung 3 kunjungan faskes berbeda`
      );
      // Redundant visits are encounter 2 and 3: 850000 + 1450000 = 2300000
      assert(
        evalData.potentialDjsLossAmount === 2300000,
        `Potensi kerugian redundan akurat (Rp 850.000 + Rp 1.450.000 = Rp 2.300.000)`
      );
      assert(
        anomaly.severityScore === 84, // 60 + 3 * 8 = 84
        `Severity score formula akurat: 60 + (3 * 8) = 84`
      );
    }
  } catch (err: any) {
    console.error('  [ERROR] Doctor Shopping test failed:', err.message);
    totalTests++;
  }

  // ============================================================================
  // TEST 4: ALGORITMA 3 - PRB RESALE & PRESCRIPTION OVERLAP RATIO
  // ============================================================================
  console.log('\n' + '-'.repeat(80));
  console.log('TEST 4: ALGORITMA 3 - PRB RESALE & OVERLAP RATIO');
  console.log('-'.repeat(80));

  // Sub-test 4A: Single PRB Drug Overlap (60 hari dalam tempo 10 hari)
  const payloadSingleDrugPrb = {
    noKartu: '0007766554422',
    fullName: 'Bapak Subur (PRB Hipertensi)',
    nikMasked: '3273**********12',
    gender: 'L',
    dateOfBirth: '1965-02-18',
    membershipSegment: 'PBPU_MANDIRI',
    encounters: [
      {
        id: 'ENC-PRB-SINGLE-01',
        noSep: '0112P0010926V9901',
        timestamp: '2026-09-01T09:00:00Z',
        ppkCode: '0112P001',
        faskesName: 'Klinik Pratama Sehat 1',
        faskesClass: 'FKTP',
        location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.917, lng: 107.619 },
        jnsPelayanan: 2,
        diagnosaUtama: 'I10',
        namaDiagnosa: 'Essential (primary) hypertension',
        cbgTariff: 150000,
        prescribedDrugs: [
          { drugName: 'Amlodipine 10mg', isPrbChronic: true, quantityDays: 30, unitPrice: 10000 },
        ],
      },
      {
        id: 'ENC-PRB-SINGLE-02',
        noSep: '0112P0050926V9902',
        timestamp: '2026-09-11T09:00:00Z', // Persis 10 hari kemudian
        ppkCode: '0112P005',
        faskesName: 'Apotek Jejaring Sehat 2',
        faskesClass: 'FKTP',
        location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.905, lng: 107.635 },
        jnsPelayanan: 2,
        diagnosaUtama: 'I10',
        namaDiagnosa: 'Essential (primary) hypertension',
        cbgTariff: 150000,
        prescribedDrugs: [
          { drugName: 'Amlodipine 10mg', isPrbChronic: true, quantityDays: 30, unitPrice: 10000 },
        ],
      },
    ],
  };

  try {
    const res = await fetch(`${BASE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadSingleDrugPrb),
    });
    const json = await res.json();
    assert(res.status === 200, 'POST /evaluate (Single PRB) HTTP Status 200');
    assert(json.success === true, 'Response success is true');

    const evalData: EvaluationResult = json.data;
    console.log(`    -> Overall Risk Score: ${evalData.overallRiskScore} (${evalData.riskLevel})`);
    console.log(`    -> Primary Category: ${evalData.primaryCategory}`);
    console.log(`    -> Potential Loss: Rp ${evalData.potentialDjsLossAmount.toLocaleString('id-ID')}`);

    const anomaly = evalData.anomalies.find((a) => a.category === 'MEDICINE_ALKES_ABUSE');
    assert(!!anomaly, 'Anomali MEDICINE_ALKES_ABUSE terdeteksi pada peresepan 60 hari obat dalam tempo 10 hari');
    if (anomaly) {
      console.log(`    -> Anomaly Title: ${anomaly.title}`);
      console.log(`    -> Prescription Overlap Percent: ${anomaly.prescriptionOverlapPercent}%`);
      console.log(`    -> Severity Score: ${anomaly.severityScore}`);

      assert(
        anomaly.prescriptionOverlapPercent === 200,
        `Prescription Overlap Ratio persis 200% (60 hari / 30 hari standar kuota)`
      );
      assert(
        evalData.potentialDjsLossAmount === 300000,
        `Potensi kerugian surplus 30 hari dihitung presisi Rp 300.000 (30 x Rp 10.000)`
      );
      assert(
        anomaly.severityScore === 95,
        `Severity score persis 95 (70 + (200 - 100) / 4 = 95)`
      );
    }
  } catch (err: any) {
    console.error('  [ERROR] Single PRB Resale test failed:', err.message);
    totalTests++;
  }

  // Sub-test 4B: Multi PRB Drug Overlap (120 hari dalam tempo 10 hari)
  const payloadPrbResale = {
    noKartu: '0007766554433',
    fullName: 'Test Auditor PRB Hoarder',
    nikMasked: '1271**********33',
    gender: 'P',
    dateOfBirth: '1975-07-15',
    membershipSegment: 'PBI_APBN',
    encounters: [
      {
        id: 'ENC-PRB-01',
        noSep: '0201R0120926V0501',
        timestamp: '2026-09-01T08:30:00Z',
        ppkCode: '0201R012',
        faskesName: 'Klinik PRB Sejahtera Medan',
        faskesClass: 'FKTP',
        location: { city: 'Kota Medan', province: 'Sumatera Utara', lat: 3.595, lng: 98.672 },
        jnsPelayanan: 2,
        diagnosaUtama: 'E11.9',
        namaDiagnosa: 'Type 2 diabetes mellitus without complications',
        cbgTariff: 1200000,
        prescribedDrugs: [
          { drugName: 'Insulin Glargine Pen 100 IU/ml', isPrbChronic: true, quantityDays: 30, unitPrice: 350000 },
          { drugName: 'Amlodipine 10mg', isPrbChronic: true, quantityDays: 30, unitPrice: 50000 },
        ],
      },
      {
        id: 'ENC-PRB-02',
        noSep: '0201P0030926V0502',
        timestamp: '2026-09-11T10:00:00Z', // 10 days later
        ppkCode: '0201P003',
        faskesName: 'Apotek Kimia Farma Partner Medan',
        faskesClass: 'FKTP',
        location: { city: 'Kota Medan', province: 'Sumatera Utara', lat: 3.585, lng: 98.680 },
        jnsPelayanan: 2,
        diagnosaUtama: 'E11.9',
        namaDiagnosa: 'Type 2 diabetes mellitus without complications',
        cbgTariff: 1200000,
        prescribedDrugs: [
          { drugName: 'Insulin Glargine Pen 100 IU/ml', isPrbChronic: true, quantityDays: 30, unitPrice: 350000 },
          { drugName: 'Amlodipine 10mg', isPrbChronic: true, quantityDays: 30, unitPrice: 50000 },
        ],
      },
    ],
  };

  try {
    const res = await fetch(`${BASE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadPrbResale),
    });
    const json = await res.json();
    assert(res.status === 200, 'POST /evaluate HTTP Status 200');
    assert(json.success === true, 'Response success is true');

    const evalData: EvaluationResult = json.data;
    console.log(`    -> Overall Risk Score: ${evalData.overallRiskScore} (${evalData.riskLevel})`);
    console.log(`    -> Primary Category: ${evalData.primaryCategory}`);
    console.log(`    -> Potential Loss: Rp ${evalData.potentialDjsLossAmount.toLocaleString('id-ID')}`);

    const anomaly = evalData.anomalies.find((a) => a.category === 'MEDICINE_ALKES_ABUSE');
    assert(!!anomaly, 'Anomali MEDICINE_ALKES_ABUSE terdeteksi');
    if (anomaly) {
      console.log(`    -> Anomaly Title: ${anomaly.title}`);
      console.log(`    -> Prescription Overlap Percent: ${anomaly.prescriptionOverlapPercent}%`);
      console.log(`    -> Severity Score: ${anomaly.severityScore}`);

      assert(
        anomaly.prescriptionOverlapPercent !== undefined && anomaly.prescriptionOverlapPercent > 140,
        `Rasio tumpang-tindih obat melebihi threshold 140% (aktual: ${anomaly.prescriptionOverlapPercent}%)`
      );
      assert(
        evalData.potentialDjsLossAmount === 18000000,
        `Potensi kerugian surplus obat terhitung: Rp ${evalData.potentialDjsLossAmount.toLocaleString('id-ID')}`
      );
      assert(
        anomaly.severityScore >= 85,
        `Severity score masuk kategori kritis/tinggi: ${anomaly.severityScore}`
      );
    }
  } catch (err: any) {
    console.error('  [ERROR] PRB Resale test failed:', err.message);
    totalTests++;
  }

  // Sub-test 4C: Clean Participant (Jatah PRB 30 hari wajar tanpa tumpang tindih)
  const payloadCleanPrb = {
    noKartu: '0007766554411',
    fullName: 'Ibu Rahmawati (Tertib PRB)',
    nikMasked: '3273**********99',
    gender: 'P',
    dateOfBirth: '1970-10-10',
    membershipSegment: 'PPU',
    encounters: [
      {
        id: 'ENC-PRB-CLEAN-01',
        noSep: '0112P0010926V0099',
        timestamp: '2026-09-01T08:00:00Z',
        ppkCode: '0112P001',
        faskesName: 'Klinik Pratama Sehat 1',
        faskesClass: 'FKTP',
        location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.917, lng: 107.619 },
        jnsPelayanan: 2,
        diagnosaUtama: 'I10',
        namaDiagnosa: 'Essential (primary) hypertension',
        cbgTariff: 120000,
        prescribedDrugs: [
          { drugName: 'Amlodipine 10mg', isPrbChronic: true, quantityDays: 30, unitPrice: 10000 },
        ],
      },
    ],
  };

  try {
    const res = await fetch(`${BASE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadCleanPrb),
    });
    const json = await res.json();
    assert(res.status === 200, 'POST /evaluate (Clean PRB) HTTP Status 200');
    const evalData: EvaluationResult = json.data;
    assert(evalData.anomalies.length === 0, 'Peserta tertib PRB tidak memicu anomali obat (0 anomali)');
    assert(evalData.riskLevel === 'LOW', 'Risk level peserta tertib adalah LOW');
    assert(evalData.primaryCategory === 'CLEAN_PARTICIPANT', 'Kategori utama adalah CLEAN_PARTICIPANT');
    assert(evalData.potentialDjsLossAmount === 0, 'Potensi kerugian DJS adalah Rp 0');
  } catch (err: any) {
    console.error('  [ERROR] Clean PRB test failed:', err.message);
    totalTests++;
  }

  // ============================================================================
  // TEST 5: ALGORITMA 4 - DISKORDANSI BIOLOGIS & DEMOGRAFI
  // ============================================================================
  console.log('\n' + '-'.repeat(80));
  console.log('TEST 5: ALGORITMA 4 - DISKORDANSI BIOLOGIS (GENDER MALE + SEKSIO O82.0)');
  console.log('-'.repeat(80));

  const payloadDiscordance = {
    noKartu: '0006655443322',
    fullName: 'Bambang Sudibyo (Pria)',
    nikMasked: '3578**********11',
    gender: 'L', // Laki-Laki
    dateOfBirth: '1984-06-12',
    membershipSegment: 'PBPU_MANDIRI',
    encounters: [
      {
        id: 'ENC-DISC-01',
        noSep: '3578R0040926V9999',
        timestamp: '2026-09-12T05:15:00Z',
        ppkCode: '3578R004',
        faskesName: 'RS Ibu dan Anak Surabaya Indah',
        faskesClass: 'C',
        location: { city: 'Kota Surabaya', province: 'Jawa Timur', lat: -7.257, lng: 112.752 },
        jnsPelayanan: 1, // Rawat Inap
        diagnosaUtama: 'O82.0', // Seksio Sesarea
        namaDiagnosa: 'Delivery by elective caesarean section',
        cbgTariff: 13500000,
      },
    ],
  };

  try {
    const res = await fetch(`${BASE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadDiscordance),
    });
    const json = await res.json();
    assert(res.status === 200, 'POST /evaluate HTTP Status 200');
    assert(json.success === true, 'Response success is true');

    const evalData: EvaluationResult = json.data;
    console.log(`    -> Overall Risk Score: ${evalData.overallRiskScore} (${evalData.riskLevel})`);
    console.log(`    -> Primary Category: ${evalData.primaryCategory}`);
    console.log(`    -> Potential Loss: Rp ${evalData.potentialDjsLossAmount.toLocaleString('id-ID')}`);

    const anomaly = evalData.anomalies.find((a) => a.category === 'IDENTITY_FALSIFICATION');
    assert(!!anomaly, 'Anomali IDENTITY_FALSIFICATION terdeteksi');
    if (anomaly) {
      console.log(`    -> Anomaly Title: ${anomaly.title}`);
      console.log(`    -> Severity Score: ${anomaly.severityScore}`);

      assert(
        anomaly.severityScore >= 99,
        `Diskordansi biologis mutlak memicu Severity Score 99+ (aktual: ${anomaly.severityScore})`
      );
      assert(
        evalData.overallRiskScore >= 99,
        `Overall Risk Score bernilai 99+ (aktual: ${evalData.overallRiskScore})`
      );
      assert(
        evalData.riskLevel === 'CRITICAL',
        `Risk level adalah CRITICAL (${evalData.riskLevel})`
      );
      assert(
        evalData.potentialDjsLossAmount === 13500000,
        `Seluruh tariff klaim persalinan (Rp 13.500.000) ditandai sebagai potensi kerugian DJS`
      );
      assert(
        evalData.recommendedAction.includes('TINDAKAN SEGERA'),
        `Tindakan mitigasi merekomendasikan pembekuan SEP dan audit rekam medis`
      );
    }
  } catch (err: any) {
    console.error('  [ERROR] Biological Discordance test failed:', err.message);
    totalTests++;
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log(` AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('='.repeat(80));
}

runAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
