"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DOCUMENT_CATEGORIES,
  TITLE_MAX_LENGTH,
  categoryLabel,
  type DocumentCategory,
} from "@/config/files";
import { UploadError, uploadProjectFile } from "@/lib/upload-client";
import type { ProjectFileSummary } from "@/types/file";

type Props = { projectId: string };

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

/**
 * Admin panel on a project page: upload site photos and documents (FMB sketch,
 * sketch map, patta...) and remove them again.
 *
 * Thumbnails and Open links point at /api/files/<id> rather than at storage, so
 * this page never holds a real storage address (see src/lib/project-files.ts).
 */
export default function ProjectFilesPanel({ projectId }: Props) {
  const [files, setFiles] = useState<ProjectFileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [photoCaption, setPhotoCaption] = useState("");
  const [photoVisible, setPhotoVisible] = useState(true);
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);

  const [docCategory, setDocCategory] = useState<DocumentCategory>("fmb");
  const [docTitle, setDocTitle] = useState("");
  const [docVisible, setDocVisible] = useState(true);
  const [docStatus, setDocStatus] = useState("");
  const [docError, setDocError] = useState("");
  const [docBusy, setDocBusy] = useState(false);

  const photoInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/projects/${encodeURIComponent(projectId)}/files`
      );
      if (!response.ok) throw new Error("load failed");
      const data = (await response.json()) as { files: ProjectFileSummary[] };
      setFiles(data.files);
      setLoadError("");
    } catch {
      setLoadError(
        "Could not load photos and documents. If this is new, run docs/sql/project-files.sql in Supabase first."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadPhotos = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    const list = Array.from(selected);

    setPhotoBusy(true);
    setPhotoErrors([]);
    const problems: string[] = [];

    for (let index = 0; index < list.length; index += 1) {
      setPhotoStatus(`Uploading ${index + 1} of ${list.length}...`);
      try {
        const saved = await uploadProjectFile({
          projectId,
          kind: "photo",
          file: list[index],
          title: photoCaption,
          clientVisible: photoVisible,
        });
        setFiles((current) => [saved, ...current]);
      } catch (error) {
        problems.push(
          error instanceof UploadError
            ? error.message
            : `${list[index].name} could not be uploaded.`
        );
      }
    }

    setPhotoErrors(problems);
    setPhotoStatus(
      problems.length < list.length
        ? `${list.length - problems.length} photo(s) added.`
        : ""
    );
    if (problems.length < list.length) setPhotoCaption("");
    setPhotoBusy(false);
    if (photoInput.current) photoInput.current.value = "";
  };

  const uploadDocument = async (selected: FileList | null) => {
    const file = selected?.[0];
    if (!file) return;

    setDocBusy(true);
    setDocError("");
    setDocStatus("Uploading...");

    try {
      const saved = await uploadProjectFile({
        projectId,
        kind: "document",
        file,
        category: docCategory,
        // Default the name to the file's own, so the client sees something useful.
        title: docTitle.trim() || file.name.replace(/\.[^.]+$/, ""),
        clientVisible: docVisible,
      });
      setFiles((current) => [saved, ...current]);
      setDocTitle("");
      setDocStatus("Document added.");
    } catch (error) {
      setDocStatus("");
      setDocError(
        error instanceof UploadError ? error.message : "Could not upload that document."
      );
    } finally {
      setDocBusy(false);
      if (docInput.current) docInput.current.value = "";
    }
  };

  const remove = async (file: ProjectFileSummary) => {
    const name = file.title || (file.kind === "photo" ? "this photo" : "this document");
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;

    const response = await fetch(
      `/api/admin/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(file.id)}`,
      { method: "DELETE" }
    );
    if (response.ok) {
      setFiles((current) => current.filter((item) => item.id !== file.id));
    } else {
      window.alert("Could not delete it. Please try again.");
    }
  };

  const photos = files.filter((file) => file.kind === "photo");
  const documents = files.filter((file) => file.kind === "document");

  const field =
    "w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

  return (
    <div className="mt-6 space-y-8">
      {loadError && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{loadError}</p>
      )}

      {/* ---------------------------------------------------------- Photos */}
      <section>
        <p className="text-sm font-semibold text-stone-800">Site photos</p>
        <p className="mt-1 text-xs text-stone-400">
          Progress pictures the client sees on their dashboard. Photos are
          shrunk automatically before upload.
        </p>

        <div className="mt-3 space-y-2">
          <input
            type="text"
            placeholder="Caption (optional), e.g. Slab concrete poured"
            maxLength={TITLE_MAX_LENGTH}
            value={photoCaption}
            onChange={(event) => setPhotoCaption(event.target.value)}
            className={field}
          />
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={photoVisible}
              onChange={(event) => setPhotoVisible(event.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
            Show to the client
          </label>
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => uploadPhotos(event.target.files)}
          />
          <button
            type="button"
            disabled={photoBusy}
            onClick={() => photoInput.current?.click()}
            className="w-full rounded-xl border border-orange-500 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {photoBusy ? photoStatus : "+ Choose photos to upload"}
          </button>
          {!photoBusy && photoStatus && (
            <p className="text-sm text-green-700">{photoStatus}</p>
          )}
          {photoErrors.map((message) => (
            <p key={message} className="text-sm text-red-600">
              {message}
            </p>
          ))}
        </div>

        {loading ? (
          <p className="mt-3 text-sm text-stone-400">Loading...</p>
        ) : photos.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">No photos yet.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <li key={photo.id} className="relative">
                <a
                  href={`/api/files/${encodeURIComponent(photo.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg bg-stone-100"
                >
                  {/* A plain <img>: the source is a redirect to a short-lived
                      storage link, which next/image would try to optimise and cache. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/files/${encodeURIComponent(photo.id)}`}
                    alt={photo.title || "Site photo"}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                </a>
                {photo.clientVisible === false && (
                  <span className="absolute left-1 top-1 rounded bg-stone-900/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Hidden
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Delete photo"
                  onClick={() => remove(photo)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900/75 text-sm leading-none text-white hover:bg-red-600"
                >
                  ×
                </button>
                <p className="mt-1 truncate text-[11px] text-stone-500">
                  {photo.title || formatDate(photo.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------- Documents */}
      <section>
        <p className="text-sm font-semibold text-stone-800">Documents</p>
        <p className="mt-1 text-xs text-stone-400">
          FMB sketch, site map, patta, approved plan. PDF or image, up to 15 MB.
        </p>

        <div className="mt-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={docCategory}
              onChange={(event) => setDocCategory(event.target.value as DocumentCategory)}
              aria-label="Document type"
              className={field}
            >
              {DOCUMENT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Name (optional)"
              maxLength={TITLE_MAX_LENGTH}
              value={docTitle}
              onChange={(event) => setDocTitle(event.target.value)}
              className={field}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={docVisible}
              onChange={(event) => setDocVisible(event.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
            Show to the client
          </label>
          <input
            ref={docInput}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(event) => uploadDocument(event.target.files)}
          />
          <button
            type="button"
            disabled={docBusy}
            onClick={() => docInput.current?.click()}
            className="w-full rounded-xl border border-orange-500 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {docBusy ? docStatus : "+ Choose a document to upload"}
          </button>
          {!docBusy && docStatus && <p className="text-sm text-green-700">{docStatus}</p>}
          {docError && <p className="text-sm text-red-600">{docError}</p>}
        </div>

        {loading ? null : documents.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">No documents yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {doc.title || categoryLabel(doc.category)}
                  </p>
                  <p className="text-xs text-stone-400">
                    {categoryLabel(doc.category)} · {formatSize(doc.sizeBytes)} ·{" "}
                    {formatDate(doc.createdAt)}
                    {doc.clientVisible === false && " · Hidden from client"}
                  </p>
                </div>
                <a
                  href={`/api/files/${encodeURIComponent(doc.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-sm font-semibold text-orange-600 hover:underline"
                >
                  Open
                </a>
                <button
                  type="button"
                  aria-label={`Delete ${doc.title || "document"}`}
                  onClick={() => remove(doc)}
                  className="shrink-0 text-lg leading-none text-stone-400 hover:text-red-600"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
