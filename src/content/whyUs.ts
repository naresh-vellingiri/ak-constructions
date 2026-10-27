import type { IconName } from "@/components/icons";
import { clientConfig } from "@/config/client";
import { formatIndianCurrency, formatLakhs } from "@/lib/utils";

export type WhyUsPoint = {
  key: string;
  icon: IconName;
  /** Short name shown on the selector. */
  label: string;
  title: string;
  text: string;
  image: string;
  alt: string;
  /** CSS object-position, for photos whose subject isn't centred. */
  position?: string;
};

const { turnkeyPerSqFt, interiorStartsFrom } = clientConfig.pricing;

/**
 * The "why choose us" panel. Each point has to describe something the business
 * and this website actually do today — published package sheets, the stage
 * tracker, the site-engineer contact, the Karapakkam office — because these are
 * public claims a customer will hold AK to.
 *
 * Deliberately NOT here, though competitors headline them: no cost overruns,
 * money held in escrow, a no-delay policy, verified contractors, a multi-year
 * warranty. Each is a contractual promise only Balaji can make. When he has
 * decided what he will stand behind in writing, add it as one more entry below.
 */
export const whyUsPoints: WhyUsPoint[] = [
  {
    key: "pricing",
    icon: "tag",
    label: "Clear pricing",
    title: "Know what you pay before work starts",
    text: `Turnkey construction starts from ${formatIndianCurrency(turnkeyPerSqFt)} per sq ft and custom interiors from ${formatLakhs(interiorStartsFrom)}. Our package sheets list every material and, just as importantly, what is not included.`,
    image: "/images/gallery/kitchen.webp",
    alt: "A modular kitchen designed and built by AK Construction and Interiors",
    position: "center",
  },
  {
    key: "tracking",
    icon: "eye",
    label: "Live progress",
    title: "Watch your home being built, from your phone",
    text: "Log in with your mobile number to see which stage your build has reached, ticked off as each one is completed. No chasing for updates.",
    image: "/images/gallery/home-exterior-2.webp",
    alt: "A home under construction by AK Construction and Interiors in Chennai",
    position: "center 30%",
  },
  {
    key: "engineer",
    icon: "users",
    label: "Your site engineer",
    title: "A name and a number, not a call centre",
    text: "Your site engineer's name and mobile number sit inside your tracker, one tap away by call or WhatsApp whenever you have a question.",
    image: "/images/gallery/home-exterior-1.webp",
    alt: "A completed home built by AK Construction and Interiors",
    position: "center 35%",
  },
  {
    key: "materials",
    icon: "grid",
    label: "Specified materials",
    title: "Brands and specifications in writing",
    text: "Each package spells out the materials that go into your home — cement, steel, tiles, fittings, paint — so the specification is something you can read, not something you are told.",
    image: "/images/gallery/staircase.webp",
    alt: "A finished staircase in a home by AK Construction and Interiors",
    position: "center 55%",
  },
  {
    key: "one-team",
    icon: "home",
    label: "One team",
    title: "Design, build and interiors under one roof",
    text: "From the floor plan to the final coat of paint, one team looks after your project, so nothing falls between separate contractors.",
    image: "/images/gallery/living-room.webp",
    alt: "A living room designed by AK Construction and Interiors",
    position: "center 60%",
  },
  {
    key: "local",
    icon: "pin",
    label: "Local to Chennai",
    title: "A Chennai team you can visit",
    text: `Our office is on ${clientConfig.address.street}, ${clientConfig.address.locality}, and our projects are across ${clientConfig.serviceAreas.join(", ")}.`,
    image: "/images/gallery/office-1.webp",
    alt: "The AK Construction and Interiors office reception",
    position: "center",
  },
];
