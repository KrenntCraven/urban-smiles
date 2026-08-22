import Link from "next/link";
import { MobileNavigation } from "@/components/mobile-navigation";

/**
 * Root-relative, never bare `#hash`: the header renders on every route, and a
 * bare fragment resolves against the current URL, so it dead-ends anywhere but
 * `/`. Only add an entry once the matching section exists on the home page.
 */
const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Dentists", href: "/dentists" },
  { label: "About", href: "/#philosophy" },
  { label: "Reviews", href: "/#reviews" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/85 backdrop-blur-md">
      <a
        href="tel:+63288888888"
        className="flex h-9 items-center justify-center gap-2 bg-teal px-4 text-xs font-semibold text-cream transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cream"
      >
        <span>Dental emergency?</span>
        <span className="tabular-nums">(02) 8888-8888</span>
      </a>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-5 sm:px-6">
        <Link
          href="/"
          className="shrink-0 font-display text-base font-semibold tracking-[0.16em] text-ink uppercase sm:text-lg sm:tracking-[0.2em]"
        >
          Urban Smiles
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-teal"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/#book"
            className="hidden min-h-11 items-center rounded-full bg-teal px-5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:inline-flex"
          >
            Book Now
          </Link>
          <MobileNavigation links={navLinks} />
        </div>
      </div>
    </header>
  );
}
