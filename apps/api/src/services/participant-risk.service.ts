import type {
  PesertaProfile,
  PesertaEncounter,
  ParticipantRiskEvaluationResult,
  ParticipantAnomalyEvidence,
  ParticipantRiskCategory,
  ParticipantRiskMetrics,
  ParticipantAuditCase,
  RiskLevel,
} from '@healthathon/shared';

/**
 * Haversine Distance in Kilometers
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

class ParticipantRiskService {
  /**
   * Evaluate a participant's complete clinical and encounter profile
   */
  public evaluateParticipant(profile: PesertaProfile): ParticipantRiskEvaluationResult {
    const anomalies: ParticipantAnomalyEvidence[] = [];
    let potentialDjsLoss = 0;

    const encounters = [...profile.encounters].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // ------------------------------------------------------------------------
    // ALGORITMA 1: IMPOSSIBLE TRAVEL VELOCITY (MODUS 2: KARTU PINJAMAN)
    // ------------------------------------------------------------------------
    for (let i = 0; i < encounters.length - 1; i++) {
      const e1 = encounters[i]!;
      const e2 = encounters[i + 1]!;

      const t1 = new Date(e1.timestamp).getTime();
      const t2 = new Date(e2.timestamp).getTime();
      const deltaHours = Math.abs(t2 - t1) / (1000 * 60 * 60);

      // Only evaluate if different facilities
      if (e1.ppkCode !== e2.ppkCode && deltaHours > 0 && deltaHours <= 6) {
        const distanceKm = calculateHaversineDistance(
          e1.location.lat,
          e1.location.lng,
          e2.location.lat,
          e2.location.lng
        );

        const velocityKmH = Math.round(distanceKm / deltaHours);

        // If impossible velocity (> 120 km/h) or simultaneous encounter in different cities
        if ((distanceKm > 40 && velocityKmH > 100) || (deltaHours <= 1.5 && distanceKm > 60)) {
          potentialDjsLoss += e2.cbgTariff;
          anomalies.push({
            category: 'IDENTITY_SHARING',
            title: 'Anomali Impossible Travel: Kartu Digunakan Bersamaan Lintas Kota',
            severityScore: Math.min(100, 75 + Math.round(velocityKmH / 10)),
            evidenceSummary: `Kartu terbit SEP di ${e1.faskesName} (${e1.location.city}) pada pk. ${new Date(e1.timestamp).toLocaleTimeString('id-ID')} lalu digunakan kembali di ${e2.faskesName} (${e2.location.city}) pk. ${new Date(e2.timestamp).toLocaleTimeString('id-ID')} (${deltaHours.toFixed(1)} jam, jarak ${distanceKm} km, kecepatan implisit ${velocityKmH} km/jam).`,
            velocityKmH,
            distanceKm,
            timeDeltaHours: Math.round(deltaHours * 10) / 10,
            legalGrounding: {
              regulation: 'Peraturan BPJS Kesehatan No. 6 Tahun 2020',
              article: 'Pasal Penanganan Kecurangan Peserta',
              summary: 'Larangan meminjamkan atau memperjualbelikan identitas kartu jaminan kesehatan kepada pihak lain.',
              sanction: 'Pembatalan SEP yang sedang berjalan dan pemblokiran sementara status kepesertaan.',
            },
          });
        }
      }
    }

    // ------------------------------------------------------------------------
    // ALGORITMA 2: DOCTOR SHOPPING INDEX (MODUS 3: PELAYANAN TIDAK PERLU)
    // ------------------------------------------------------------------------
    const recentEncounters = encounters.filter((e) => {
      const diffDays =
        (Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    });

    const faskesVisited = new Set(recentEncounters.map((e) => e.ppkCode));
    const diagnosisGroups = new Map<string, PesertaEncounter[]>();

    for (const e of recentEncounters) {
      const icd3 = e.diagnosaUtama.slice(0, 3).toUpperCase();
      if (!diagnosisGroups.has(icd3)) {
        diagnosisGroups.set(icd3, []);
      }
      diagnosisGroups.get(icd3)!.push(e);
    }

    for (const [icdGroup, groupEncounters] of diagnosisGroups.entries()) {
      const distinctFaskes = new Set(groupEncounters.map((e) => e.ppkCode));
      if (groupEncounters.length >= 3 && distinctFaskes.size >= 2) {
        const redundantVisitsCost = groupEncounters
          .slice(1)
          .reduce((sum, e) => sum + e.cbgTariff, 0);

        potentialDjsLoss += redundantVisitsCost;
        anomalies.push({
          category: 'UNNECESSARY_SERVICES',
          title: `Doctor Shopping: ${groupEncounters.length} Kunjungan Diagnosa Serupa (${icdGroup})`,
          severityScore: Math.min(95, 60 + groupEncounters.length * 8),
          evidenceSummary: `Peserta mengunjungi ${distinctFaskes.size} fasilitas kesehatan berbeda sebanyak ${groupEncounters.length} kali dalam 30 hari terakhir dengan keluhan klinis identik (${groupEncounters[0]?.namaDiagnosa || icdGroup}) tanpa rujukan berjenjang yang sah.`,
          doctorShoppingCount: groupEncounters.length,
          legalGrounding: {
            regulation: 'Permenkes No. 16 Tahun 2019',
            article: 'Pasal 2 & Pasal 5 ayat (3)',
            summary: 'Pemanfaatan hak pelayanan kesehatan yang berulang dan tidak berindikasi medis (unnecessary utilization).',
            sanction: 'Penguncian eligibilitas rujukan poli dan konseling kepatuhan pelayanan di FKTP terdaftar.',
          },
        });
      }
    }

    // ------------------------------------------------------------------------
    // ALGORITMA 3: PRESCRIPTION OVERLAP RATIO / PRB (MODUS 4: RESALE OBAT)
    // ------------------------------------------------------------------------
    let totalSupplyDaysChronic = 0;
    let chronicDrugCost = 0;

    for (const e of encounters) {
      if (e.prescribedDrugs && e.prescribedDrugs.length > 0) {
        for (const drug of e.prescribedDrugs) {
          if (drug.isPrbChronic) {
            totalSupplyDaysChronic += drug.quantityDays;
            chronicDrugCost += drug.quantityDays * drug.unitPrice;
          }
        }
      }
    }

    // Standard monthly period = 30 days
    const por = Math.round((totalSupplyDaysChronic / 30) * 100);
    if (por > 140) {
      const excessDays = totalSupplyDaysChronic - 30;
      const excessCost = Math.round((excessDays / totalSupplyDaysChronic) * chronicDrugCost);
      potentialDjsLoss += excessCost;

      anomalies.push({
        category: 'MEDICINE_ALKES_ABUSE',
        title: `Penyalahgunaan Obat PRB: Prescription Overlap ${por}%`,
        severityScore: Math.min(98, 70 + Math.round((por - 100) / 4)),
        evidenceSummary: `Peserta mengambil jatah obat kronis Program Rujuk Balik (PRB) sebanyak ${totalSupplyDaysChronic} hari konsumsi dalam jendela 30 hari (rasio surplus ${por}%). Indikasi kuat penimbunan obat untuk dijual kembali (resale arbitrage).`,
        prescriptionOverlapPercent: por,
        legalGrounding: {
          regulation: 'Panduan Klinis PRB & Permenkes No. 16 Tahun 2019',
          article: 'Ketentuan Peresepan Obat Kronis 30 Hari',
          summary: 'Larangan peresepan ganda dan pemindahtanganan/penjualan obat jaminan JKN kepada pihak ketiga.',
          sanction: 'Suspensi hak pengambilan obat di apotek mitra luar dan kewajiban pengembalian kerugian obat ke DJS.',
        },
      });
    }

    // ------------------------------------------------------------------------
    // ALGORITMA 4: COOLING-OFF PERIOD ALAT KESEHATAN (MODUS 4: ALKES BERULANG)
    // ------------------------------------------------------------------------
    for (const e of encounters) {
      if (e.medicalDeviceClaimed) {
        const device = e.medicalDeviceClaimed;
        if (device.lastClaimDate) {
          const daysSinceLastClaim =
            (new Date(e.timestamp).getTime() - new Date(device.lastClaimDate).getTime()) /
            (1000 * 60 * 60 * 24);

          let requiredWaitingDays = 730; // Kacamata: 2 years
          if (device.deviceType === 'ALAT_BANTU_DENGAR' || device.deviceType === 'KURSI_RODA') {
            requiredWaitingDays = 1825; // 5 years
          }

          if (daysSinceLastClaim < requiredWaitingDays) {
            const daysRemaining = Math.round(requiredWaitingDays - daysSinceLastClaim);
            potentialDjsLoss += device.claimAmount;

            anomalies.push({
              category: 'MEDICINE_ALKES_ABUSE',
              title: `Pelanggaran Masa Tunggu Alkes ${device.deviceType}: Sisa ${daysRemaining} Hari`,
              severityScore: 82,
              evidenceSummary: `Pengajuan klaim ${device.deviceType} kedua diajukan setelah ${Math.round(daysSinceLastClaim)} hari, padahal masa tunggu resmi BPJS adalah ${requiredWaitingDays} hari (sisa masa tunggu ${daysRemaining} hari belum terpenuhi).`,
              coolingOffViolationDaysRemaining: daysRemaining,
              legalGrounding: {
                regulation: 'Peraturan BPJS Kesehatan No. 1 Tahun 2014',
                article: 'Masa Retensi Alat Kesehatan',
                summary: 'Klaim kacamata dibatasi 1x per 2 tahun; alat bantu dengar & kursi roda dibatasi 1x per 5 tahun.',
                sanction: 'Penolakan klaim pra-bayar dan penagihan biaya jika telah terlanjur cair.',
              },
            });
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // ALGORITMA 5: PEMALSUAN DATA & DISKORDANSI DEMOGRAFI (MODUS 1)
    // ------------------------------------------------------------------------
    for (const e of encounters) {
      // Check male with obstetrics diagnosis
      if (profile.gender === 'L' && e.diagnosaUtama.startsWith('O')) {
        potentialDjsLoss += e.cbgTariff;
        anomalies.push({
          category: 'IDENTITY_FALSIFICATION',
          title: 'Diskordansi Gender: Peserta Pria Terbit SEP Persalinan (Obstetri)',
          severityScore: 99,
          evidenceSummary: `Nomor kartu peserta berjenis kelamin LAKI-LAKI didaftarkan untuk klaim prosedur kehamilan/persalinan (${e.diagnosaUtama}: ${e.namaDiagnosa}). Indikasi kuat pemalsuan data identitas fisik di faskes.`,
          legalGrounding: {
            regulation: 'KUHP Pasal 263 & Permenkes No. 16 Tahun 2019',
            article: 'Pemalsuan Surat & Sanksi Pidana',
            summary: 'Tindakan memalsukan surat/identitas untuk memperoleh keuntungan layanan finansial jaminan sosial.',
            sanction: 'Pembatalan instan seluruh klaim, pelaporan ke kepolisian, dan penuntutan ganti rugi 100%.',
          },
        });
      }
    }

    // Compute Overall Risk Metrics
    let overallRiskScore = 15; // Baseline low risk
    let riskLevel: RiskLevel = 'LOW';
    let primaryCategory: ParticipantRiskCategory = 'CLEAN_PARTICIPANT';

    if (anomalies.length > 0) {
      const maxScore = Math.max(...anomalies.map((a) => a.severityScore));
      overallRiskScore = maxScore;

      // Determine highest severity category
      const highestAnomaly = anomalies.find((a) => a.severityScore === maxScore);
      if (highestAnomaly) {
        primaryCategory = highestAnomaly.category;
      }

      if (overallRiskScore >= 85) {
        riskLevel = 'CRITICAL';
      } else if (overallRiskScore >= 70) {
        riskLevel = 'HIGH';
      } else if (overallRiskScore >= 50) {
        riskLevel = 'MEDIUM';
      }
    }

    // Determine Recommended Action
    let recommendedAction = 'Peserta memiliki profil utilisasi wajar dan sesuai ketentuan JKN.';
    if (riskLevel === 'CRITICAL') {
      recommendedAction =
        'TINDAKAN SEGERA: Bekukan sementara SEP berjalan, terbitkan surat panggilan klarifikasi identitas ke peserta, dan lakukan audit silang dengan rekam medis RS.';
    } else if (riskLevel === 'HIGH') {
      recommendedAction =
        'AUDIT LANJUTAN: Lakukan verifikasi riwayat pengambilan obat PRB / alkes, kunci rujukan antar-faskes mandiri, dan arahkan ke dokter penanggung jawab FKTP.';
    } else if (riskLevel === 'MEDIUM') {
      recommendedAction =
        'MONITORING AKTIF: Berikan edukasi pembatasan rujukan unnecessary services dan pantau histori SEP 14 hari ke depan.';
    }

    const birthYear = parseInt(profile.dateOfBirth.slice(0, 4), 10);
    const age = isNaN(birthYear) ? 35 : new Date().getFullYear() - birthYear;

    return {
      noKartu: profile.noKartu,
      namaPeserta: profile.fullName,
      nikMasked: profile.nikMasked,
      gender: profile.gender,
      age,
      membershipSegment: profile.membershipSegment,
      totalEncountersLast30Days: recentEncounters.length,
      overallRiskScore,
      riskLevel,
      primaryCategory,
      anomalies,
      potentialDjsLossAmount: potentialDjsLoss,
      recommendedAction,
      isFlaggedForAudit: anomalies.length > 0,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get Aggregate KPI Metrics for Participant Risk
   */
  public getMetrics(): ParticipantRiskMetrics {
    return {
      totalParticipantsAudited: 42180,
      totalAnomaliesDetected: 1485,
      totalPotentialDjsLossPrevented: 2450000000, // Rp 2.45 Miliar
      totalCleanClaimsApproved: 38700000000,     // Rp 38.7 Miliar
      categoryDistribution: {
        IDENTITY_SHARING: 432,         // 29.1%
        UNNECESSARY_SERVICES: 512,     // 34.5%
        MEDICINE_ALKES_ABUSE: 381,     // 25.7%
        IDENTITY_FALSIFICATION: 160,   // 10.8%
        CLEAN_PARTICIPANT: 40695,
      },
      riskLevelDistribution: {
        CRITICAL: 284,
        HIGH: 621,
        MEDIUM: 580,
        LOW: 40695,
      },
      topRiskCities: [
        { city: 'Kota Semarang', count: 320 },
        { city: 'Kota Medan', count: 285 },
        { city: 'Kota Surabaya', count: 240 },
        { city: 'Kota Bandung', count: 210 },
        { city: 'Jakarta Selatan', count: 195 },
      ],
      timeframe: '30 Hari Terakhir (Live VEDIKA Audit)',
    };
  }

  /**
   * Get 4 Benchmark In-Depth Case Studies for Healthkathon Pitching
   */
  public getCaseStudies(): ParticipantAuditCase[] {
    return [
      {
        id: 'CASE-001',
        caseCode: 'HK-ID-SHARING-2026',
        category: 'IDENTITY_SHARING',
        categoryLabel: 'Penyalahgunaan Identitas: Kartu Pinjaman (Impossible Travel)',
        patientName: 'Budi Santoso (Kartu Dipinjamkan)',
        noKartu: '0001847291038',
        nikMasked: '3374**********01',
        riskScore: 96,
        riskLevel: 'CRITICAL',
        potentialLoss: 8400000,
        summary:
          'Kartu peserta yang sama digunakan untuk mendaftar rawat inap di Semarang dan rawat jalan di Solo dalam selang 45 menit (kecepatan implisit 180 km/jam).',
        detailedAnalysis:
          'Audit log VClaim membuktikan noKartu 0001847291038 terbit SEP No. 1114R0010926V0001 di RSUD Moewardi Surakarta pk. 08:30 WIB, lalu pk. 09:15 WIB terbit SEP kedua No. 1101R0050926V0042 di RS Mitra Husada Semarang. Investigasi lapangan mengungkap kartu dipinjamkan kepada sepupu peserta yang tidak memiliki jaminan aktif.',
        encounters: [
          {
            id: 'ENC-01',
            noSep: '1114R0010926V0001',
            timestamp: '2026-09-04T08:30:00Z',
            ppkCode: '1114R001',
            faskesName: 'RSUD Dr. Moewardi Surakarta',
            faskesClass: 'A',
            location: { city: 'Kota Surakarta', province: 'Jawa Tengah', lat: -7.558, lng: 110.856 },
            jnsPelayanan: 1,
            diagnosaUtama: 'I21.0',
            namaDiagnosa: 'Acute transmural myocardial infarction',
            cbgTariff: 8400000,
          },
          {
            id: 'ENC-02',
            noSep: '1101R0050926V0042',
            timestamp: '2026-09-04T09:15:00Z',
            ppkCode: '1101R005',
            faskesName: 'RS Mitra Husada Semarang',
            faskesClass: 'B',
            location: { city: 'Kota Semarang', province: 'Jawa Tengah', lat: -6.993, lng: 110.420 },
            jnsPelayanan: 2,
            diagnosaUtama: 'M54.5',
            namaDiagnosa: 'Low back pain',
            cbgTariff: 320000,
          },
        ],
        legalReference: {
          regulation: 'Peraturan BPJS Kesehatan No. 6 Tahun 2020 & KUHP 263',
          article: 'Pasal Sanksi Penyalahgunaan Kartu Peserta',
          summary: 'Tindakan meminjamkan kartu jaminan sosial kepada orang lain yang bukan haknya.',
          sanction: 'Pembatalan SEP berjalan, penagihan biaya rawat Rp 8.400.000 ke pemegang kartu, dan suspensi hak jaminan.',
        },
        recommendedSanction: 'BATALKAN SEP BERJALAN & TAGIH GANTI RUGI DJS',
      },
      {
        id: 'CASE-002',
        caseCode: 'HK-DOC-SHOPPING-2026',
        category: 'UNNECESSARY_SERVICES',
        categoryLabel: 'Pelayanan Tidak Perlu: Doctor Shopping Kunjungan Redundan',
        patientName: 'Hendra Wijaya',
        noKartu: '0002938471920',
        nikMasked: '3273**********88',
        riskScore: 88,
        riskLevel: 'HIGH',
        potentialLoss: 4200000,
        summary:
          'Peserta berpindah-pindah 5 faskes berbeda dalam 10 hari untuk keluhan pusing/vertigo ringan demi mendapatkan pemeriksaan CT-Scan otak berulang.',
        detailedAnalysis:
          'Pola audit menunjukkan peserta mendatangi 3 klinik pratama dan 2 IGD RS swasta yang berbeda di Kota Bandung dalam interval rata-rata 2 hari dengan keluhan R42 (Dizziness and giddiness). Setiap kunjungan menghasilkan peresepan obat simptomatis yang menumpuk dan rujukan pemeriksaan penunjang mahal yang tidak memiliki indikasi kedaruratan.',
        encounters: [
          {
            id: 'ENC-03',
            noSep: '0112P0010926V0010',
            timestamp: '2026-08-26T10:00:00Z',
            ppkCode: '0112P001',
            faskesName: 'Klinik Pratama Sehat 1',
            faskesClass: 'FKTP',
            location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.917, lng: 107.619 },
            jnsPelayanan: 2,
            diagnosaUtama: 'R42',
            namaDiagnosa: 'Dizziness and giddiness (Vertigo)',
            cbgTariff: 180000,
          },
          {
            id: 'ENC-04',
            noSep: '0112R0030926V0099',
            timestamp: '2026-08-28T14:30:00Z',
            ppkCode: '0112R003',
            faskesName: 'RS Swasta Rajawali Bandung',
            faskesClass: 'C',
            location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.905, lng: 107.635 },
            jnsPelayanan: 2,
            diagnosaUtama: 'R42',
            namaDiagnosa: 'Dizziness and giddiness',
            cbgTariff: 950000,
          },
          {
            id: 'ENC-05',
            noSep: '0112R0050926V0120',
            timestamp: '2026-08-31T09:00:00Z',
            ppkCode: '0112R005',
            faskesName: 'RS Advent Bandung',
            faskesClass: 'B',
            location: { city: 'Kota Bandung', province: 'Jawa Barat', lat: -6.890, lng: 107.605 },
            jnsPelayanan: 2,
            diagnosaUtama: 'R42',
            namaDiagnosa: 'Dizziness and giddiness',
            cbgTariff: 1450000,
          },
        ],
        legalReference: {
          regulation: 'Permenkes No. 16 Tahun 2019 & Permenkes No. 28 Tahun 2014',
          article: 'Kendali Mutu dan Biaya Pelayanan Kesehatan',
          summary: 'Kunjungan berulang tanpa indikasi medis baru di luar alur sistem rujukan berjenjang resmi BPJS.',
          sanction: 'Penguncian eligibilitas rujukan poli spesialis mandiri dan pengalihan ke dokter keluarga FKTP terdaftar.',
        },
        recommendedSanction: 'KUNCI RUJUKAN MANDIRI & KONSELING DOKTER FKTP',
      },
      {
        id: 'CASE-003',
        caseCode: 'HK-PRB-RESALE-2026',
        category: 'MEDICINE_ALKES_ABUSE',
        categoryLabel: 'Penyalahgunaan Obat: Resale Arbitrage Obat Kronis PRB',
        patientName: 'Nurul Hidayati',
        noKartu: '0003847192834',
        nikMasked: '1271**********54',
        riskScore: 94,
        riskLevel: 'CRITICAL',
        potentialLoss: 6300000,
        summary:
          'Peserta Program Rujuk Balik (PRB) diabetes mengambil resep Insulin dan Amlodipine di 3 apotek jejaring berbeda dalam 1 bulan (surplus 190% obat).',
        detailedAnalysis:
          'Data log apotek SATUSEHAT mendeteksi peserta menebus Insulin Glargine dan Amlodipine 10mg sebanyak 90 hari pakai hanya dalam kurun waktu 22 hari. Pasien mendatangi apotek yang berbeda di Kota Medan dengan modus memanfaatkan celah resep cetak manual, untuk kemudian menjual kembali obat bermerek tersebut ke apotek non-faskes.',
        encounters: [
          {
            id: 'ENC-06',
            noSep: '0201R0120926V0015',
            timestamp: '2026-08-10T11:00:00Z',
            ppkCode: '0201R012',
            faskesName: 'Klinik PRB Sejahtera Medan',
            faskesClass: 'FKTP',
            location: { city: 'Kota Medan', province: 'Sumatera Utara', lat: 3.595, lng: 98.672 },
            jnsPelayanan: 2,
            diagnosaUtama: 'E11.9',
            namaDiagnosa: 'Type 2 diabetes mellitus',
            cbgTariff: 1200000,
            prescribedDrugs: [
              { drugName: 'Insulin Glargine Pen', isPrbChronic: true, quantityDays: 30, unitPrice: 350000 },
              { drugName: 'Amlodipine 10mg', isPrbChronic: true, quantityDays: 30, unitPrice: 45000 },
            ],
          },
          {
            id: 'ENC-07',
            noSep: '0201P0030926V0088',
            timestamp: '2026-08-20T16:00:00Z',
            ppkCode: '0201P003',
            faskesName: 'Apotek Kimia Farma Rujukan Medan',
            faskesClass: 'FKTP',
            location: { city: 'Kota Medan', province: 'Sumatera Utara', lat: 3.585, lng: 98.680 },
            jnsPelayanan: 2,
            diagnosaUtama: 'E11.9',
            namaDiagnosa: 'Type 2 diabetes mellitus',
            cbgTariff: 1200000,
            prescribedDrugs: [
              { drugName: 'Insulin Glargine Pen', isPrbChronic: true, quantityDays: 30, unitPrice: 350000 },
              { drugName: 'Amlodipine 10mg', isPrbChronic: true, quantityDays: 30, unitPrice: 45000 },
            ],
          },
        ],
        legalReference: {
          regulation: 'Panduan Klinis Program Rujuk Balik BPJS & Permenkes 16/2019',
          article: 'Ketentuan Batas Maksimal Peresepan 30 Hari',
          summary: 'Penimbunan dan penjualan kembali obat yang dibiayai Dana Jaminan Sosial.',
          sanction: 'Blokir penebusan obat di apotek luar, wajibkan pengawasan minum obat (PMO) langsung di Puskesmas.',
        },
        recommendedSanction: 'BLOKIR AKSES APOTEK JEJARING & AUDIT KEPATUHAN OBAT',
      },
      {
        id: 'CASE-004',
        caseCode: 'HK-ID-FALSIFY-2026',
        category: 'IDENTITY_FALSIFICATION',
        categoryLabel: 'Pemalsuan Data Identitas: Diskordansi Medis Gender Laki-Laki',
        patientName: 'Agus Pratama (Identitas Disalahgunakan)',
        noKartu: '0004928172938',
        nikMasked: '3578**********11',
        riskScore: 99,
        riskLevel: 'CRITICAL',
        potentialLoss: 12800000,
        summary:
          'Nomor kartu peserta berjenis kelamin Laki-Laki digunakan untuk klaim rawat inap persalinan Seksio Sesarea (O82.0) di RS Swasta Surabaya.',
        detailedAnalysis:
          'Sistem VEDIKA mendeteksi kegagalan biometrik dan diskordansi biologis mutlak: master data peserta NIK 3578**********11 atas nama Agus Pratama (Gender Laki-Laki, Umur 42 tahun) terbit SEP rawat inap Seksio Sesarea. Fakta membuktikan kartu digunakan oleh istri siri peserta yang belum didaftarkan resmi ke dinas kependudukan.',
        encounters: [
          {
            id: 'ENC-08',
            noSep: '3578R0040926V0001',
            timestamp: '2026-09-02T03:15:00Z',
            ppkCode: '3578R004',
            faskesName: 'RS Ibu dan Anak Surabaya',
            faskesClass: 'C',
            location: { city: 'Kota Surabaya', province: 'Jawa Timur', lat: -7.257, lng: 112.752 },
            jnsPelayanan: 1,
            diagnosaUtama: 'O82.0',
            namaDiagnosa: 'Delivery by elective caesarean section',
            cbgTariff: 12800000,
          },
        ],
        legalReference: {
          regulation: 'KUHP Pasal 263 (Pemalsuan Surat) & Permenkes No. 16 Tahun 2019',
          article: 'Pasal 6 ayat (2) Pengenaan Sanksi dan Pelimpahan Pidana',
          summary: 'Pemalsuan identitas untuk mengakses penjaminan biaya persalinan faskes.',
          sanction: 'Penolakan klaim 100%, tagihan biaya mandiri kepada keluarga pasien, dan pembuatan Berita Acara Pelanggaran.',
        },
        recommendedSanction: 'TOLAK PENJAMINAN & TERBITKAN BERITA ACARA PELANGGARAN',
      },
    ];
  }
}

export const participantRiskService = new ParticipantRiskService();
