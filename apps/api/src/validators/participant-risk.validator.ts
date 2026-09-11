import { z } from 'zod';

const encounterSchema = z.object({
  id: z.string().max(100),
  noSep: z.string().max(100),
  timestamp: z.string().min(1, 'Timestamp is required'),
  ppkCode: z.string().min(1).max(50),
  faskesName: z.string().min(1).max(200),
  faskesClass: z.string().max(50),
  location: z.object({
    city: z.string().max(100),
    province: z.string().max(100),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  jnsPelayanan: z.union([z.literal(1), z.literal(2), z.number()]),
  diagnosaUtama: z.string().min(1).max(20),
  namaDiagnosa: z.string().min(1).max(255),
  cbgTariff: z.number().nonnegative(),
  prescribedDrugs: z
    .array(
      z.object({
        drugName: z.string().max(150),
        isPrbChronic: z.boolean(),
        quantityDays: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      })
    )
    .max(50)
    .optional(),
  medicalDeviceClaimed: z
    .object({
      deviceType: z.string().max(100),
      lastClaimDate: z.string().optional(),
      claimAmount: z.number().nonnegative(),
    })
    .optional(),
});

export const evaluateProfileSchema = z.object({
  noKartu: z.string().min(8).max(30),
  fullName: z.string().min(1).max(150),
  nikMasked: z.string().max(30),
  gender: z.enum(['L', 'P']),
  dateOfBirth: z.string().min(1),
  membershipSegment: z.string().max(100),
  encounters: z.array(encounterSchema).min(1, 'Minimal satu data kunjungan diperlukan').max(200),
});

export const getAnomaliesQuerySchema = z.object({
  category: z
    .enum([
      'IDENTITY_SHARING',
      'UNNECESSARY_SERVICES',
      'MEDICINE_ALKES_ABUSE',
      'IDENTITY_FALSIFICATION',
      'CLEAN_PARTICIPANT',
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const caseStudyParamSchema = z.object({
  id: z.string().trim().min(1).max(100),
});

export type EvaluateProfileInput = z.infer<typeof evaluateProfileSchema>;
export type GetAnomaliesQueryInput = z.infer<typeof getAnomaliesQuerySchema>;
