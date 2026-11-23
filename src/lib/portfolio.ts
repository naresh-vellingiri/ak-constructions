import "server-only";
import { randomUUID } from "node:crypto";
import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/config/files";
import {
  CAPTION_MAX,
  CATEGORY_SUBTITLE_MAX,
  CATEGORY_TITLE_MAX,
  PORTFOLIO_BUCKET,
  PORTFOLIO_CATEGORIES_TABLE,
  PORTFOLIO_PHOTOS_TABLE,
} from "@/config/portfolio";
import { getSupabase } from "@/lib/supabase";
import type {
  AdminPortfolioCategory,
  PortfolioCategory,
  PortfolioCategoryRecord,
  PortfolioImage,
  PortfolioPhotoRecord,
} from "@/types/portfolio";

/**
 * The homepage portfolio: categories, each with any number of photos.
 *
 * Conventions match projects.ts / project-files.ts (quoted camelCase columns;
 * supabase-js returns { error } instead of throwing, so every call is checked
 * and thrown; a database outage must never read as "no categories").
 *
 * Uploads use the same three-step flow as project files (server issues a
 * one-time address and invents the path; the browser sends the bytes straight
 * to Storage; the server then asks Storage what really arrived). The one
 * difference is the bucket: it is PUBLIC, because these are marketing photos,
 * so pages use ordinary CDN addresses instead of the checked redirect that
 * project documents need.
 */

/** Raised for "the request was wrong" (a 400); anything else is a service failure (503). */
export class PortfolioInputError extends Error {}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID_RE = new RegExp(`^${UUID}$`, "i");
const PATH_RE = new RegExp(`^(${UUID})/(${UUID})\\.(jpg|png|webp)$`, "i");

const CATEGORY_COLUMNS =
  'id, title, subtitle, "coverImage", "coverAlt", "coverPhotoId", "sortOrder", "createdAt"';
const PHOTO_COLUMNS = 'id, "categoryId", "storagePath", caption, "mimeType", "sizeBytes", "createdAt"';

function storage() {
  return getSupabase().storage.from(PORTFOLIO_BUCKET);
}

function publicUrl(storagePath: string): string {
  return storage().getPublicUrl(storagePath).data.publicUrl;
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function fetchAll(): Promise<{
  categories: PortfolioCategoryRecord[];
  photos: PortfolioPhotoRecord[];
}> {
  const [categories, photos] = await Promise.all([
    getSupabase()
      .from(PORTFOLIO_CATEGORIES_TABLE)
      .select(CATEGORY_COLUMNS)
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: true }),
    getSupabase()
      .from(PORTFOLIO_PHOTOS_TABLE)
      .select(PHOTO_COLUMNS)
      .order("createdAt", { ascending: true }),
  ]);

  if (categories.error) {
    throw new Error(`portfolio categories failed: ${categories.error.message}`);
  }
  if (photos.error) throw new Error(`portfolio photos failed: ${photos.error.message}`);

  return {
    categories: (categories.data ?? []) as PortfolioCategoryRecord[],
    photos: (photos.data ?? []) as PortfolioPhotoRecord[],
  };
}

function groupPhotos(photos: PortfolioPhotoRecord[]) {
  const byCategory = new Map<string, PortfolioPhotoRecord[]>();
  for (const photo of photos) {
    const list = byCategory.get(photo.categoryId) ?? [];
    list.push(photo);
    byCategory.set(photo.categoryId, list);
  }
  return byCategory;
}

/**
 * Public view for the homepage. The cover is, in order: the photo the admin
 * picked, the picture the original tile shipped with, the first photo.
 */
export async function listPortfolio(): Promise<PortfolioCategory[]> {
  const { categories, photos } = await fetchAll();
  const byCategory = groupPhotos(photos);

  return categories.map((category) => {
    const own = byCategory.get(category.id) ?? [];
    const images: PortfolioImage[] = own.map((photo) => ({
      id: photo.id,
      src: publicUrl(photo.storagePath),
      caption: photo.caption,
    }));

    // The original tile picture is part of the category's set, shown first.
    if (category.coverImage) {
      images.unshift({
        id: `static-${category.id}`,
        src: category.coverImage,
        caption: null,
      });
    }

    const picked = own.find((photo) => photo.id === category.coverPhotoId);
    const coverSrc = picked
      ? publicUrl(picked.storagePath)
      : category.coverImage ?? images[0]?.src ?? null;

    return {
      id: category.id,
      title: category.title,
      subtitle: category.subtitle,
      cover: coverSrc
        ? { src: coverSrc, alt: category.coverAlt || `${category.title} by AK Construction and Interiors` }
        : null,
      images,
    };
  });
}

/** Admin view: the same data, shaped for editing. */
export async function listPortfolioForAdmin(): Promise<AdminPortfolioCategory[]> {
  const { categories, photos } = await fetchAll();
  const byCategory = groupPhotos(photos);

  return categories.map((category) => ({
    id: category.id,
    title: category.title,
    subtitle: category.subtitle,
    coverPhotoId: category.coverPhotoId,
    hasStaticCover: Boolean(category.coverImage),
    photos: (byCategory.get(category.id) ?? []).map((photo) => ({
      id: photo.id,
      src: publicUrl(photo.storagePath),
      caption: photo.caption,
    })),
  }));
}

async function categoryExists(id: string): Promise<boolean> {
  if (!UUID_RE.test(id)) return false;
  const { data, error } = await getSupabase()
    .from(PORTFOLIO_CATEGORIES_TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`categoryExists failed: ${error.message}`);
  return Boolean(data);
}

export async function createCategory(input: {
  title: unknown;
  subtitle: unknown;
}): Promise<void> {
  const title = clean(input.title, CATEGORY_TITLE_MAX);
  if (!title) throw new PortfolioInputError("Give the category a name, e.g. Modular Kitchen.");

  // New categories go to the end.
  const { data: last, error: lastError } = await getSupabase()
    .from(PORTFOLIO_CATEGORIES_TABLE)
    .select('"sortOrder"')
    .order("sortOrder", { ascending: false })
    .limit(1);
  if (lastError) throw new Error(`createCategory failed: ${lastError.message}`);
  const next = ((last?.[0] as { sortOrder?: number } | undefined)?.sortOrder ?? -1) + 1;

  const { error } = await getSupabase()
    .from(PORTFOLIO_CATEGORIES_TABLE)
    .insert({ title, subtitle: clean(input.subtitle, CATEGORY_SUBTITLE_MAX), sortOrder: next });
  if (error) throw new Error(`createCategory failed: ${error.message}`);
}

/** Only the fields present in `patch` change. Returns false if the category is gone. */
export async function updateCategory(
  id: string,
  patch: { title?: unknown; subtitle?: unknown; coverPhotoId?: unknown }
): Promise<boolean> {
  if (!UUID_RE.test(id)) return false;

  const changes: Record<string, unknown> = {};

  if (patch.title !== undefined) {
    const title = clean(patch.title, CATEGORY_TITLE_MAX);
    if (!title) throw new PortfolioInputError("The name cannot be empty.");
    changes.title = title;
  }
  if (patch.subtitle !== undefined) {
    changes.subtitle = clean(patch.subtitle, CATEGORY_SUBTITLE_MAX);
  }
  if (patch.coverPhotoId !== undefined) {
    if (patch.coverPhotoId === null) {
      changes.coverPhotoId = null;
    } else if (typeof patch.coverPhotoId === "string" && UUID_RE.test(patch.coverPhotoId)) {
      // The cover must be one of THIS category's own photos.
      const { data, error } = await getSupabase()
        .from(PORTFOLIO_PHOTOS_TABLE)
        .select("id")
        .eq("id", patch.coverPhotoId)
        .eq("categoryId", id)
        .maybeSingle();
      if (error) throw new Error(`updateCategory failed: ${error.message}`);
      if (!data) throw new PortfolioInputError("That photo is not in this category.");
      changes.coverPhotoId = patch.coverPhotoId;
    } else {
      throw new PortfolioInputError("Invalid cover photo.");
    }
  }

  if (Object.keys(changes).length === 0) return categoryExists(id);

  const { data, error } = await getSupabase()
    .from(PORTFOLIO_CATEGORIES_TABLE)
    .update(changes)
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`updateCategory failed: ${error.message}`);
  return Boolean(data);
}

/** Sets the display order to the order of `ids`. Unknown ids are ignored. */
export async function reorderCategories(ids: unknown): Promise<void> {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !UUID_RE.test(id))) {
    throw new PortfolioInputError("Invalid order.");
  }
  const ordered = ids as string[];

  for (let index = 0; index < ordered.length; index += 1) {
    const { error } = await getSupabase()
      .from(PORTFOLIO_CATEGORIES_TABLE)
      .update({ sortOrder: index })
      .eq("id", ordered[index]);
    if (error) throw new Error(`reorderCategories failed: ${error.message}`);
  }
}

/** Deletes a category and its photos (stored files first, so nothing is orphaned). */
export async function deleteCategory(id: string): Promise<boolean> {
  if (!(await categoryExists(id))) return false;

  const { data: photos, error: listError } = await getSupabase()
    .from(PORTFOLIO_PHOTOS_TABLE)
    .select('"storagePath"')
    .eq("categoryId", id);
  if (listError) throw new Error(`deleteCategory failed: ${listError.message}`);

  const paths = (photos ?? []).map((row) => (row as { storagePath: string }).storagePath);
  if (paths.length > 0) {
    const { error: removeError } = await storage().remove(paths);
    if (removeError) throw new Error(`deleteCategory (storage) failed: ${removeError.message}`);
  }

  const { error } = await getSupabase()
    .from(PORTFOLIO_CATEGORIES_TABLE)
    .delete()
    .eq("id", id);
  if (error) throw new Error(`deleteCategory failed: ${error.message}`);
  return true;
}

function assertPhoto(mimeType: string, sizeBytes: number) {
  if (!PHOTO_TYPES[mimeType]) {
    throw new PortfolioInputError("Photos must be JPEG, PNG or WebP.");
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new PortfolioInputError("The file is empty.");
  }
  if (sizeBytes > MAX_PHOTO_BYTES) {
    throw new PortfolioInputError(
      `That photo is too large. The limit is ${Math.round(MAX_PHOTO_BYTES / 1048576)} MB.`
    );
  }
}

/** Step 1: permission to upload one photo into a category. */
export async function createPhotoUploadSlot(
  categoryId: string,
  mimeType: string,
  sizeBytes: number
): Promise<{ signedUrl: string; path: string }> {
  assertPhoto(mimeType, sizeBytes);
  if (!(await categoryExists(categoryId))) throw new PortfolioInputError("Category not found.");

  const path = `${categoryId}/${randomUUID()}.${PHOTO_TYPES[mimeType]}`;
  const { data, error } = await storage().createSignedUploadUrl(path);
  if (error || !data) {
    throw new Error(`createPhotoUploadSlot failed: ${error?.message ?? "no data"}`);
  }
  return { signedUrl: data.signedUrl, path };
}

/** Step 3: record a photo that has finished uploading. */
export async function registerPhoto(
  categoryId: string,
  input: { path: string; caption?: unknown }
): Promise<void> {
  const match = PATH_RE.exec(input.path);
  if (!match || match[1].toLowerCase() !== categoryId.toLowerCase()) {
    throw new PortfolioInputError("Invalid file reference.");
  }

  // Trust Storage, not the browser, for what actually arrived.
  const { data: info, error: infoError } = await storage().info(input.path);
  if (infoError || !info) {
    throw new PortfolioInputError("The upload did not finish. Please try again.");
  }
  const mimeType = info.contentType ?? "";
  const sizeBytes = Number(info.size ?? 0);

  try {
    assertPhoto(mimeType, sizeBytes);
  } catch (error) {
    await storage().remove([input.path]);
    throw error;
  }

  const { error } = await getSupabase()
    .from(PORTFOLIO_PHOTOS_TABLE)
    .insert({
      id: match[2].toLowerCase(),
      categoryId,
      storagePath: input.path,
      caption: clean(input.caption, CAPTION_MAX) || null,
      mimeType,
      sizeBytes,
    });
  if (error) throw new Error(`registerPhoto failed: ${error.message}`);
}

export async function deletePhoto(categoryId: string, photoId: string): Promise<boolean> {
  if (!UUID_RE.test(photoId) || !UUID_RE.test(categoryId)) return false;

  const { data, error } = await getSupabase()
    .from(PORTFOLIO_PHOTOS_TABLE)
    .select('id, "storagePath"')
    .eq("id", photoId)
    .eq("categoryId", categoryId)
    .maybeSingle();
  if (error) throw new Error(`deletePhoto failed: ${error.message}`);
  if (!data) return false;

  const { error: removeError } = await storage().remove([
    (data as { storagePath: string }).storagePath,
  ]);
  if (removeError) throw new Error(`deletePhoto (storage) failed: ${removeError.message}`);

  const { error: rowError } = await getSupabase()
    .from(PORTFOLIO_PHOTOS_TABLE)
    .delete()
    .eq("id", photoId);
  if (rowError) throw new Error(`deletePhoto (row) failed: ${rowError.message}`);
  return true;
}
