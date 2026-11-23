/**
 * Portfolio gallery on the homepage: categories ("Modular Kitchen") that each
 * hold any number of photos, all managed from /admin/portfolio.
 *
 * Shared by browser and server, so no server-only imports here.
 */

/** PUBLIC bucket: these photos are marketing material, served straight from the CDN. */
export const PORTFOLIO_BUCKET = "portfolio";
export const PORTFOLIO_CATEGORIES_TABLE = "portfolio_categories";
export const PORTFOLIO_PHOTOS_TABLE = "portfolio_photos";

export const CATEGORY_TITLE_MAX = 60;
export const CATEGORY_SUBTITLE_MAX = 90;
export const CAPTION_MAX = 80;
