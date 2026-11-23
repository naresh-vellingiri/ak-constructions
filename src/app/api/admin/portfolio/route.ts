import { revalidatePath } from "next/cache";
import { badRequest, failure, forbidden, json, readJson } from "@/lib/api-response";
import { isAdmin } from "@/lib/authz";
import {
  PortfolioInputError,
  createCategory,
  listPortfolioForAdmin,
  reorderCategories,
} from "@/lib/portfolio";

export const dynamic = "force-dynamic";

const isInput = (e: unknown) => e instanceof PortfolioInputError;
const SETUP_HINT = "Has docs/sql/portfolio.sql been run in Supabase?";

export async function GET() {
  if (!(await isAdmin())) return forbidden();
  try {
    return json({ categories: await listPortfolioForAdmin() });
  } catch (error) {
    return failure(error, isInput, "Failed to load portfolio", `Could not load the portfolio. ${SETUP_HINT}`);
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return forbidden();
  const body = await readJson(request);
  if (!body) return badRequest();

  try {
    await createCategory({ title: body.title, subtitle: body.subtitle });
    revalidatePath("/");
    return json({ success: true });
  } catch (error) {
    return failure(error, isInput, "Failed to create category", `Could not add the category. ${SETUP_HINT}`);
  }
}

/** Saves a new display order: `{ ids: [categoryId, ...] }` in the order wanted. */
export async function PUT(request: Request) {
  if (!(await isAdmin())) return forbidden();
  const body = await readJson(request);
  if (!body) return badRequest();

  try {
    await reorderCategories(body.ids);
    revalidatePath("/");
    return json({ success: true });
  } catch (error) {
    return failure(error, isInput, "Failed to reorder portfolio", "Could not save the order.");
  }
}
