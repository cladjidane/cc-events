import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formater une date pour l'affichage
export function formatDate(date: Date | string, formatStr: string = "d MMMM yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, formatStr, { locale: fr });
}

// Formater une date avec l'heure
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

// Formater une plage de dates
export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;

  const sameDay =
    startDate.getDate() === endDate.getDate() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  if (sameDay) {
    return `${format(startDate, "d MMMM yyyy", { locale: fr })} de ${format(
      startDate,
      "HH:mm",
      { locale: fr }
    )} à ${format(endDate, "HH:mm", { locale: fr })}`;
  }

  return `Du ${format(startDate, "d MMMM yyyy 'à' HH:mm", { locale: fr })} au ${format(
    endDate,
    "d MMMM yyyy 'à' HH:mm",
    { locale: fr }
  )}`;
}

// Distance relative (ex: "il y a 2 jours")
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

// Générer un slug à partir d'un titre
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplacer les caractères non alphanumériques
    .replace(/(^-|-$)/g, ""); // Supprimer les tirets en début/fin
}

// Type pour les résultats d'actions
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
