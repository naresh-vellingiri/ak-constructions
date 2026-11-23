"use client";

import { useRef, useState } from "react";
import { CAPTION_MAX, CATEGORY_SUBTITLE_MAX, CATEGORY_TITLE_MAX } from "@/config/portfolio";
import { UploadError, uploadPortfolioPhoto } from "@/lib/upload-client";
import type { AdminPortfolioCategory } from "@/types/portfolio";

type Props = {
  category: AdminPortfolioCategory;
  position: number;
  total: number;
  /** Re-fetch the list after anything changes. */
  onChanged: () => Promise<void>;
  onMove: (direction: -1 | 1) => void;
};

const field =
  "w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

/** One homepage category in the admin: rename, reorder, delete, and manage its photos. */
export default function PortfolioAdminCard({ category, position, total, onChanged, onMove }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(category.title);
  const [subtitle, setSubtitle] = useState(category.subtitle);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const api = `/api/admin/portfolio/${encodeURIComponent(category.id)}`;

  const call = async (url: string, init: RequestInit): Promise<boolean> => {
    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setErrors([typeof data.error === "string" ? data.error : "Something went wrong."]);
        return false;
      }
      return true;
    } catch {
      setErrors(["Could not reach the server."]);
      return false;
    }
  };

  const saveDetails = async () => {
    setErrors([]);
    const ok = await call(api, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subtitle }),
    });
    if (ok) {
      setEditing(false);
      await onChanged();
    }
  };

  const remove = async () => {
    const photos = category.photos.length;
    const message =
      photos > 0
        ? `Delete "${category.title}" and its ${photos} photo(s)? This cannot be undone.`
        : `Delete "${category.title}"? This cannot be undone.`;
    if (!window.confirm(message)) return;
    setErrors([]);
    if (await call(api, { method: "DELETE" })) await onChanged();
  };

  const setCover = async (photoId: string | null) => {
    setErrors([]);
    const ok = await call(api, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverPhotoId: photoId }),
    });
    if (ok) await onChanged();
  };

  const removePhoto = async (photoId: string) => {
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    setErrors([]);
    if (await call(`${api}/photos/${encodeURIComponent(photoId)}`, { method: "DELETE" })) {
      await onChanged();
    }
  };

  const upload = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    const list = Array.from(selected);

    setBusy(true);
    setErrors([]);
    const problems: string[] = [];

    for (let index = 0; index < list.length; index += 1) {
      setStatus(`Uploading ${index + 1} of ${list.length}...`);
      try {
        await uploadPortfolioPhoto(category.id, list[index], caption);
      } catch (error) {
        problems.push(
          error instanceof UploadError ? error.message : `${list[index].name} could not be uploaded.`
        );
      }
    }

    setErrors(problems);
    setStatus(problems.length < list.length ? `${list.length - problems.length} photo(s) added.` : "");
    if (problems.length < list.length) setCaption("");
    setBusy(false);
    if (input.current) input.current.value = "";
    await onChanged();
  };

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        {editing ? (
          <div className="flex-1 space-y-2">
            <input
              value={title}
              maxLength={CATEGORY_TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
              aria-label="Category name"
              className={field}
            />
            <input
              value={subtitle}
              maxLength={CATEGORY_SUBTITLE_MAX}
              onChange={(event) => setSubtitle(event.target.value)}
              aria-label="Short description"
              placeholder="Short description (shown under the name)"
              className={field}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveDetails}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle(category.title);
                  setSubtitle(category.subtitle);
                  setEditing(false);
                }}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-stone-900">{category.title}</h2>
            <p className="truncate text-sm text-stone-500">{category.subtitle || "No description"}</p>
            <p className="mt-0.5 text-xs text-stone-400">
              {category.photos.length} photo{category.photos.length === 1 ? "" : "s"} added
              {category.hasStaticCover && " + the original picture"}
            </p>
          </div>
        )}

        {!editing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={position === 0}
              aria-label={`Move ${category.title} earlier`}
              className="h-8 w-8 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={position === total - 1}
              aria-label={`Move ${category.title} later`}
              className="h-8 w-8 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="ml-1 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={remove}
              aria-label={`Delete ${category.title}`}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {category.photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {category.photos.map((photo) => {
            const isCover = photo.id === category.coverPhotoId;
            return (
              <li key={photo.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.caption || `${category.title} photo`}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg bg-stone-100 object-cover"
                />
                <button
                  type="button"
                  aria-label="Delete photo"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900/75 text-sm leading-none text-white hover:bg-red-600"
                >
                  ×
                </button>
                <button
                  type="button"
                  onClick={() => setCover(isCover ? null : photo.id)}
                  aria-pressed={isCover}
                  className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    isCover ? "bg-orange-500 text-white" : "bg-stone-900/70 text-white hover:bg-orange-500"
                  }`}
                >
                  {isCover ? "★ Cover" : "Make cover"}
                </button>
                {photo.caption && (
                  <p className="mt-1 truncate text-[11px] text-stone-500">{photo.caption}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 space-y-2">
        <input
          type="text"
          placeholder="Caption (optional)"
          maxLength={CAPTION_MAX}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          className={field}
        />
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => upload(event.target.files)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="w-full rounded-xl border border-orange-500 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? status : `+ Add photos to ${category.title}`}
        </button>
        {!busy && status && <p className="text-sm text-green-700">{status}</p>}
        {errors.map((message) => (
          <p key={message} className="text-sm text-red-600">
            {message}
          </p>
        ))}
      </div>
    </article>
  );
}
