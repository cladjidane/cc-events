"use client";

import { cn } from "@/lib/utils";

interface IsometricProps {
  className?: string;
}

// Logo - Cube stylisé avec dégradé
export function IsoLogo({ className }: IsometricProps) {
  return (
    <svg
      viewBox="0 0 60 70"
      className={cn("w-10 h-12", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Face supérieure */}
      <path
        d="M30 5L55 20L30 35L5 20L30 5Z"
        className="fill-primary"
      />
      {/* Face gauche */}
      <path
        d="M5 20L30 35L30 60L5 45L5 20Z"
        className="fill-primary/70"
      />
      {/* Face droite */}
      <path
        d="M55 20L30 35L30 60L55 45L55 20Z"
        className="fill-primary/50"
      />
      {/* Highlight */}
      <path
        d="M30 10L45 19L30 28L15 19L30 10Z"
        className="fill-primary-foreground/20"
      />
    </svg>
  );
}

// Calendrier isométrique
export function IsoCalendar({ className }: IsometricProps) {
  return (
    <svg
      viewBox="0 0 100 90"
      className={cn("w-20 h-18", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base */}
      <path d="M50 25L90 45L90 75L50 95L10 75L10 45L50 25Z" className="fill-secondary" />
      {/* Face supérieure */}
      <path d="M50 25L90 45L50 65L10 45L50 25Z" className="fill-card" />
      {/* Bordure haute colorée */}
      <path d="M50 20L85 38L50 56L15 38L50 20Z" className="fill-primary" />
      {/* Grille de jours */}
      <circle cx="35" cy="42" r="3" className="fill-muted" />
      <circle cx="50" cy="35" r="3" className="fill-muted" />
      <circle cx="65" cy="42" r="3" className="fill-primary/60" />
      <circle cx="35" cy="52" r="3" className="fill-muted" />
      <circle cx="50" cy="45" r="3" className="fill-muted" />
      <circle cx="65" cy="52" r="3" className="fill-muted" />
      {/* Anneaux */}
      <rect x="30" y="15" width="4" height="10" rx="1" className="fill-border" />
      <rect x="46" y="12" width="4" height="10" rx="1" className="fill-border" />
      <rect x="62" y="15" width="4" height="10" rx="1" className="fill-border" />
    </svg>
  );
}

// Groupe de personnes
export function IsoPeople({ className }: IsometricProps) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={cn("w-24 h-16", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Personne 1 (arrière) */}
      <g transform="translate(70, 5)">
        <circle cx="15" cy="12" r="10" className="fill-secondary" />
        <path d="M5 28L15 35L25 28L28 60L2 60L5 28Z" className="fill-muted" />
      </g>
      {/* Personne 2 (milieu) */}
      <g transform="translate(40, 12)">
        <circle cx="15" cy="12" r="10" className="fill-accent" />
        <path d="M5 28L15 35L25 28L28 65L2 65L5 28Z" className="fill-primary/40" />
      </g>
      {/* Personne 3 (devant) */}
      <g transform="translate(10, 18)">
        <circle cx="15" cy="12" r="10" className="fill-card" />
        <path d="M5 28L15 35L25 28L28 60L2 60L5 28Z" className="fill-primary/60" />
      </g>
    </svg>
  );
}

// Pin de localisation
export function IsoPin({ className }: IsometricProps) {
  return (
    <svg
      viewBox="0 0 60 85"
      className={cn("w-12 h-17", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ombre */}
      <ellipse cx="30" cy="78" rx="18" ry="6" className="fill-foreground/10" />
      {/* Corps du pin */}
      <path
        d="M30 8C18 8 10 18 10 30C10 48 30 65 30 65C30 65 50 48 50 30C50 18 42 8 30 8Z"
        className="fill-primary"
      />
      {/* Reflet */}
      <path
        d="M30 12C20 12 14 20 14 30C14 42 26 55 30 60C30 60 30 12 30 12Z"
        className="fill-primary/80"
      />
      {/* Cercle intérieur */}
      <circle cx="30" cy="30" r="10" className="fill-card" />
      <circle cx="30" cy="30" r="5" className="fill-primary/50" />
    </svg>
  );
}

// Ticket/Badge
export function IsoTicket({ className }: IsometricProps) {
  return (
    <svg
      viewBox="0 0 110 70"
      className={cn("w-22 h-14", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Corps du ticket */}
      <path d="M10 15L100 15L100 55L10 55L10 15Z" className="fill-card" />
      {/* Ombre */}
      <path d="M15 55L100 55L100 60L15 60L15 55Z" className="fill-border" />
      {/* Encoches */}
      <circle cx="10" cy="35" r="7" className="fill-background" />
      <circle cx="100" cy="35" r="7" className="fill-background" />
      {/* Ligne de perforation */}
      <line x1="78" y1="20" x2="78" y2="50" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
      {/* Contenu */}
      <rect x="20" y="25" width="45" height="4" rx="2" className="fill-primary/30" />
      <rect x="20" y="35" width="35" height="3" rx="1" className="fill-muted" />
      <rect x="20" y="42" width="40" height="3" rx="1" className="fill-muted" />
      {/* Icône */}
      <circle cx="88" cy="35" r="8" className="fill-primary/20" />
      <path d="M88 30L91 35L88 40L85 35L88 30Z" className="fill-primary" />
    </svg>
  );
}

// Blocs empilés (représente l'organisation)
export function IsoBlocks({ className }: IsometricProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("w-20 h-20", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bloc 1 (bas gauche) */}
      <g>
        <path d="M15 60L35 70L35 90L15 80L15 60Z" className="fill-secondary/80" />
        <path d="M35 70L55 60L55 80L35 90L35 70Z" className="fill-secondary/60" />
        <path d="M15 60L35 50L55 60L35 70L15 60Z" className="fill-secondary" />
      </g>
      {/* Bloc 2 (bas droite) */}
      <g>
        <path d="M50 60L70 70L70 90L50 80L50 60Z" className="fill-muted/80" />
        <path d="M70 70L90 60L90 80L70 90L70 70Z" className="fill-muted/60" />
        <path d="M50 60L70 50L90 60L70 70L50 60Z" className="fill-muted" />
      </g>
      {/* Bloc 3 (milieu) */}
      <g>
        <path d="M32 40L52 50L52 70L32 60L32 40Z" className="fill-accent/80" />
        <path d="M52 50L72 40L72 60L52 70L52 50Z" className="fill-accent/60" />
        <path d="M32 40L52 30L72 40L52 50L32 40Z" className="fill-accent" />
      </g>
      {/* Bloc 4 (haut) - accent */}
      <g>
        <path d="M42 20L62 30L62 50L42 40L42 20Z" className="fill-primary/80" />
        <path d="M62 30L82 20L82 40L62 50L62 30Z" className="fill-primary/60" />
        <path d="M42 20L62 10L82 20L62 30L42 20Z" className="fill-primary" />
      </g>
    </svg>
  );
}

// Notification/Cloche
export function IsoBell({ className }: IsometricProps) {
  return (
    <svg
      viewBox="0 0 60 80"
      className={cn("w-12 h-16", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Corps de la cloche */}
      <path
        d="M30 15C18 15 12 25 12 38L12 50L48 50L48 38C48 25 42 15 30 15Z"
        className="fill-accent"
      />
      {/* Reflet */}
      <path
        d="M30 18C20 18 15 26 15 38L15 48L30 48L30 18Z"
        className="fill-accent/80"
      />
      {/* Base */}
      <path d="M8 50L52 50L52 58L8 58L8 50Z" className="fill-primary/60" />
      {/* Battant */}
      <ellipse cx="30" cy="62" rx="8" ry="4" className="fill-primary" />
      {/* Anneau du haut */}
      <circle cx="30" cy="12" r="5" className="fill-primary" />
      {/* Notification dot */}
      <circle cx="45" cy="20" r="6" className="fill-destructive" />
    </svg>
  );
}

// Globe/En ligne
export function IsoGlobe({ className }: IsometricProps) {
  return (
    <svg
      viewBox="0 0 70 70"
      className={cn("w-14 h-14", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sphère */}
      <circle cx="35" cy="35" r="28" className="fill-secondary" />
      {/* Méridiens */}
      <ellipse cx="35" cy="35" rx="28" ry="12" className="fill-none stroke-primary/30" strokeWidth="2" />
      <ellipse cx="35" cy="35" rx="12" ry="28" className="fill-none stroke-primary/30" strokeWidth="2" />
      {/* Équateur */}
      <line x1="7" y1="35" x2="63" y2="35" className="stroke-primary/30" strokeWidth="2" />
      {/* Continents stylisés */}
      <path d="M25 20C30 18 38 22 35 28C32 32 22 30 25 20Z" className="fill-primary/50" />
      <path d="M40 35C48 33 52 40 48 45C44 50 38 48 40 35Z" className="fill-primary/40" />
      <path d="M20 40C25 42 28 48 24 50C20 52 15 45 20 40Z" className="fill-primary/30" />
      {/* Highlight */}
      <circle cx="25" cy="25" r="8" className="fill-card/30" />
    </svg>
  );
}

// Checkbox/Validation
export function IsoCheck({ className }: IsometricProps) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={cn("w-12 h-12", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fond */}
      <path d="M30 5L55 18L55 43L30 56L5 43L5 18L30 5Z" className="fill-primary/20" />
      {/* Face visible */}
      <path d="M30 10L50 21L50 40L30 51L10 40L10 21L30 10Z" className="fill-card" />
      {/* Check mark */}
      <path
        d="M20 30L27 37L42 22"
        className="stroke-primary"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Grille iso de fond (pattern subtil)
export function IsoGrid({ className }: IsometricProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("w-full h-full", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="isoGridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
          <path
            d="M0 15L15 7.5L30 15L15 22.5Z"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#isoGridPattern)" />
    </svg>
  );
}
