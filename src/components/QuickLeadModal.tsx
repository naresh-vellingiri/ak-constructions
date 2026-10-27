"use client";

import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/icons";
import LocationInput from "@/components/LocationInput";
import { clientConfig } from "@/config/client";
import { buildWhatsAppUrl } from "@/lib/utils";

type QuickLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Fired once a lead has actually been saved, so the page can stop re-opening popups. */
  onSubmitted?: () => void;
};

type Errors = { name?: string; phone?: string; location?: string; form?: string };

/**
 * The visitor may type "+91 98407 64744", "098407 64744" or just ten digits.
 * Strip a country code or trunk zero and keep ten digits; the server applies the
 * same rule, so a number typed with a leading 0 is not wrongly rejected.
 */
function cleanMobile(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

function validate(name: string, phone: string, location: string): Errors {
  const errors: Errors = {};
  if (name.trim().length < 2) errors.name = "Please enter your name";
  if (!/^[6-9]\d{9}$/.test(cleanMobile(phone))) {
    errors.phone = "Enter a valid 10-digit mobile number";
  }
  if (location.trim().length < 2) errors.location = "Tell us where your plot is";
  return errors;
}

/**
 * Figures shown under the form, all from the same config the hero uses, so the
 * popup can never claim a number the rest of the site doesn't.
 */
const trust: { icon: IconName; value: string; label: string }[] = [
  { icon: "home", value: clientConfig.stats.projectsDelivered, label: "Projects delivered" },
  { icon: "ruler", value: clientConfig.stats.yearsExperience, label: "Years experience" },
  { icon: "eye", value: "Live", label: "Progress tracking" },
];

/** Small inline flag: emoji flags render as the letters "IN" on Windows. */
function IndiaFlag() {
  return (
    <svg viewBox="0 0 30 20" className="h-4 w-6 rounded-[2px] shadow-sm" aria-hidden="true">
      <rect width="30" height="7" fill="#FF9933" />
      <rect y="7" width="30" height="6" fill="#FFFFFF" />
      <rect y="13" width="30" height="7" fill="#138808" />
      <circle cx="15" cy="10" r="2.3" fill="none" stroke="#000080" strokeWidth="0.7" />
    </svg>
  );
}

export default function QuickLeadModal({
  isOpen,
  onClose,
  onSubmitted,
}: QuickLeadModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const found = validate(name, phone, location);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "quick",
          name: name.trim(),
          phone: cleanMobile(phone),
          location: location.trim(),
          website: honeypot,
        }),
      });
      if (!response.ok) throw new Error("Failed to submit");

      setIsSubmitted(true);
      onSubmitted?.();
    } catch {
      setErrors({
        form: "Could not submit right now. Please call or WhatsApp us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (invalid: boolean) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3.5 text-stone-900 outline-none placeholder:text-stone-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200 ${
      invalid ? "border-red-400" : "border-stone-200"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-lead-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close enquiry form"
      />

      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-stone-500 hover:bg-stone-100 hover:text-stone-800"
        >
          ×
        </button>

        {isSubmitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
              ✓
            </div>
            <h2
              id="quick-lead-title"
              className="mt-6 text-2xl font-bold text-stone-900"
            >
              Thank you, {name.trim().split(" ")[0]}!
            </h2>
            <p className="mt-3 text-stone-600">
              We have your details. Our team will contact you within 24 hours.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={buildWhatsAppUrl(
                  clientConfig.whatsapp,
                  `Hi ${clientConfig.name}, I just sent an enquiry for a plot in ${location.trim()}. My name is ${name.trim()}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600"
              >
                Chat on WhatsApp
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-stone-300 px-6 py-3 font-semibold text-stone-700 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 text-center sm:px-8">
              <h2
                id="quick-lead-title"
                className="text-2xl font-bold leading-tight text-stone-900 sm:text-3xl"
              >
                Let&apos;s plan your home
              </h2>
              <p className="mt-3 text-stone-600">
                Tell us about your plot and our team will get in touch within 24
                hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
              <div>
                <label htmlFor="ql-name" className="sr-only">
                  Full name
                </label>
                <input
                  id="ql-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name*"
                  aria-invalid={Boolean(errors.name) || undefined}
                  className={inputClass(Boolean(errors.name))}
                />
                {errors.name && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="ql-phone" className="sr-only">
                  Mobile number
                </label>
                <div
                  className={`flex overflow-hidden rounded-xl border bg-slate-50 focus-within:border-orange-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-200 ${
                    errors.phone ? "border-red-400" : "border-stone-200"
                  }`}
                >
                  <span className="flex shrink-0 items-center gap-2 border-r border-stone-200 bg-stone-100 px-3.5 text-stone-600">
                    <IndiaFlag />
                    +91
                  </span>
                  <input
                    id="ql-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile Number*"
                    aria-invalid={Boolean(errors.phone) || undefined}
                    className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-stone-900 outline-none placeholder:text-stone-400"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="ql-location" className="sr-only">
                  Location of your plot
                </label>
                <LocationInput
                  id="ql-location"
                  value={location}
                  onChange={setLocation}
                  placeholder="Location of your plot*"
                  invalid={Boolean(errors.location)}
                />
                {errors.location && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              {/* Honeypot. Off-screen rather than display:none, because some bots
                  skip fields hidden that way; people never reach it. */}
              <div aria-hidden="true" className="absolute -left-[9999px] top-0">
                <label htmlFor="ql-website">Website</label>
                <input
                  id="ql-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {errors.form && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {errors.form}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-orange-500 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Start Your Construction"}
              </button>

              <p className="text-xs leading-relaxed text-stone-500">
                <span className="text-orange-600">*</span> By submitting, you
                agree that {clientConfig.name} may contact you about your
                enquiry on the number provided.
              </p>
            </form>

            <ul className="mt-6 grid grid-cols-3 gap-2 border-t border-stone-100 pt-6 text-center">
              {trust.map((item) => (
                <li key={item.label} className="flex flex-col items-center">
                  <Icon name={item.icon} className="h-9 w-9 text-orange-500" />
                  <span className="mt-2 text-lg font-bold text-stone-800">
                    {item.value}
                  </span>
                  <span className="text-xs text-stone-500">{item.label}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
