/**
 * Temporal Grounding Utilities for INFERA & FERA Assistant
 * Enforces dynamic time synchronization in WIB / UTC+7 (Asia/Jakarta)
 */

export interface TemporalGroundingContext {
  iso: string;
  localTimeWib: string;
  timeZone: 'Asia/Jakarta';
  epochMs: number;
  fiscalYear: number;
  formattedInstruction: string;
}

/**
 * Returns dynamic temporal grounding anchor to prevent AI hallucination
 * and ground audits in current Indonesian ground truth.
 */
export function getTemporalAnchorContext(refDate: Date = new Date()): TemporalGroundingContext {
  const dateFormatted = refDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  const timeFormatted = refDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  const iso = refDate.toISOString();
  const epochMs = refDate.getTime();
  const fiscalYear = refDate.getFullYear();
  const localTimeWib = `${dateFormatted}, pukul ${timeFormatted} WIB`;

  const formattedInstruction = `
[TEMPORAL_ANCHOR]
- Current Local Time: ${localTimeWib}
- Current ISO-8601: ${iso}
- Timezone: Asia/Jakarta (WIB, UTC+7)
- Epoch Milliseconds: ${epochMs}
- Active Fiscal Year: ${fiscalYear}
PENTING: Seluruh evaluasi regulasi (Permenkes 16/2019, UU Kesehatan 17/2023), audit klaim readmisi 14 hari, masa tunggu cooling-off kacamata (2 thn) / alkes (5 thn), dan kalkulasi Impossible Travel WAJIB berpatokan pada waktu sekarang di atas.
[/TEMPORAL_ANCHOR]`.trim();

  return {
    iso,
    localTimeWib,
    timeZone: 'Asia/Jakarta',
    epochMs,
    fiscalYear,
    formattedInstruction,
  };
}
