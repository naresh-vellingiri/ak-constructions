import Link from "next/link";
import Icon from "@/components/icons";
import { clientConfig } from "@/config/client";
import { services } from "@/content/services";

type FooterProps = {
  /** Mirrors the header: only link to #packages when something is published. */
  showPackagesLink?: boolean;
};

export default function Footer({ showPackagesLink }: FooterProps) {
  const explore = [
    { label: "About us", href: "#about" },
    { label: "Our projects", href: "#gallery" },
    { label: "Services", href: "#services" },
    ...(showPackagesLink ? [{ label: "Packages", href: "#packages" }] : []),
    { label: "Our process", href: "#how-it-works" },
    { label: "Reviews", href: "#reviews" },
  ];

  return (
    <footer id="contact" className="bg-stone-950 px-4 pt-16 text-stone-400 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-xl font-bold text-white">{clientConfig.name}</h3>
          <p className="mt-4 text-sm leading-relaxed">
            Homes designed and built in {clientConfig.city}. Construction,
            interiors and renovation from one team.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-stone-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-orange-500 hover:text-orange-400"
          >
            Track your project
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>

        <div>
          <h4 className="font-semibold text-white">Explore</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {explore.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition hover:text-orange-400">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white">Services</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {services.map((service) => (
              <li key={service.title}>
                <a
                  href="#services"
                  className="transition hover:text-orange-400"
                >
                  {service.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white">Get in touch</h4>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <Icon name="phone" className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
              <a
                href={`tel:${clientConfig.phone.replace(/\s/g, "")}`}
                className="transition hover:text-white"
              >
                {clientConfig.phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="mail" className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
              <a
                href={`mailto:${clientConfig.email}`}
                className="break-all transition hover:text-white"
              >
                {clientConfig.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="pin" className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
              <span>
                {clientConfig.address.street}, {clientConfig.address.locality},{" "}
                {clientConfig.city} – {clientConfig.address.postalCode}
                <span className="mt-1 block text-stone-500">
                  Serving {clientConfig.serviceAreas.join(", ")}
                </span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-7xl flex-col items-center justify-between gap-2 border-t border-stone-800 py-6 text-sm text-stone-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {clientConfig.name}. All rights reserved.
        </p>
        <Link href="/login" className="transition hover:text-orange-400">
          Client login
        </Link>
      </div>
    </footer>
  );
}
