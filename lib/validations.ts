import { z } from "zod";
import { EventMode, EventStatus, RegistrationStatus } from "@prisma/client";

// ============================================
// AUTH
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(100, "Le mot de passe ne peut pas dépasser 100 caractères"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================
// REGISTRATION
// ============================================

export const registrationSchema = z.object({
  eventId: z.string().uuid("ID d'événement invalide"),
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères"),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  email: z.string().email("Email invalide"),
  notes: z.string().max(500, "Les notes ne peuvent pas dépasser 500 caractères").optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

// ============================================
// EVENT
// ============================================

export const eventSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(100, "Le titre ne peut pas dépasser 100 caractères"),
  subtitle: z.string().max(200, "Le sous-titre ne peut pas dépasser 200 caractères").optional().nullable(),
  description: z.string().max(5000, "La description ne peut pas dépasser 5000 caractères").optional().nullable(),
  mode: z.nativeEnum(EventMode),
  location: z.string().max(500, "L'adresse ne peut pas dépasser 500 caractères").optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  timezone: z.string().default("Europe/Paris"),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  waitlist: z.boolean().default(true),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
}).refine(
  (data) => data.endAt > data.startAt,
  {
    message: "La date de fin doit être après la date de début",
    path: ["endAt"],
  }
);

export type EventInput = z.infer<typeof eventSchema>;

// ============================================
// REGISTRATION STATUS UPDATE
// ============================================

export const updateRegistrationStatusSchema = z.object({
  registrationId: z.string().uuid(),
  status: z.nativeEnum(RegistrationStatus),
});

export type UpdateRegistrationStatusInput = z.infer<typeof updateRegistrationStatusSchema>;
