"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/icons";
import { clientConfig } from "@/config/client";
import { whyUsPoints } from "@/content/whyUs";

type WhyUsProps = {
  onGetQuote: () => void;
};

/** Slow on purpose: people need time to read a paragraph before it changes. */
const AUTO_ADVANCE_MS = 8000;

/**
 * Selector plus detail panel: pick a point on the left, read it on the right.
 *
 * It rotates by itself until the visitor touches it, then stays put — an
 * auto-advancing panel is fine as a hint that there is more to see, but it must
 * never change under someone who has started reading. It also pauses while the
 * pointer or keyboard focus is inside the panel, in a background tab, and for
 * anyone with "reduce motion" set.
 */
export default function WhyUs({ onGetQuote }: WhyUsProps) {
  const [active, setActive] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [paused, setPaused] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const count = whyUsPoints.length;
  const point = whyUsPoints[active];

  useEffect(() => {
    if (!autoPlay || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      if (document.hidden) return;
      setActive((index) => (index + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [autoPlay, paused, count]);

  const select = (index: number) => {
    setActive(index);
    setAutoPlay(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    let next: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      next = (active + 1) % count;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      next = (active - 1 + count) % count;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = count - 1;
    }
    if (next === null) return;

    event.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="why-us" className="bg-white px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            Why choose us
          </p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-stone-900 md:text-4xl">
            Clear pricing, clear progress, one team
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            {clientConfig.name} designs and builds homes in {clientConfig.city}.
            Here is what that looks like in practice.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
          {/* Selector: a 3x2 grid on phones so every option is visible without
              scrolling, a vertical list from lg up. */}
          <div
            role="tablist"
            aria-label="Why choose us"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="grid grid-cols-3 gap-x-2 gap-y-5 lg:grid-cols-1 lg:gap-2"
          >
            {whyUsPoints.map((item, index) => {
              const isActive = index === active;
              return (
                <button
                  key={item.key}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`why-tab-${item.key}`}
                  aria-selected={isActive}
                  aria-controls="why-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(index)}
                  className={`group flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition lg:flex-row lg:gap-4 lg:px-4 lg:py-3 lg:text-left ${
                    isActive ? "lg:bg-orange-50" : "lg:hover:bg-stone-50"
                  }`}
                >
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition lg:h-12 lg:w-12 ${
                      isActive
                        ? "bg-orange-100 text-orange-600"
                        : "bg-stone-100 text-stone-400 group-hover:text-stone-600"
                    }`}
                  >
                    <Icon name={item.icon} className="h-6 w-6" />
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase leading-tight tracking-wide lg:text-sm lg:normal-case lg:tracking-normal ${
                      isActive ? "text-stone-900" : "text-stone-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail panel. Fixed minimum height so the page doesn't jump when a
              longer paragraph replaces a shorter one. */}
          <div
            role="tabpanel"
            id="why-panel"
            aria-labelledby={`why-tab-${point.key}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="relative flex min-h-[560px] flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 p-6 text-white shadow-2xl sm:p-8 lg:min-h-[540px] lg:p-10"
          >
            <p className="text-sm font-semibold tabular-nums text-orange-400">
              {String(active + 1).padStart(2, "0")}
              <span className="text-stone-500">
                {" "}
                / {String(count).padStart(2, "0")}
              </span>
            </p>

            <h3 className="mt-3 max-w-xl text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              {point.title}
            </h3>
            <p className="mt-4 max-w-xl leading-relaxed text-stone-300 lg:text-lg">
              {point.text}
            </p>

            <div className="relative mt-6 min-h-[200px] flex-1 overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={point.key}
                src={point.image}
                alt={point.alt}
                loading="lazy"
                style={{ objectPosition: point.position }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-stone-950/40 to-transparent"
              />
              <button
                type="button"
                onClick={() => select((active + 1) % count)}
                aria-label="Next point"
                className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600 shadow-lg transition hover:bg-white hover:text-orange-700"
              >
                <Icon name="arrow" className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center lg:text-left">
          <button
            type="button"
            onClick={onGetQuote}
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-orange-600"
          >
            Get a free estimate
            <Icon name="arrow" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
