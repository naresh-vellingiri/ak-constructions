import {
  DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_PHOTO_SOURCE_BYTES,
  PHOTO_MAX_EDGE,
  PHOTO_TYPES,
  type DocumentCategory,
  type FileKind,
} from "@/config/files";
import type { ProjectFileSummary } from "@/types/file";

/**
 * Browser-side half of the file upload. The server half, and the reasoning for
 * the three steps, is in src/lib/project-files.ts.
 *
 * Imported only by client components. It must not import anything server-only.
 */

/** Thrown with a message that is safe to show the admin as-is. */
export class UploadError extends Error {}

/**
 * Shrinks a phone photo before upload.
 *
 * A phone photo is 3 to 8 MB; at 1600 px on the long edge it is a few hundred
 * KB, which is plenty for a progress gallery and keeps the free storage going
 * for hundreds of photos. Drawing through a canvas also applies the camera's
 * rotation and drops hidden metadata such as GPS position.
 */
export async function shrinkPhoto(file: File): Promise<Blob> {
  if (file.size > MAX_PHOTO_SOURCE_BYTES) {
    throw new UploadError(`${file.name} is too large to use.`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new UploadError(
      `${file.name} could not be read as a photo. Use a JPEG, PNG or WebP image.`
    );
  }

  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new UploadError("This browser cannot prepare photos.");

  // JPEG has no transparency; without a base a transparent PNG goes black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.82)
  );
  if (!blob) throw new UploadError(`${file.name} could not be prepared.`);
  return blob;
}

async function errorFrom(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === "string") return data.error;
  } catch {
    // Not JSON; use the fallback.
  }
  return fallback;
}

export type UploadOptions = {
  projectId: string;
  kind: FileKind;
  file: File;
  title?: string;
  category?: DocumentCategory;
  clientVisible: boolean;
};

/** Uploads one photo or document end to end and returns the saved record. */
export async function uploadProjectFile(
  options: UploadOptions
): Promise<ProjectFileSummary> {
  const { projectId, kind, file } = options;
  const base = `/api/admin/projects/${encodeURIComponent(projectId)}/files`;

  let body: Blob = file;
  let mimeType = file.type;

  if (kind === "photo") {
    body = await shrinkPhoto(file);
    mimeType = "image/jpeg";
  } else {
    if (!DOCUMENT_TYPES[mimeType]) {
      throw new UploadError(`${file.name}: documents must be a PDF or an image.`);
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new UploadError(
        `${file.name} is larger than ${Math.round(MAX_DOCUMENT_BYTES / 1048576)} MB.`
      );
    }
  }
  if (kind === "photo" && !PHOTO_TYPES[mimeType]) {
    throw new UploadError(`${file.name} is not a supported photo.`);
  }

  // 1. Ask for permission and a one-time address.
  const slotResponse = await fetch(`${base}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, mimeType, sizeBytes: body.size }),
  });
  if (!slotResponse.ok) {
    throw new UploadError(await errorFrom(slotResponse, "Could not start the upload."));
  }
  const slot = (await slotResponse.json()) as { signedUrl: string; path: string };

  // 2. Send the bytes straight to storage. The part's type must be set so the
  //    bucket can check it against its allowed list.
  const form = new FormData();
  form.append("cacheControl", "3600");
  form.append("", new Blob([body], { type: mimeType }));
  const sent = await fetch(slot.signedUrl, {
    method: "PUT",
    headers: { "x-upsert": "false" },
    body: form,
  });
  if (!sent.ok) {
    throw new UploadError(`${file.name} could not be uploaded. Please try again.`);
  }

  // 3. Tell the server it arrived.
  const savedResponse = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: slot.path,
      kind,
      category: options.category,
      title: options.title,
      clientVisible: options.clientVisible,
    }),
  });
  if (!savedResponse.ok) {
    throw new UploadError(await errorFrom(savedResponse, "The file could not be saved."));
  }
  const data = (await savedResponse.json()) as { file: ProjectFileSummary };
  return data.file;
}
