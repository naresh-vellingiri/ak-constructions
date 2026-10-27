import Link from "next/link";
import Icon from "@/components/icons";

/**
 * Homepage banner advertising the client progress tracker.
 *
 * The phone is an AK-branded illustration supplied by the client, cropped to
 * just the handset (its original caption repeated this section's heading, and
 * said "APP" next to a bullet that says no app is needed).
 *
 * It is an illustration, not a screenshot of the live tracker. It shows tabs
 * the tracker does not have yet (site photos, finalized designs, material
 * selection) and a "days left" badge, so the copy beside it must only promise
 * what the real tracker does — stage progress and the site-engineer contact.
 */
const benefits = [
  "See your current stage and overall progress at a glance",
  "Every stage from foundation to handover, ticked off as it's done",
  "Your site engineer's name and number, one tap to call",
  "No app to install — opens in your phone's browser",
];

export default function TrackerBanner() {
  return (
    <section id="tracker" className="bg-stone-900 px-4 py-16 text-white lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
        {/* Phone illustration */}
        <div className="relative mx-auto w-full max-w-md md:order-2 md:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-[2.5rem] bg-orange-500/25 blur-2xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/tracker-app.webp"
            alt="AK Construction and Interiors project tracker on a phone, showing the current construction stage, a progress bar and a timeline of completed stages"
            width={980}
            height={965}
            loading="lazy"
            className="relative w-full rounded-3xl shadow-2xl ring-1 ring-white/15"
          />
        </div>

        {/* Copy */}
        <div className="md:order-1">
          <p className="inline-flex rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-1 text-sm font-medium text-orange-300">
            For our clients
          </p>
          <h2 className="mt-5 text-3xl font-bold leading-tight md:text-4xl">
            Track your site progress{" "}
            <span className="text-orange-400">any time</span>
          </h2>
          <p className="mt-4 max-w-lg text-lg text-stone-300">
            Sit back while we build your home. Log in with your mobile number to
            see exactly which stage your project is at — updated by our team as
            the work happens.
          </p>

          <ul className="mt-6 space-y-3 text-stone-300">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <Icon
                  name="check"
                  className="mt-0.5 h-5 w-5 shrink-0 text-orange-400"
                />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-full bg-orange-500 px-8 py-4 text-center text-base font-semibold text-white transition hover:bg-orange-600"
            >
              Login to Track
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-stone-600 px-8 py-4 text-center text-base font-semibold text-white transition hover:border-stone-400 hover:bg-stone-800"
            >
              Create Account
            </Link>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Existing clients: use the invite code we sent you on WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}
