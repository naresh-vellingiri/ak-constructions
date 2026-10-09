import Icon, { type IconName } from "@/components/icons";
import { clientConfig } from "@/config/client";

type AboutProps = {
  onGetQuote: () => void;
};

/**
 * Each pillar maps to something the product genuinely does today — published
 * packages, the client progress tracker, the design-plus-build service range and
 * the areas with real projects — rather than generic "quality and trust"
 * boilerplate. If one stops being true, change it here.
 */
const pillars: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "tag",
    title: "Pricing you can read",
    text: "We publish our package rates and what each one includes, so you can compare before you ever pick up the phone.",
  },
  {
    icon: "eye",
    title: "Progress you can follow",
    text: "Log in with your mobile number to see each stage of your build and call your site engineer directly.",
  },
  {
    icon: "users",
    title: "One team, start to finish",
    text: "Design, construction and interiors under one roof, so nothing falls between separate contractors.",
  },
  {
    icon: "pin",
    title: `Rooted in ${clientConfig.city}`,
    text: `Projects across ${clientConfig.serviceAreas.join(", ")}.`,
  },
];

export default function About({ onGetQuote }: AboutProps) {
  return (
    <section id="about" className="bg-white px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Photo with the experience badge. Real project photo, not stock. */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -left-3 -top-3 h-full w-full rounded-3xl border-2 border-orange-200 lg:-left-4 lg:-top-4"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/gallery/home-exterior-1.webp"
            alt={`A home built by ${clientConfig.name} in ${clientConfig.city}`}
            width={1050}
            height={1400}
            loading="lazy"
            className="relative aspect-[4/5] w-full rounded-3xl object-cover shadow-2xl"
          />
          <div className="absolute -bottom-6 right-4 rounded-2xl bg-orange-500 px-6 py-5 text-center text-white shadow-xl lg:-right-6">
            <p className="text-4xl font-bold leading-none">
              {clientConfig.stats.yearsExperience}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider">
              Years of
              <br />
              experience
            </p>
          </div>
        </div>

        <div className="mt-6 lg:mt-0">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
            About us
          </p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-stone-900 md:text-4xl">
            One team for your design, your build and your handover
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-stone-600">
            {clientConfig.name} designs and builds homes in {clientConfig.city}.
            Whether you are starting from an empty plot, renovating a house you
            already own, or finishing the interiors of a new flat, the same team
            looks after it from the first sketch to the final walkthrough.
          </p>
          <p className="mt-4 leading-relaxed text-stone-600">
            That means one person to call, one schedule to follow and no
            finger-pointing between contractors if something needs fixing.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Icon name={pillar.icon} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{pillar.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    {pillar.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onGetQuote}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-orange-600"
          >
            Get a free estimate
            <Icon name="arrow" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
