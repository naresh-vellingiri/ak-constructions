import { NextResponse } from "next/server";
import { isAdmin, requireClientPhone } from "@/lib/authz";
import { createViewUrl, getFileRecord } from "@/lib/project-files";
import { getProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

const NOT_FOUND = () =>
  NextResponse.json(
    { error: "Not found" },
    { status: 404, headers: { "Cache-Control": "no-store" } }
  );

/**
 * Opens one photo or document.
 *
 * The page never contains a real storage address, only /api/files/<id>. Each
 * request lands here, the caller is checked, and only then is it redirected to
 * a link that expires in an hour. That means a link copied out of the page is
 * useless later, and a file the admin hides or deletes stops working at once.
 *
 *  - an admin may open anything;
 *  - a client may open a file only if it belongs to a project on THEIR phone
 *    number (taken from the session, never the request) and is marked visible.
 *
 * Every refusal is the same 404, so a client cannot tell "exists but not yours"
 * from "does not exist".
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const record = await getFileRecord(params.id);
    if (!record) return NOT_FOUND();

    if (!(await isAdmin())) {
      const phone = await requireClientPhone();
      if (!phone || !record.clientVisible) return NOT_FOUND();

      const project = await getProject(record.projectId);
      if (!project || project.phone !== phone) return NOT_FOUND();
    }

    const url = await createViewUrl(record.storagePath);
    return NextResponse.redirect(url, {
      status: 302,
      // Private (never a shared cache); short, so a hidden file disappears fast.
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    console.error("Failed to open project file:", error);
    return NextResponse.json(
      { error: "Could not open this file." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
