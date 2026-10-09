"use client";

import Link from "next/link";
import { useState } from "react";
import { clientConfig, navLinks } from "@/config/client";

type HeaderProps = {
  onGetQuote: () => void;
  /**
   * Whether to show the Packages anchor. Driven by whether any package is
   * actually published, so the nav can never point at a section that isn't
   * rendered.
   */
  showPackagesLink?: boolean;
};

export default function Header({ onGetQuote, showPackagesLink }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = showPackagesLink
    ? [
        ...navLinks.slice(0, 3),
        { label: "Packages", href: "#packages" },
        ...navLinks.slice(3),
      ]
    : navLinks;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <div className="min-w-0">
          {/* The visible text omits "AK" (the logo supplies it), so the link
              carries the full name for screen readers. */}
          <a
            href="#"
            aria-label={clientConfig.name}
            className="flex items-center gap-2.5 lg:gap-3"
          >
            {/* The client's logo file has a white background baked in (no alpha),
                so mix-blend-multiply drops it out against the light header
                instead of showing a white box over the blurred backdrop. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/ak-logo.webp"
              alt=""
              aria-hidden="true"
              className="h-9 w-auto shrink-0 mix-blend-multiply lg:h-11"
            />
            {/* No tagline beneath: it competed with the name, and the hero already
                says it. On phones the text is allowed to wrap onto two lines
                ("Construction and / Interiors") rather than being clipped; only
                from the sm breakpoint up does it stay on one line. */}
            <span className="min-w-0 text-base font-bold leading-tight tracking-tight text-stone-900 min-[400px]:text-lg sm:truncate sm:text-xl xl:whitespace-nowrap xl:text-lg">
              {clientConfig.logoText}
            </span>
          </a>
        </div>

        {/* No 2xl size or spacing step-up: the header content is capped at max-w-7xl,
            so a larger font on a wider screen spends the same fixed width and
            clips the brand text. */}
        <nav className="hidden items-center gap-5 xl:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="whitespace-nowrap text-sm font-medium text-stone-700 transition hover:text-orange-600"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href={`tel:${clientConfig.phone.replace(/\s/g, "")}`}
            className="hidden text-sm font-medium text-stone-700 hover:text-orange-600 md:block"
          >
            {clientConfig.phone}
          </a>
          <Link
            href="/login"
            className="hidden rounded-full border border-orange-500 px-5 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 sm:block"
          >
            Login
          </Link>
          <button
            type="button"
            onClick={onGetQuote}
            className="hidden rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 sm:block"
          >
            Get Quote
          </button>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-stone-700 xl:hidden"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-stone-200 bg-white px-4 py-4 xl:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-stone-700 hover:bg-stone-50 hover:text-orange-600"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                onClick={closeMenu}
                className="block rounded-lg px-3 py-3 text-base font-medium text-stone-700 hover:bg-stone-50 hover:text-orange-600"
              >
                Login
              </Link>
            </li>
            <li>
              <a
                href={`tel:${clientConfig.phone.replace(/\s/g, "")}`}
                className="block rounded-lg px-3 py-3 text-base font-medium text-stone-700 hover:bg-stone-50 hover:text-orange-600"
              >
                {clientConfig.phone}
              </a>
            </li>
            <li className="mt-1">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onGetQuote();
                }}
                className="w-full rounded-full bg-orange-500 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                Get Quote
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
