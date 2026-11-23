import { revalidatePath } from "next/cache";
import { failure, forbidden, json, notFound } from "@/lib/api-response";
import { isAdmin } from "@/lib/authz";
import { PortfolioInputError, deletePhoto } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; photoId: string } }
) {
  if (!(await isAdmin())) return forbidden();

  try {
    if (!(await deletePhoto(params.id, params.photoId))) return notFound();
    revalidatePath("/");
    return json({ success: true });
  } catch (error) {
    return failure(
      error,
      (e) => e instanceof PortfolioInputError,
      "Failed to delete portfolio photo",
      "Could not delete the photo."
    );
  }
}
