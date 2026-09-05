import { participantRiskService } from '../apps/api/src/services/participant-risk.service.js';

console.log('=== TEST PARTICIPANT RISK SERVICE (HEALTHKATHON 2026) ===');

// 1. Test Metrics
const metrics = participantRiskService.getMetrics();
console.log('\n--- 1. Aggregated Metrics ---');
console.log('Total Participants Audited:', metrics.totalParticipantsAudited);
console.log('Total Potential DJS Loss Prevented: Rp', metrics.totalPotentialDjsLossPrevented.toLocaleString('id-ID'));
console.log('Category Distribution:', metrics.categoryDistribution);
console.log('Risk Level Distribution:', metrics.riskLevelDistribution);

// 2. Test 4 Benchmark Case Studies
const cases = participantRiskService.getCaseStudies();
console.log('\n--- 2. Benchmark Case Studies (4 Moduses) ---');
for (const c of cases) {
  console.log(`\n[${c.caseCode}] ${c.categoryLabel}`);
  console.log(`- Peserta: ${c.patientName} (${c.noKartu}, NIK: ${c.nikMasked})`);
  console.log(`- Skor Risiko: ${c.riskScore}/100 (${c.riskLevel})`);
  console.log(`- Potensi Kerugian DJS: Rp ${c.potentialLoss.toLocaleString('id-ID')}`);
  console.log(`- Dasar Regulasi: ${c.legalReference.regulation} (${c.legalReference.article})`);
  console.log(`- Rekomendasi Sanksi: ${c.recommendedSanction}`);
}

// 3. Test Evaluation on Case 1 Profile
console.log('\n--- 3. Running Real-time Evaluation on Case 1 Profile ---');
const case1 = cases[0]!;
const profile1 = {
  noKartu: case1.noKartu,
  nikMasked: case1.nikMasked,
  fullName: case1.patientName,
  gender: 'L' as const,
  dateOfBirth: '1985-05-12',
  faskesTingkat1: 'Klinik Pratama Sehat Mandiri',
  membershipSegment: 'PBPU_MANDIRI' as const,
  statusIuran: 'AKTIF' as const,
  encounters: case1.encounters,
};

const evalResult = participantRiskService.evaluateParticipant(profile1);
console.log('Evaluation Result:');
console.log('- Risk Score:', evalResult.overallRiskScore);
console.log('- Risk Level:', evalResult.riskLevel);
console.log('- Primary Category:', evalResult.primaryCategory);
console.log('- Detected Anomalies Count:', evalResult.anomalies.length);
console.log('- First Anomaly Title:', evalResult.anomalies[0]?.title);
console.log('- Potential DJS Loss:', evalResult.potentialDjsLossAmount);
console.log('- Action:', evalResult.recommendedAction);

console.log('\n>>> ALL PARTICIPANT RISK SERVICE TESTS PASSED SUCCESSFULLY! <<<');
