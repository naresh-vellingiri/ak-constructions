import { revalidatePath } from "next/cache";
import { badRequest, failure, forbidden, json, readJson } from "@/lib/api-response";
import { isAdmin } from "@/lib/authz";
import { PortfolioInputError, registerPhoto } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

/** Step 3 of a portfolio photo upload: the bytes have arrived, record them. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return forbidden();
  const body = await readJson(request);
  if (!body || typeof body.path !== "string") return badRequest();

  try {
    await registerPhoto(params.id, { path: body.path, caption: body.caption });
    revalidatePath("/");
    return json({ success: true });
  } catch (error) {
    return failure(
      error,
      (e) => e instanceof PortfolioInputError,
      "Failed to register portfolio photo",
      "Could not save the photo. Has docs/sql/portfolio.sql been run?"
    );
  }
}
