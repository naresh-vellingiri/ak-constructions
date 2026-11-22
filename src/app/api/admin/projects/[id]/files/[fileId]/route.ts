import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/authz";
import { deleteProjectFile } from "@/lib/project-files";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE });
  }

  try {
    const removed = await deleteProjectFile(params.id, params.fileId);
    if (!removed) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("Failed to delete project file:", error);
    return NextResponse.json(
      { error: "Could not delete the file. Please try again." },
      { status: 503, headers: NO_STORE }
    );
  }
}
