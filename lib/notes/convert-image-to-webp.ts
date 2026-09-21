const WEBP_MIME = "image/webp";
const DEFAULT_QUALITY = 0.82;
const MAX_EDGE_PX = 1920;

function replaceExtensionWithWebp(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  return `${base.length > 0 ? base : "image"}.webp`;
}

function scaleSize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height };
  }
  const ratio = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/**
 * Convertit une image navigateur en WebP (resize max edge) pour limiter le poids.
 */
export async function convertImageFileToWebp(
  file: File,
  options?: { quality?: number; maxEdgePx?: number },
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File is not an image");
  }

  const quality = options?.quality ?? DEFAULT_QUALITY;
  const maxEdgePx = options?.maxEdgePx ?? MAX_EDGE_PX;
  const bitmap = await createImageBitmap(file);
  const { width, height } = scaleSize(bitmap.width, bitmap.height, maxEdgePx);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas unavailable");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
          return;
        }
        reject(new Error("WebP conversion failed"));
      },
      WEBP_MIME,
      quality,
    );
  });

  return new File([blob], replaceExtensionWithWebp(file.name), {
    type: WEBP_MIME,
    lastModified: Date.now(),
  });
}
