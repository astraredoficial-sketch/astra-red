import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { authenticateProfilePhotoRequest } from "@/lib/profilePhotosServer";

const MAX_UPLOAD_BYTES = 4_400_000;
const MAX_STORED_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_IMAGE_DIMENSION = 2048;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
type ImageMetadata = Awaited<
  ReturnType<ReturnType<typeof sharp>["metadata"]>
>;

async function readBoundedBody(request: Request): Promise<Buffer | null> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    return null;
  }

  const reader = request.body?.getReader();
  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_UPLOAD_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  return totalBytes > 0 ? Buffer.concat(chunks, totalBytes) : null;
}

export async function POST(request: Request) {
  try {
    const authenticated = await authenticateProfilePhotoRequest(
      request.headers.get("authorization"),
    );
    if (!authenticated) {
      return Response.json(
        { error: "Inicia sesión para subir una foto." },
        { status: 401 },
      );
    }

    const contentType = request.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();
    if (!contentType || !ALLOWED_TYPES.has(contentType)) {
      return Response.json(
        { error: "Elige una imagen JPG, PNG o WebP." },
        { status: 415 },
      );
    }

    const input = await readBoundedBody(request);
    if (!input) {
      return Response.json(
        { error: "La foto debe pesar menos de 4 MB." },
        { status: 413 },
      );
    }

    let metadata: ImageMetadata;
    try {
      metadata = await sharp(input, {
        failOn: "error",
        limitInputPixels: MAX_IMAGE_PIXELS,
      }).metadata();
    } catch {
      return Response.json(
        { error: "El archivo no contiene una imagen válida." },
        { status: 400 },
      );
    }

    if (
      !metadata.format ||
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS ||
      (metadata.pages ?? 1) > 1
    ) {
      return Response.json(
        { error: "La imagen no es compatible o tiene demasiada resolución." },
        { status: 400 },
      );
    }

    const expectedFormat: Record<string, string> = {
      "image/jpeg": "jpeg",
      "image/png": "png",
      "image/webp": "webp",
    };
    if (expectedFormat[contentType] !== metadata.format) {
      return Response.json(
        { error: "El contenido de la imagen no coincide con su formato." },
        { status: 400 },
      );
    }

    let sanitized: Buffer;
    try {
      sanitized = await sharp(input, {
        failOn: "error",
        limitInputPixels: MAX_IMAGE_PIXELS,
      })
        .rotate()
        .resize({
          width: MAX_IMAGE_DIMENSION,
          height: MAX_IMAGE_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
    } catch {
      return Response.json(
        { error: "No se pudo procesar la imagen. Prueba con otra foto." },
        { status: 400 },
      );
    }

    if (sanitized.byteLength > MAX_STORED_BYTES) {
      return Response.json(
        { error: "La foto procesada supera el límite de almacenamiento." },
        { status: 413 },
      );
    }

    const path = `${authenticated.user.id}/${randomUUID()}.webp`;
    const { error: uploadError } = await authenticated.admin.storage
      .from("profile-photos")
      .upload(path, sanitized, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("No se pudo guardar la foto de perfil:", uploadError);
      return Response.json(
        { error: "No se pudo guardar la foto. Inténtalo de nuevo." },
        { status: 500 },
      );
    }

    return Response.json({ path });
  } catch (error) {
    console.error("Falló la subida segura de una foto de perfil:", error);
    return Response.json(
      { error: "El servidor no pudo procesar la foto de perfil." },
      { status: 500 },
    );
  }
}
