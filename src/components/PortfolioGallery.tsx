"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GalleryImage from "@/components/GalleryImage";
import type { PortfolioCategory } from "@/types/portfolio";

type Props = { categories: PortfolioCategory[] };

/** The first tile is the featured one: twice the width and height. */
const tileClass = (index: number) =>
  index === 0 ? "md:col-span-2 md:row-span-2" : "md:col-span-1";

/** Horizontal movement, in pixels, that counts as a swipe rather than a tap. */
const SWIPE_PX = 50;

/**
 * The portfolio tiles, and the full-screen viewer a tile opens.
 *
 * The viewer is a modal dialog: Escape closes it, the arrow keys (or a swipe,
 * or the buttons) move between photos, page scrolling is locked while it is
 * open, and focus returns to the tile that opened it.
 */
export default function PortfolioGallery({ categories }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const opener = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);

  const category = categories.find((item) => item.id === openId) ?? null;
  const images = category?.images ?? [];
  const count = images.length;

  const open = (id: string, element: HTMLElement) => {
    opener.current = element;
    setIndex(0);
    setOpenId(id);
  };

  const close = useCallback(() => {
    setOpenId(null);
    opener.current?.focus();
  }, []);

  const step = useCallback(
    (direction: -1 | 1) => setIndex((i) => (count === 0 ? 0 : (i + direction + count) % count)),
    [count]
  );

  useEffect(() => {
    if (!openId) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [openId, close, step]);

  // Fetch the neighbours ahead of time so stepping feels instant.
  useEffect(() => {
    if (!openId || count < 2) return;
    for (const offset of [-1, 1]) {
      const image = new Image();
      image.src = images[(index + offset + count) % count].src;
    }
  }, [openId, index, count, images]);

  const current = images[index];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2 md:gap-5">
        {categories.map((item, position) => {
          const extra = item.images.length - 1;
          return (
            <button
              key={item.id}
              type="button"
              onClick={(event) => open(item.id, event.currentTarget)}
              aria-haspopup="dialog"
              aria-label={`${item.title}: view ${item.images.length} photo${item.images.length === 1 ? "" : "s"}`}
              className={`group relative min-h-[220px] overflow-hidden rounded-2xl bg-stone-200 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400 ${tileClass(position)}`}
            >
              {item.cover && (
                <GalleryImage
                  src={item.cover.src}
                  alt={item.cover.alt}
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-stone-900/0 transition group-hover:bg-stone-900/10" />
              {extra > 0 && (
                <span className="absolute right-3 top-3 rounded-full bg-stone-900/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {item.images.length} photos
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/70 to-transparent p-5">
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-stone-200">{item.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {category && current && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-stone-950"
          role="dialog"
          aria-modal="true"
          aria-label={`${category.title} photos`}
        >
          <div className="flex items-start justify-between gap-4 p-4 text-white">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold">{category.title}</h3>
              <p className="truncate text-sm text-stone-300">
                {current.caption || category.subtitle}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm text-stone-300">
                {index + 1} / {count}
              </span>
              <button
                ref={closeButton}
                type="button"
                onClick={close}
                aria-label="Close photos"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none hover:bg-white/20"
              >
                ×
              </button>
            </div>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
            onTouchStart={(event) => {
              touchStart.current = event.touches[0].clientX;
            }}
            onTouchEnd={(event) => {
              if (touchStart.current === null) return;
              const delta = event.changedTouches[0].clientX - touchStart.current;
              touchStart.current = null;
              if (Math.abs(delta) > SWIPE_PX) step(delta < 0 ? 1 : -1);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.src}
              alt={current.caption || `${category.title} by AK Construction and Interiors`}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white hover:bg-white/25 sm:left-4"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white hover:bg-white/25 sm:right-4"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {count > 1 && (
            <ul className="flex gap-2 overflow-x-auto p-4" aria-label="All photos">
              {images.map((image, position) => (
                <li key={image.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setIndex(position)}
                    aria-label={`Show photo ${position + 1}`}
                    aria-current={position === index}
                    className={`block h-16 w-16 overflow-hidden rounded-lg border-2 sm:h-20 sm:w-20 ${
                      position === index ? "border-orange-500" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
