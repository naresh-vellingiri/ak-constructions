"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CtaBand from "@/components/CtaBand";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HeroGallery from "@/components/HeroGallery";
import HowItWorks from "@/components/HowItWorks";
import Packages from "@/components/Packages";
import QuoteModal from "@/components/QuoteModal";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import TrackerBanner from "@/components/TrackerBanner";
import WhyUs from "@/components/WhyUs";
import type { PublicPackage } from "@/types/package";

/** First appearance, after the page has loaded. */
const POPUP_FIRST_DELAY_MS = 2000;
/** After each close, how long until it comes back. */
const POPUP_REPEAT_MS = 10_000;

/**
 * Once someone has sent an enquiry the popup has done its job, and showing it
 * again every ten seconds would just be an insult. Remembered per browser.
 */
const SUBMITTED_KEY = "ak_quote_submitted_at";
const SUBMITTED_QUIET_MS = 30 * 24 * 60 * 60 * 1000;

type HomePageProps = {
  /** Published packages, loaded server-side in app/page.tsx. */
  packages: PublicPackage[];
};

export default function HomePage({ packages }: HomePageProps) {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSubmitted = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  /** Open the quote popup after `delayMs`, unless an enquiry has been sent. */
  const scheduleOpen = useCallback(
    (delayMs: number) => {
      const tick = () => {
        if (hasSubmitted.current) return;
        // Never pop a modal over a background tab; look again a little later.
        if (document.hidden) {
          timer.current = setTimeout(tick, POPUP_REPEAT_MS);
          return;
        }
        setIsQuoteOpen(true);
      };

      clearTimer();
      timer.current = setTimeout(tick, delayMs);
    },
    [clearTimer]
  );

  // A visitor opening it themselves (any "Get Quote" button) cancels whatever
  // was pending; closing it starts the ten-second countdown again.
  const openQuote = () => {
    clearTimer();
    setIsQuoteOpen(true);
  };

  const closeQuote = () => {
    setIsQuoteOpen(false);
    if (!hasSubmitted.current) scheduleOpen(POPUP_REPEAT_MS);
  };

  const handleSubmitted = () => {
    hasSubmitted.current = true;
    clearTimer();
    try {
      localStorage.setItem(SUBMITTED_KEY, String(Date.now()));
    } catch {
      // Storage can be blocked (private mode); the popup just won't be
      // remembered across visits.
    }
  };

  useEffect(() => {
    let submittedAt = 0;
    try {
      submittedAt = Number(localStorage.getItem(SUBMITTED_KEY) || 0);
    } catch {
      // Treated as "never submitted".
    }

    if (Date.now() - submittedAt < SUBMITTED_QUIET_MS) {
      hasSubmitted.current = true;
      return;
    }

    scheduleOpen(POPUP_FIRST_DELAY_MS);
    return clearTimer;
  }, [scheduleOpen, clearTimer]);

  return (
    <>
      <Header onGetQuote={openQuote} showPackagesLink={packages.length > 0} />
      <main>
        <Hero onGetQuote={openQuote} />
        <WhyUs onGetQuote={openQuote} />
        <HeroGallery />
        <Services />
        <Packages packages={packages} onGetQuote={openQuote} />
        <HowItWorks />
        <TrackerBanner />
        <Testimonials />
        <CtaBand onGetQuote={openQuote} />
      </main>
      <Footer showPackagesLink={packages.length > 0} />
      <FloatingContact onGetQuote={openQuote} />
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={closeQuote}
        onSubmitted={handleSubmitted}
      />
    </>
  );
}
