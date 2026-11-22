import type { DocumentCategory, FileKind } from "@/config/files";

/** One row of project_files. Column names are quoted camelCase like the rest of the schema. */
export type ProjectFileRecord = {
  id: string;
  projectId: string;
  kind: FileKind;
  /** Documents only; null for photos. */
  category: DocumentCategory | null;
  /** Caption for a photo, or the document's name. */
  title: string | null;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  /** When false the client cannot see it; the admin still can. */
  clientVisible: boolean;
  createdAt: string;
};

/**
 * What the browser is given about a file. There is deliberately no storage path
 * or URL: pictures and downloads go through /api/files/<id>, which checks who
 * is asking each time and hands back a short-lived link.
 */
export type ProjectFileSummary = Pick<
  ProjectFileRecord,
  "id" | "kind" | "category" | "title" | "mimeType" | "sizeBytes" | "createdAt"
> &
  Partial<Pick<ProjectFileRecord, "clientVisible">>;
