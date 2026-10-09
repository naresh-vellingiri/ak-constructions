import type { IconName } from "@/components/icons";

export type Service = {
  icon: IconName;
  title: string;
  description: string;
  points: string[];
};

/**
 * What AK offers. Single source for the Services section and the footer list,
 * so the two cannot drift apart.
 *
 * Every entry is a public claim about what the firm does. "Real estate" /
 * property sales is deliberately absent even though Balaji's old site lists it:
 * brokering property in Tamil Nadu needs RERA registration, so that is his call
 * to make explicitly rather than something to carry over from a template. It is
 * one entry to add here once he confirms.
 *
 * The approvals entry is worded as support, "quoted separately", because the
 * published packages list building plan approval under "What's Not Included".
 */
export const services: Service[] = [
  {
    icon: "home",
    title: "Home Construction",
    description:
      "New homes built from foundation to handover, with materials specified up front and every stage trackable online.",
    points: [
      "Clearly specified construction packages",
      "Site supervision and quality checks",
      "Progress updates from your phone",
    ],
  },
  {
    icon: "sofa",
    title: "Interior Design",
    description:
      "Complete interiors for apartments and villas, planned as one scheme rather than room by room.",
    points: [
      "Living rooms, bedrooms and foyers",
      "TV units, false ceilings and lighting",
      "Pooja rooms and home theatres",
    ],
  },
  {
    icon: "grid",
    title: "Modular Kitchens & Wardrobes",
    description:
      "Kitchens and wardrobes made to measure, with storage planned around how your family actually uses the space.",
    points: [
      "Parallel, L-shape, U-shape and island kitchens",
      "Custom wardrobes with smart storage",
      "Premium finishes and hardware",
    ],
  },
  {
    icon: "wrench",
    title: "Renovation",
    description:
      "Bring an existing home up to date without starting from scratch.",
    points: [
      "Kitchen and bathroom upgrades",
      "Flooring, painting and ceiling work",
      "Layout changes within the existing structure",
    ],
  },
  {
    icon: "ruler",
    title: "Plan & Elevation Design",
    description:
      "Floor plans and elevations drawn around your plot, your family and your budget, reviewed with you before any work begins.",
    points: [
      "Floor plans tailored to your plot",
      "3D elevation views",
      "Architect support through design",
    ],
  },
  {
    icon: "fileCheck",
    title: "Building Plan & Land Approvals",
    description:
      "Support with your building plan and land approvals, so paperwork doesn't delay the start of work.",
    points: [
      "Plan preparation and submission",
      "Guidance on the documents required",
      "Quoted separately from construction",
    ],
  },
];
