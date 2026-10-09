import Icon from "@/components/icons";
import { buildWhatsAppUrl } from "@/lib/utils";
import { clientConfig } from "@/config/client";

type CtaBandProps = {
  onGetQuote: () => void;
};

/** Closing call-to-action, placed after the reviews and just above the footer. */
export default function CtaBand({ onGetQuote }: CtaBandProps) {
  return (
    <section className="bg-gradient-to-br from-orange-500 to-orange-700 px-4 py-16 text-white lg:px-8 lg:py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold leading-tight md:text-4xl">
          Ready to plan your home?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-orange-50">
          Share a few details about your plot or flat and we&apos;ll come back
          with an estimate and arrange a site visit.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onGetQuote}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-orange-700 shadow-lg transition hover:bg-stone-100 sm:w-auto"
          >
            Get a free estimate
            <Icon name="arrow" className="h-5 w-5" />
          </button>
          <a
            href={`tel:${clientConfig.phone.replace(/\s/g, "")}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/70 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
          >
            <Icon name="phone" className="h-5 w-5" />
            {clientConfig.phone}
          </a>
        </div>

        <p className="mt-6 text-sm text-orange-100">
          Prefer WhatsApp?{" "}
          <a
            href={buildWhatsAppUrl(
              clientConfig.whatsapp,
              `Hi ${clientConfig.name}, I'd like to discuss a project.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-4 hover:text-white"
          >
            Message us
          </a>
        </p>
      </div>
    </section>
  );
}
