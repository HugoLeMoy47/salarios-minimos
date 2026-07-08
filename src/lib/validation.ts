/**
 * Validación centralizada con Zod para todas las APIs
 */

import { z } from 'zod';

/**
 * Esquemas de validación reutilizables
 */

export const IdSchema = z.string().cuid('Invalid ID format');

export const EmailSchema = z.string().email('Invalid email format');

export const PriceSchema = z
  .number()
  .positive('Price must be positive')
  .max(999999, 'Price too high');

export const DescriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .max(255, 'Description too long');

export const NotesSchema = z.string().max(1000, 'Notes too long').optional();

export const PhotoUrlSchema = z.string().url('Invalid URL').optional();

export const LatitudeSchema = z.number().min(-90).max(90, 'Invalid latitude').optional();

export const LongitudeSchema = z.number().min(-180).max(180, 'Invalid longitude').optional();

export const GeohashSchema = z.string().max(10, 'Invalid geohash').optional();

/**
 * Item schemas
 */

export const CreateItemSchema = z.object({
  price: PriceSchema,
  description: DescriptionSchema,
  notes: NotesSchema,
  photoUrl: PhotoUrlSchema,
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  geohash: GeohashSchema,
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = CreateItemSchema.partial();

export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

/**
 * Shadow Profile schemas
 */

export const LocalItemSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  price: PriceSchema,
  description: DescriptionSchema,
  notes: NotesSchema.optional(),
  photoUrl: PhotoUrlSchema.optional(),
  latitude: LatitudeSchema.optional(),
  longitude: LongitudeSchema.optional(),
  geohash: GeohashSchema.optional(),
  status: z.enum(['pending', 'meditating', 'purchased', 'not_purchased', 'cancelled']),
  meditationStartedAt: z.string().datetime().optional(),
  meditationEndsAt: z.string().datetime().optional(),
  postponedUntil: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type LocalItem = z.infer<typeof LocalItemSchema>;

/**
 * Shadow Profile merge schema
 */

export const ShadowMergeSchema = z.object({
  shadowUUID: z.string().uuid('Invalid shadow UUID format'),
  localItems: z.array(LocalItemSchema),
});

export type ShadowMergeInput = z.infer<typeof ShadowMergeSchema>;

export const UuidBodySchema = z.object({
  uuid: z.string().uuid('Invalid UUID format'),
});

export const ShadowUuidBodySchema = z.object({
  shadowUUID: z.string().uuid('Invalid shadow UUID format'),
});

/**
 * Consent schemas
 */

// userId NO se acepta del cliente: el endpoint lo deriva de la sesión del servidor.
export const ConsentSchema = z.object({
  type: z.enum(['notifications', 'geolocation', 'analytics']),
  consent: z.boolean(),
});

export type ConsentInput = z.infer<typeof ConsentSchema>;

/**
 * Anonymized event schemas
 */

export const EventSchema = z.object({
  eventType: z.enum(['item_created', 'item_purchased', 'item_not_purchased', 'item_postponed']),
  salaryDaysBucket: z.enum(['0-0.9', '1-2.9', '3-6.9', '7+']).optional(),
  geohash6: GeohashSchema,
  timestamp15min: z.string().datetime().optional(),
});

export type EventInput = z.infer<typeof EventSchema>;

/**
 * Backup schemas
 */

export const BackupSchema = z.object({
  encryptedData: z.string().min(1, 'Data required'),
  googleDriveFileId: z.string().optional(),
});

export type BackupInput = z.infer<typeof BackupSchema>;

export const BackupItemSchema = z.object({
  price: PriceSchema,
  description: DescriptionSchema,
  notes: NotesSchema,
  photoUrl: PhotoUrlSchema,
  status: z.string().optional(),
  postponedUntil: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});

export const BackupDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  items: z.array(BackupItemSchema),
  shadowProfile: z
    .object({
      uuid: z.string(),
      mergedAt: z.string().datetime().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type BackupData = z.infer<typeof BackupDataSchema>;

/**
 * Query parameter schemas
 */

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

/**
 * Utility function to safely parse and return error response
 */
export function parseAndValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}
