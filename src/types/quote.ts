export type QuoteFormData = {
  bhk: string;
  sqFt: number;
  workType: string;
  timeline: string;
  name: string;
  phone: string;
  email: string;
  city: string;
};

export type QuoteFormErrors = Partial<Record<keyof QuoteFormData, string>>;

/** Where a lead is in your follow-up pipeline. */
export type QuoteStatus = "new" | "contacted" | "closed";

export type QuoteRecord = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  bhk?: string | null;
  sqFt: number;
  workType?: string | null;
  timeline?: string | null;
  estimate: number;
  status: QuoteStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateQuoteInput = QuoteFormData & { estimate: number };

/**
 * Short three-field enquiry (name, mobile, plot location) from the second
 * popup. No area, work type or estimate is collected, so the server fills those
 * with neutral values and stamps the lead with QUICK_LEAD_LABEL in `workType`,
 * which shows in the admin list so Balaji knows how the lead arrived and why
 * the usual details are missing. Reusing that column avoids a schema change.
 */
export type QuickLeadInput = {
  kind: "quick";
  name: string;
  phone: string;
  location: string;
  /** Honeypot: hidden from people, filled by bots. Must be empty. */
  website?: string;
};

export const QUICK_LEAD_LABEL = "Quick callback request";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};
