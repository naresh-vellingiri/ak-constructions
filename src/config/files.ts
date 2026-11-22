/**
 * Rules for the files an admin attaches to a project: site photos and
 * documents (FMB sketch, sketch map, patta, approved plan...).
 *
 * Shared by the browser (to validate before uploading and to resize photos) and
 * the server (the authoritative check). Keep this file free of server-only
 * imports so both can use it.
 */

export const FILES_BUCKET = "project-files";
export const FILES_TABLE = "project_files";

/** Largest document (PDF or scanned image) accepted. Matches the bucket limit in docs/sql/project-files.sql. */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
/** Largest photo accepted AFTER the browser has shrunk it. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
/** Largest original photo we will try to shrink; a phone photo is usually 2-8 MB. */
export const MAX_PHOTO_SOURCE_BYTES = 40 * 1024 * 1024;
/** Longest edge of a stored photo, in pixels. */
export const PHOTO_MAX_EDGE = 1600;

export type FileKind = "photo" | "document";

/** Allowed content types and the extension each is stored with. */
export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  ...PHOTO_TYPES,
};

export const DOCUMENT_CATEGORIES = [
  { value: "fmb", label: "FMB sketch" },
  { value: "sketch", label: "Sketch / site map" },
  { value: "patta", label: "Patta / Chitta" },
  { value: "plan", label: "Approved plan" },
  { value: "agreement", label: "Agreement" },
  { value: "other", label: "Other" },
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]["value"];

export function isDocumentCategory(value: unknown): value is DocumentCategory {
  return DOCUMENT_CATEGORIES.some((category) => category.value === value);
}

export function categoryLabel(value: string | null | undefined): string {
  return DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ?? "Document";
}

export const TITLE_MAX_LENGTH = 80;
