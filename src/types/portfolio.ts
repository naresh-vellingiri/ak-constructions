export type PortfolioCategoryRecord = {
  id: string;
  title: string;
  subtitle: string;
  /** Static image shipped with the site (the original tiles); null for new categories. */
  coverImage: string | null;
  coverAlt: string | null;
  /** Admin-chosen cover; wins over coverImage and over the first photo. */
  coverPhotoId: string | null;
  sortOrder: number;
  createdAt: string;
};

export type PortfolioPhotoRecord = {
  id: string;
  categoryId: string;
  storagePath: string;
  caption: string | null;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

/** One picture in the viewer. */
export type PortfolioImage = {
  id: string;
  src: string;
  caption: string | null;
};

/** What the homepage needs for one tile and its viewer. */
export type PortfolioCategory = {
  id: string;
  title: string;
  subtitle: string;
  cover: { src: string; alt: string } | null;
  images: PortfolioImage[];
};

/** What the admin page needs for one category. */
export type AdminPortfolioCategory = {
  id: string;
  title: string;
  subtitle: string;
  coverPhotoId: string | null;
  hasStaticCover: boolean;
  photos: PortfolioImage[];
};
