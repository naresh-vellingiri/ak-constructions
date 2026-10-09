const steps = [
  {
    step: "01",
    title: "Free consultation",
    description:
      "Tell us about your plot or flat, your family's needs and your budget. We visit the site where needed to understand the space.",
  },
  {
    step: "02",
    title: "Design, estimate & approvals",
    description:
      "Receive floor plans, 3D views and a transparent quote based on area, package and scope — and support with your building plan approval.",
  },
  {
    step: "03",
    title: "Build with live updates",
    description:
      "Our site team builds to the agreed specification while you follow each stage online and speak directly to your site engineer.",
  },
  {
    step: "04",
    title: "Handover",
    description:
      "A final walkthrough and snag fixes before you move in — your home, ready to live in.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-stone-900 px-4 py-16 text-white lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
            Our process
          </p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            From first call to handover
          </h2>
          <p className="mt-4 text-lg text-stone-300">
            Four clear steps, so you always know what happens next.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <li
              key={item.step}
              className="relative rounded-2xl border border-stone-700 bg-stone-800/60 p-7 transition hover:border-orange-500/60"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">
                {item.step}
              </span>
              <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-300">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
