import { z } from 'zod';

const RISK_CATEGORIES = [
  'IDENTITY_SHARING',
  'UNNECESSARY_SERVICES',
  'MEDICINE_ALKES_ABUSE',
  'IDENTITY_FALSIFICATION',
  'CLEAN_PARTICIPANT',
] as const;

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

const isoLikeDate = z.string().trim().min(1, 'Timestamp is required').max(40);

const encounterSchema = z.object({
  id: z.string().max(100),
  noSep: z.string().max(100),
  timestamp: isoLikeDate,
  ppkCode: z.string().min(1).max(50),
  faskesName: z.string().min(1).max(200),
  faskesClass: z.string().max(50),
  location: z.object({
    city: z.string().max(100),
    province: z.string().max(100),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  jnsPelayanan: z.number().int().min(1).max(9),
  diagnosaUtama: z.string().min(1).max(20),
  namaDiagnosa: z.string().min(1).max(255),
  cbgTariff: z.number().nonnegative().max(10_000_000_000),
  prescribedDrugs: z
    .array(
      z.object({
        drugName: z.string().max(150),
        isPrbChronic: z.boolean(),
        quantityDays: z.number().int().positive().max(3650),
        unitPrice: z.number().nonnegative().max(1_000_000_000),
      })
    )
    .max(50)
    .optional(),
  medicalDeviceClaimed: z
    .object({
      deviceType: z.string().max(100),
      lastClaimDate: z.string().max(40).optional(),
      claimAmount: z.number().nonnegative().max(10_000_000_000),
    })
    .optional(),
});

export const evaluateProfileSchema = z.object({
  noKartu: z.string().trim().min(8).max(30),
  fullName: z.string().trim().min(1).max(150),
  nikMasked: z.string().max(30),
  gender: z.enum(['L', 'P']),
  dateOfBirth: z.string().min(1).max(40),
  membershipSegment: z.string().max(100),
  encounters: z.array(encounterSchema).min(1, 'Minimal satu data kunjungan diperlukan').max(200),
});

export const getAnomaliesQuerySchema = z.object({
  category: z.enum(RISK_CATEGORIES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const getCaseStudiesQuerySchema = z.object({
  category: z.enum(RISK_CATEGORIES).optional(),
  riskLevel: z.enum(RISK_LEVELS).optional(),
});

/**
 * Participant search term. Restricted to a safe character set because the value is used inside a
 * PostgREST `.or()` filter, where `,` `(` `)` `%` `\` `"` and `:` change the filter semantics
 * (filter injection could otherwise widen the query and dump the whole participant table).
 * Allows `*` for masked NIK searches (e.g. `3374**********01`), which is sanitized before PostgREST `.or()`.
 */
export const SEARCH_TERM_PATTERN = /^[\p{L}\p{N} .'\-/*]+$/u;

export const searchQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, 'Kata kunci minimal 2 karakter')
    .max(64, 'Kata kunci maksimal 64 karakter')
    .regex(SEARCH_TERM_PATTERN, 'Kata kunci hanya boleh berisi huruf, angka, spasi, titik, apostrof, garis miring, bintang mask (*), atau tanda hubung'),
});

export const caseStudyParamSchema = z.object({
  id: z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9\-_]+$/, 'ID studi kasus tidak valid'),
});

export type EvaluateProfileInput = z.infer<typeof evaluateProfileSchema>;
export type GetAnomaliesQueryInput = z.infer<typeof getAnomaliesQuerySchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
