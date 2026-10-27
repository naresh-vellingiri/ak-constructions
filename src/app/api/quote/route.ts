import { NextResponse } from "next/server";
import { createQuote } from "@/lib/quotes";
import { normalizePhone } from "@/lib/utils";
import {
  QUICK_LEAD_LABEL,
  type CreateQuoteInput,
  type QuickLeadInput,
} from "@/types/quote";

export const dynamic = "force-dynamic";

/**
 * Public quote/enquiry endpoint.
 *
 * Leads are persisted to the database — an earlier version only console.logged
 * them, which meant every enquiry submitted on the live site was silently lost.
 * Deliberately does NOT log the submitted name/phone/email: that would put
 * customer PII into hosting logs for no benefit now that it's stored properly.
 */
/** Same rule the quote form applies: an Indian mobile, 10 digits, starting 6-9. */
const MOBILE_RE = /^[6-9]\d{9}$/;

function isQuickLead(body: CreateQuoteInput | QuickLeadInput): body is QuickLeadInput {
  return "kind" in body && body.kind === "quick";
}

/**
 * The three-field popup. Only name, phone and location are taken from the
 * request; everything else stored is decided here, so a crafted body cannot set
 * an estimate or any other column.
 */
async function handleQuickLead(body: QuickLeadInput) {
  // A bot filled the hidden field. Answer success so it learns nothing, store nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  const name = String(body.name ?? "").trim().slice(0, 100);
  const phone = normalizePhone(String(body.phone ?? ""));
  const location = String(body.location ?? "").trim().slice(0, 200);

  if (name.length < 2 || !MOBILE_RE.test(phone) || location.length < 2) {
    return NextResponse.json(
      { error: "Please enter your name, a valid 10-digit mobile number and your plot location." },
      { status: 400 }
    );
  }

  try {
    await createQuote({
      name,
      phone,
      email: "",
      city: location,
      bhk: "",
      sqFt: 0,
      workType: QUICK_LEAD_LABEL,
      timeline: "",
      estimate: 0,
    });
    return NextResponse.json({ success: true, message: "Request received" });
  } catch (error) {
    console.error("Failed to save quick lead:", error);
    return NextResponse.json(
      {
        error:
          "We couldn't submit your request just now. Please call or WhatsApp us instead.",
      },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  let body: CreateQuoteInput | QuickLeadInput;
  try {
    body = (await request.json()) as CreateQuoteInput | QuickLeadInput;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (isQuickLead(body)) return handleQuickLead(body);

  const phone = normalizePhone(body.phone ?? "");

  if (!body.name?.trim() || phone.length !== 10 || !body.sqFt) {
    return NextResponse.json(
      { error: "Please enter your name, a valid 10-digit mobile number, and area." },
      { status: 400 }
    );
  }

  try {
    await createQuote({ ...body, phone });

    return NextResponse.json({
      success: true,
      message: "Quote request received",
    });
  } catch (error) {
    // No PII in the log line — just enough to know a write failed.
    console.error("Failed to save quote request:", error);
    return NextResponse.json(
      {
        error:
          "We couldn't submit your request just now. Please call or WhatsApp us instead.",
      },
      { status: 503 }
    );
  }
}
