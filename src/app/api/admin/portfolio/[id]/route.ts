import { revalidatePath } from "next/cache";
import { badRequest, failure, forbidden, json, notFound, readJson } from "@/lib/api-response";
import { isAdmin } from "@/lib/authz";
import { PortfolioInputError, deleteCategory, updateCategory } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

const isInput = (e: unknown) => e instanceof PortfolioInputError;

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return forbidden();
  const body = await readJson(request);
  if (!body) return badRequest();

  try {
    const found = await updateCategory(params.id, {
      title: body.title,
      subtitle: body.subtitle,
      coverPhotoId: body.coverPhotoId,
    });
    if (!found) return notFound();
    revalidatePath("/");
    return json({ success: true });
  } catch (error) {
    return failure(error, isInput, "Failed to update category", "Could not save the change.");
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return forbidden();

  try {
    if (!(await deleteCategory(params.id))) return notFound();
    revalidatePath("/");
    return json({ success: true });
  } catch (error) {
    return failure(error, isInput, "Failed to delete category", "Could not delete the category.");
  }
}
