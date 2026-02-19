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
  id: IdSchema,
  price: PriceSchema,
  description: DescriptionSchema,
  notes: NotesSchema.optional(),
  photoUrl: PhotoUrlSchema.optional(),
  latitude: LatitudeSchema.optional(),
  longitude: LongitudeSchema.optional(),
  geohash: GeohashSchema.optional(),
  status: z.enum(['pending', 'purchased', 'not_purchased']),
  postponedUntil: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type LocalItem = z.infer<typeof LocalItemSchema>;

/**
 * Consent schemas
 */

export const ConsentSchema = z.object({
  consentType: z.enum(['analytics', 'marketing', 'geolocation']),
  value: z.boolean(),
});

export type ConsentInput = z.infer<typeof ConsentSchema>;

/**
 * Backup schemas
 */

export const BackupSchema = z.object({
  encryptedData: z.string().min(1, 'Data required'),
  googleDriveFileId: z.string().optional(),
});

export type BackupInput = z.infer<typeof BackupSchema>;

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
