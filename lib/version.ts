// Version de l'application
// BUILD_ID est généré au build par Next.js / Vercel

export const APP_VERSION = process.env.npm_package_version || "0.1.0";

// Hash du commit (disponible sur Vercel)
export const BUILD_HASH = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";

// Date du build
export const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().split("T")[0];

// Version complète pour affichage
export function getVersionString(): string {
  return `v${APP_VERSION}-${BUILD_HASH}`;
}
