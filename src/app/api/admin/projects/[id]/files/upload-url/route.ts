import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/authz";
import {
  FileInputError,
  createUploadSlot,
  isFileKind,
} from "@/lib/project-files";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Step 1 of an upload: the browser says what it wants to send, the server
 * checks it and returns a one-time address to send it to. See
 * src/lib/project-files.ts for the full flow.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE });
  }

  let body: { kind?: unknown; mimeType?: unknown; sizeBytes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });
  }

  if (
    !isFileKind(body.kind) ||
    typeof body.mimeType !== "string" ||
    typeof body.sizeBytes !== "number"
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });
  }

  try {
    const slot = await createUploadSlot(
      params.id,
      body.kind,
      body.mimeType,
      body.sizeBytes
    );
    return NextResponse.json(slot, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof FileInputError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: NO_STORE }
      );
    }
    console.error("Failed to create upload slot:", error);
    return NextResponse.json(
      { error: "Could not start the upload. Check the Supabase setup." },
      { status: 503, headers: NO_STORE }
    );
  }
}
