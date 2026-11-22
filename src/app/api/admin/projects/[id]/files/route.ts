import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/authz";
import {
  FileInputError,
  isFileKind,
  listProjectFiles,
  registerFile,
  toSummary,
} from "@/lib/project-files";
import { getProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) return forbidden();

  try {
    if (!(await getProject(params.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
    }
    const files = await listProjectFiles(params.id);
    return NextResponse.json({ files: files.map(toSummary) }, { headers: NO_STORE });
  } catch (error) {
    console.error("Failed to list project files:", error);
    return NextResponse.json(
      { error: "Could not load files. Has docs/sql/project-files.sql been run?" },
      { status: 503, headers: NO_STORE }
    );
  }
}

/** Step 3 of an upload: the bytes have arrived, record them. */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) return forbidden();

  let body: {
    path?: unknown;
    kind?: unknown;
    category?: unknown;
    title?: unknown;
    clientVisible?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });
  }

  if (typeof body.path !== "string" || !isFileKind(body.kind)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });
  }

  try {
    const record = await registerFile(params.id, {
      path: body.path,
      kind: body.kind,
      category: body.category,
      title: body.title,
      clientVisible: body.clientVisible,
    });
    return NextResponse.json({ file: toSummary(record) }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof FileInputError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: NO_STORE }
      );
    }
    console.error("Failed to register project file:", error);
    return NextResponse.json(
      { error: "Could not save the file. Has docs/sql/project-files.sql been run?" },
      { status: 503, headers: NO_STORE }
    );
  }
}
