import PortfolioGallery from "@/components/PortfolioGallery";
import type { PortfolioCategory } from "@/types/portfolio";

type HeroGalleryProps = {
  /** From the database, or the built-in tiles if it cannot be reached. */
  categories: PortfolioCategory[];
};

export default function HeroGallery({ categories }: HeroGalleryProps) {
  // A category with no pictures yet would be an empty grey box.
  const shown = categories.filter((category) => category.images.length > 0);

  return (
    <section id="gallery" className="bg-stone-50 px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Portfolio
            </p>
            <h2 className="mt-2 text-3xl font-bold text-stone-900 md:text-4xl">
              Our Completed Projects
            </h2>
          </div>
          <p className="max-w-md text-stone-600">
            Explore our recent interior and construction projects — kitchens,
            bedrooms, living spaces, and complete home builds.
          </p>
        </div>

        <PortfolioGallery categories={shown} />
      </div>
    </section>
  );
}
