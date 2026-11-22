"use client";

import { useEffect, useState } from "react";
import { categoryLabel } from "@/config/files";
import type { ProjectFileSummary } from "@/types/file";

type Props = { files: ProjectFileSummary[] };

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

const fileUrl = (id: string) => `/api/files/${encodeURIComponent(id)}`;

/**
 * The client's view of their project's site photos and documents.
 *
 * A client component only for the full-screen photo viewer. The addresses are
 * /api/files/<id>, which re-check on every request that this file belongs to
 * the signed-in client's own project.
 */
export default function ClientFiles({ files }: Props) {
  const photos = files.filter((file) => file.kind === "photo");
  const documents = files.filter((file) => file.kind === "document");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      else if (event.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % photos.length));
      else if (event.key === "ArrowLeft") {
        setOpen((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, photos.length]);

  if (photos.length === 0 && documents.length === 0) return null;

  const current = open === null ? null : photos[open];

  return (
    <>
      {photos.length > 0 && (
        <div className="mt-6 border-t border-stone-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
            Site Photos
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Latest pictures from your site. Tap one to enlarge.
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <li key={photo.id}>
                <button
                  type="button"
                  onClick={() => setOpen(index)}
                  className="block w-full overflow-hidden rounded-lg bg-stone-100"
                  aria-label={`Open photo: ${photo.title || formatDate(photo.createdAt)}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl(photo.id)}
                    alt={photo.title || "Site photo"}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                </button>
                <p className="mt-1 truncate text-[11px] text-stone-500">
                  {formatDate(photo.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-6 border-t border-stone-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
            Documents
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Your plans and site papers, kept in one place.
          </p>
          <ul className="mt-3 space-y-2">
            {documents.map((doc) => (
              <li key={doc.id}>
                <a
                  href={fileUrl(doc.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 hover:border-orange-300 hover:bg-orange-50"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[10px] font-bold text-orange-700"
                  >
                    {doc.mimeType === "application/pdf" ? "PDF" : "IMG"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-stone-900">
                      {doc.title || categoryLabel(doc.category)}
                    </span>
                    <span className="block text-xs text-stone-400">
                      {categoryLabel(doc.category)} · {formatSize(doc.sizeBytes)} ·{" "}
                      {formatDate(doc.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-orange-600">Open</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Site photo"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close photo"
            onClick={() => setOpen(null)}
          />
          <figure className="relative max-h-full max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl(current.id)}
              alt={current.title || "Site photo"}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white">
              {current.title && <span className="font-medium">{current.title} · </span>}
              <span className="text-stone-300">{formatDate(current.createdAt)}</span>
              <span className="ml-2 text-stone-400">
                {(open ?? 0) + 1} / {photos.length}
              </span>
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
          >
            ×
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setOpen((i) => ((i ?? 0) - 1 + photos.length) % photos.length)}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setOpen((i) => ((i ?? 0) + 1) % photos.length)}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
