import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";

/**
 * POST /api/v1/upload
 * Upload une image et retourne son URL
 *
 * Accepte:
 * - multipart/form-data avec un champ "file"
 * - application/json avec { "url": "https://..." } pour télécharger depuis une URL externe
 * - application/json avec { "base64": "data:image/png;base64,..." } pour une image en base64
 */
export async function POST(request: NextRequest) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    let blob;

    if (contentType.includes("multipart/form-data")) {
      // Upload direct d'un fichier
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return errorResponse("No file provided", 400);
      }

      // Vérifier le type
      if (!file.type.startsWith("image/")) {
        return errorResponse("File must be an image", 400);
      }

      // Vérifier la taille (max 4MB)
      if (file.size > 4 * 1024 * 1024) {
        return errorResponse("File size must be less than 4MB", 400);
      }

      const filename = `events/${user.id}/${Date.now()}-${file.name}`;
      blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });
    } else if (contentType.includes("application/json")) {
      const body = await request.json();

      if (body.url) {
        // Télécharger depuis une URL externe
        const response = await fetch(body.url);
        if (!response.ok) {
          return errorResponse("Failed to fetch image from URL", 400);
        }

        const imageContentType = response.headers.get("content-type") || "";
        if (!imageContentType.startsWith("image/")) {
          return errorResponse("URL must point to an image", 400);
        }

        const imageBuffer = await response.arrayBuffer();
        const extension = imageContentType.split("/")[1]?.split(";")[0] || "jpg";
        const filename = `events/${user.id}/${Date.now()}.${extension}`;

        blob = await put(filename, imageBuffer, {
          access: "public",
          addRandomSuffix: false,
          contentType: imageContentType,
        });
      } else if (body.base64) {
        // Image en base64
        const matches = body.base64.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
          return errorResponse("Invalid base64 image format", 400);
        }

        const extension = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        // Vérifier la taille
        if (buffer.length > 4 * 1024 * 1024) {
          return errorResponse("Image size must be less than 4MB", 400);
        }

        const filename = `events/${user.id}/${Date.now()}.${extension}`;
        blob = await put(filename, buffer, {
          access: "public",
          addRandomSuffix: false,
          contentType: `image/${extension}`,
        });
      } else {
        return errorResponse("Provide 'file' (multipart), 'url', or 'base64'", 400);
      }
    } else {
      return errorResponse("Unsupported content type", 400);
    }

    return jsonResponse({
      data: {
        url: blob.url,
        pathname: blob.pathname,
      },
    }, 201);
  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Upload failed",
      500
    );
  }
}
