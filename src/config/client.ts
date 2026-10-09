export const clientConfig = {
  name: "AK Construction and Interiors",
  /**
   * The words shown next to the logo in the header. The logo image already
   * carries the "AK" monogram, so repeating it in text reads "AK AK
   * Construction..." and also pushes the name past the width available,
   * clipping it. Everywhere else (hero, footer, page title, structured data)
   * the full `name` is still used.
   */
  logoText: "Construction and Interiors",
  tagline: "Interior Design & Home Construction",
  description:
    "Complete interior solutions and home construction — from modular kitchens to full home builds.",
  ratePerSqFt: 1899,
  currency: "INR",
  currencySymbol: "₹",
  phone: "+91 98407 64744",
  /**
   * Same number as `phone`, in wa.me format (country code, no "+" or spaces).
   * Confirmed as Balaji's business number from his existing site; it has NOT
   * been confirmed as a WhatsApp account. If a WhatsApp tap ever lands on
   * "isn't on WhatsApp", change only this line to the right number.
   */
  whatsapp: "919840764744",
  /** Dialling code, no "+". Prefixed to the 10 local digits admins type in. */
  phoneCountryCode: "91",
  /**
   * Balaji's existing business address. Note it lives on his OLD domain
   * (akbuildersandinteriors.com): if that domain or its mailbox lapses, mail
   * sent from this site's contact links stops arriving, silently.
   */
  email: "contact@akbuildersandinteriors.com",
  city: "Chennai",
  region: "Tamil Nadu",
  /** Office address, as published on Balaji's existing site. */
  address: {
    street: "Opposite to Capgemini, No 3/45, Rajiv Gandhi Salai",
    locality: "Karapakkam",
    postalCode: "600097",
  },
  /**
   * Areas AK demonstrably has projects in. This is a public coverage claim and
   * it also drives the local-SEO keywords, so extend it only with areas Balaji
   * confirms — a padded list that ranks for a suburb he won't travel to just
   * produces calls he has to turn down.
   */
  serviceAreas: ["Adyar", "Guindy", "Anna Nagar", "Perungudi"],
  /** Canonical origin. The apex 308-redirects here, so this must carry the www. */
  siteUrl: "https://www.akconstructionandinteriors.com",
  /** Hero trust stats. Keep these truthful — they are public claims. */
  stats: {
    projectsDelivered: "300+",
    yearsExperience: "10+",
    clientRating: "4.9★",
  },
  social: {
    instagram: "https://instagram.com/akconstructions",
    facebook: "https://facebook.com/akconstructions",
  },
} as const;

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#gallery" },
  { label: "Services", href: "#services" },
  { label: "Process", href: "#how-it-works" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

export const bhkOptions = [
  { label: "2 BHK", sqFt: 900 },
  { label: "3 BHK", sqFt: 1200 },
  { label: "4 BHK", sqFt: 1600 },
  { label: "5+ BHK / Villa", sqFt: 2500 },
  { label: "Other", sqFt: 0 },
] as const;

export const timelineOptions = [
  "Immediately",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "Just exploring",
] as const;

export const workTypes = [
  "Interior Design Only",
  "Construction Only",
  "Interior + Construction",
] as const;

export type WorkType = (typeof workTypes)[number];

/**
 * Rate per sq ft for each kind of work, driving the quote form's live estimate.
 *
 * `null` means "no published rate": the form then offers a site visit instead of
 * a number, which is the honest answer and still captures the lead.
 *
 * Only the combined rate is AK's actual published figure — it is the same
 * ₹1,899 shown in the hero. **The other two have to come from Balaji.** A
 * plausible-looking number invented here is a price a customer reads, believes,
 * and plans a budget around, so it stays null until he supplies it.
 *
 * Note the combined rate currently undercuts the cheapest published
 * construction package (₹2,499, see /admin/packages). That contradiction is
 * Balaji's to resolve on the commercial side — do not paper over it by guessing
 * a construction-only rate here.
 */
export const rateByWorkType: Record<WorkType, number | null> = {
  "Interior Design Only": null,
  "Construction Only": null,
  "Interior + Construction": clientConfig.ratePerSqFt,
};
