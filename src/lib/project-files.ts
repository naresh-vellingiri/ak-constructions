import "server-only";
import { randomUUID } from "node:crypto";
import {
  DOCUMENT_TYPES,
  FILES_BUCKET,
  FILES_TABLE,
  MAX_DOCUMENT_BYTES,
  MAX_PHOTO_BYTES,
  PHOTO_TYPES,
  TITLE_MAX_LENGTH,
  isDocumentCategory,
  type DocumentCategory,
  type FileKind,
} from "@/config/files";
import { getProject } from "@/lib/projects";
import { getSupabase } from "@/lib/supabase";
import type { ProjectFileRecord, ProjectFileSummary } from "@/types/file";

/**
 * Everything that touches project photos and documents: the project_files
 * table and the private "project-files" storage bucket.
 *
 * How an upload works, and why:
 *  1. The browser asks createUploadSlot() for permission. The server checks the
 *     admin, the file type and size, and that the project exists, then invents
 *     the storage path itself. The browser never chooses where a file goes.
 *  2. The browser sends the bytes straight to Supabase Storage using the signed
 *     address it was given. They do not pass through this app, so a large PDF is
 *     not stopped by the host's 4.5 MB request limit.
 *  3. The browser calls registerFile(). The server asks Storage what actually
 *     arrived (size and type) and records THAT, not what the browser claims.
 *
 * Nothing here ever returns a permanent address. Pictures and downloads are
 * opened through /api/files/<id>, which checks who is asking and then issues a
 * link that expires in an hour.
 *
 * Errors follow src/lib/projects.ts: supabase-js returns { error } instead of
 * throwing, so every call is checked. FileInputError is the one that means "the
 * request was wrong" (a 400), anything else is the service failing (a 503).
 */

export class FileInputError extends Error {}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID_RE = new RegExp(`^${UUID}$`, "i");
/** `<projectId>/<fileId>.<ext>`, the only shape this module ever writes. */
const PATH_RE = new RegExp(`^(${UUID})/(${UUID})\\.(jpg|png|webp|pdf)$`, "i");

/** How long a link from /api/files/<id> stays valid. */
const VIEW_LINK_SECONDS = 60 * 60;

const COLUMNS =
  'id, "projectId", kind, category, title, "storagePath", "mimeType", "sizeBytes", "clientVisible", "createdAt"';

function storage() {
  return getSupabase().storage.from(FILES_BUCKET);
}

function allowedTypes(kind: FileKind): Record<string, string> {
  return kind === "photo" ? PHOTO_TYPES : DOCUMENT_TYPES;
}

function maxBytes(kind: FileKind): number {
  return kind === "photo" ? MAX_PHOTO_BYTES : MAX_DOCUMENT_BYTES;
}

export function isFileKind(value: unknown): value is FileKind {
  return value === "photo" || value === "document";
}

/** Throws FileInputError unless this type and size are acceptable for the kind. */
function assertAllowed(kind: FileKind, mimeType: string, sizeBytes: number) {
  if (!allowedTypes(kind)[mimeType]) {
    throw new FileInputError(
      kind === "photo"
        ? "Photos must be JPEG, PNG or WebP."
        : "Documents must be a PDF, JPEG, PNG or WebP."
    );
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new FileInputError("The file is empty.");
  }
  if (sizeBytes > maxBytes(kind)) {
    const mb = Math.round(maxBytes(kind) / (1024 * 1024));
    throw new FileInputError(`That file is too large. The limit is ${mb} MB.`);
  }
}

export type UploadSlot = { signedUrl: string; path: string };

/** Step 1: permission to upload one file. */
export async function createUploadSlot(
  projectId: string,
  kind: FileKind,
  mimeType: string,
  sizeBytes: number
): Promise<UploadSlot> {
  assertAllowed(kind, mimeType, sizeBytes);

  const project = await getProject(projectId);
  if (!project) throw new FileInputError("Project not found.");

  const path = `${project.id}/${randomUUID()}.${allowedTypes(kind)[mimeType]}`;
  const { data, error } = await storage().createSignedUploadUrl(path);
  if (error || !data) {
    throw new Error(`createUploadSlot failed: ${error?.message ?? "no data"}`);
  }

  return { signedUrl: data.signedUrl, path };
}

export type RegisterInput = {
  path: string;
  kind: FileKind;
  category?: unknown;
  title?: unknown;
  clientVisible?: unknown;
};

/** Step 3: record a file that has finished uploading. */
export async function registerFile(
  projectId: string,
  input: RegisterInput
): Promise<ProjectFileRecord> {
  const match = PATH_RE.exec(input.path);
  // The path must be one this module issued, for THIS project. Anything else
  // would let a request attach someone else's file to this project.
  if (!match || match[1].toLowerCase() !== projectId.toLowerCase()) {
    throw new FileInputError("Invalid file reference.");
  }

  let category: DocumentCategory | null = null;
  if (input.kind === "document") {
    category = isDocumentCategory(input.category) ? input.category : "other";
  }

  const title =
    typeof input.title === "string"
      ? input.title.trim().slice(0, TITLE_MAX_LENGTH) || null
      : null;

  // Trust Storage, not the browser, for what was actually uploaded.
  const { data: info, error: infoError } = await storage().info(input.path);
  if (infoError || !info) {
    throw new FileInputError("The upload did not finish. Please try again.");
  }
  const mimeType = info.contentType ?? "";
  const sizeBytes = Number(info.size ?? 0);

  try {
    assertAllowed(input.kind, mimeType, sizeBytes);
  } catch (error) {
    // Don't leave a rejected file sitting in the bucket.
    await storage().remove([input.path]);
    throw error;
  }

  const row = {
    id: match[2].toLowerCase(),
    projectId,
    kind: input.kind,
    category,
    title,
    storagePath: input.path,
    mimeType,
    sizeBytes,
    clientVisible: input.clientVisible === false ? false : true,
  };

  const { data, error } = await getSupabase()
    .from(FILES_TABLE)
    .insert(row)
    .select(COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`registerFile failed: ${error?.message ?? "no data"}`);
  }
  return data as ProjectFileRecord;
}

/**
 * Files of one project, newest first. `forClient` hides the ones the admin
 * marked private.
 */
export async function listProjectFiles(
  projectId: string,
  options: { forClient?: boolean } = {}
): Promise<ProjectFileRecord[]> {
  let query = getSupabase()
    .from(FILES_TABLE)
    .select(COLUMNS)
    .eq("projectId", projectId)
    .order("createdAt", { ascending: false });

  if (options.forClient) query = query.eq("clientVisible", true);

  const { data, error } = await query;
  if (error) throw new Error(`listProjectFiles failed: ${error.message}`);
  return (data ?? []) as ProjectFileRecord[];
}

export async function getFileRecord(
  fileId: string
): Promise<ProjectFileRecord | null> {
  if (!UUID_RE.test(fileId)) return null;

  const { data, error } = await getSupabase()
    .from(FILES_TABLE)
    .select(COLUMNS)
    .eq("id", fileId)
    .maybeSingle();

  if (error) throw new Error(`getFileRecord failed: ${error.message}`);
  return (data as ProjectFileRecord | null) ?? null;
}

/** Removes the stored object first, then the row, so a failure leaves a retryable row. */
export async function deleteProjectFile(
  projectId: string,
  fileId: string
): Promise<boolean> {
  const record = await getFileRecord(fileId);
  if (!record || record.projectId !== projectId) return false;

  const { error: removeError } = await storage().remove([record.storagePath]);
  if (removeError) {
    throw new Error(`deleteProjectFile (storage) failed: ${removeError.message}`);
  }

  const { error } = await getSupabase().from(FILES_TABLE).delete().eq("id", fileId);
  if (error) throw new Error(`deleteProjectFile (row) failed: ${error.message}`);
  return true;
}

/** A link that opens the file for the next hour. Only call after an access check. */
export async function createViewUrl(storagePath: string): Promise<string> {
  const { data, error } = await storage().createSignedUrl(
    storagePath,
    VIEW_LINK_SECONDS
  );
  if (error || !data) {
    throw new Error(`createViewUrl failed: ${error?.message ?? "no data"}`);
  }
  return data.signedUrl;
}

/** The fields safe to send to a browser: no storage path, no project id. */
export function toSummary(record: ProjectFileRecord): ProjectFileSummary {
  return {
    id: record.id,
    kind: record.kind,
    category: record.category,
    title: record.title,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    createdAt: record.createdAt,
    clientVisible: record.clientVisible,
  };
}
