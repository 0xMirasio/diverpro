import { z } from "zod";

const localeSchema = z.enum(["en", "fr", "es"]).default("en");

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9._-]+$/),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  locale: localeSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const visibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);
const coordinates = z
  .object({ latitude: latitude.nullable().optional(), longitude: longitude.nullable().optional() })
  .refine(
    (value) => (value.latitude == null) === (value.longitude == null),
    "Latitude and longitude must be supplied together",
  );

export const diveSchema = z
  .object({
    date: z.string().date(),
    siteName: z.string().trim().min(2).max(160),
    depthM: z.number().positive().max(350),
    durationMinutes: z.number().int().positive().max(1440),
    groupCount: z.number().int().min(1).max(100).default(1),
    details: z.string().trim().max(4000).optional().default(""),
    visibility: visibilitySchema.default("PUBLIC"),
    photoIds: z.array(z.string().uuid()).max(6).default([]),
  })
  .and(coordinates);

export const planSchema = z
  .object({
    plannedFor: z.string().date(),
    plannedUntil: z.string().date(),
    siteName: z.string().trim().min(2).max(160),
    details: z.string().trim().max(4000).optional().default(""),
    visibility: visibilitySchema.default("PUBLIC"),
  })
  .and(coordinates)
  .refine((value) => value.plannedUntil >= value.plannedFor, "End date must be on or after start date");

export const reviewSchema = z.object({
  siteId: z.string().uuid().optional(),
  siteName: z.string().trim().min(2).max(160).optional(),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  confirmNewSite: z.boolean().default(false),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(4000).optional().default(""),
  photoIds: z.array(z.string().uuid()).max(6).default([]),
}).refine((value) => Boolean(value.siteId) || (Boolean(value.siteName) && value.latitude != null && value.longitude != null), "Choose a site or provide its name and coordinates");

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9._-]+$/),
  birthDate: z.string().date().nullable(),
  bio: z.string().trim().max(500),
  profileVisibility: visibilitySchema,
  logbookVisibility: visibilitySchema,
  locale: localeSchema,
  avatarMediaId: z.string().uuid().nullable().optional(),
});
