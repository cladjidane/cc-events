import { APP_VERSION, BUILD_HASH, getVersionString } from "@/lib/version";

/**
 * GET /api/version
 * Retourne la version de l'application
 */
export async function GET() {
  return Response.json({
    version: APP_VERSION,
    build: BUILD_HASH,
    full: getVersionString(),
    timestamp: new Date().toISOString(),
  });
}
