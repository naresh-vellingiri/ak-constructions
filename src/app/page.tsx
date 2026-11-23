import HomePage from "@/components/HomePage";
import { staticPortfolio } from "@/content/projects";
import { listPublishedPackages } from "@/lib/packages";
import { listPortfolio } from "@/lib/portfolio";
import type { PublicPackage } from "@/types/package";
import type { PortfolioCategory } from "@/types/portfolio";

/**
 * Cached and revalidated rather than dynamic. The homepage is the lead-generating
 * page, packages change rarely, and this keeps it fast without a database round
 * trip per visitor. Admin edits don't wait for the window to expire — the
 * package routes call revalidatePath("/") so a change is live immediately.
 */
export const revalidate = 600;

export default async function Home() {
  // A database outage must never take down the homepage. Falling back to an
  // empty list hides the packages section and leaves the quote form — which is
  // the part that actually earns money — working.
  let packages: PublicPackage[] = [];
  try {
    packages = await listPublishedPackages();
  } catch (error) {
    console.error("Failed to load packages for the homepage:", error);
  }

  // Same rule for the portfolio, with a better fallback than "nothing": the
  // built-in tiles. They are also used while the table is still empty.
  let portfolio: PortfolioCategory[] = [];
  try {
    portfolio = await listPortfolio();
  } catch (error) {
    console.error("Failed to load the portfolio for the homepage:", error);
  }
  if (portfolio.length === 0) portfolio = staticPortfolio();

  return <HomePage packages={packages} portfolio={portfolio} />;
}
