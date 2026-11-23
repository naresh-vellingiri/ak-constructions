import { badRequest, failure, forbidden, json, readJson } from "@/lib/api-response";
import { isAdmin } from "@/lib/authz";
import { PortfolioInputError, createPhotoUploadSlot } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

/** Step 1 of a portfolio photo upload; see src/lib/portfolio.ts. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return forbidden();
  const body = await readJson(request);
  if (!body || typeof body.mimeType !== "string" || typeof body.sizeBytes !== "number") {
    return badRequest();
  }

  try {
    return json(await createPhotoUploadSlot(params.id, body.mimeType, body.sizeBytes));
  } catch (error) {
    return failure(
      error,
      (e) => e instanceof PortfolioInputError,
      "Failed to create portfolio upload slot",
      "Could not start the upload. Check the Supabase setup."
    );
  }
}
