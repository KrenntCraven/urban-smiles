"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavigationLink = {
  label: string;
  href: string;
};

export function MobileNavigation({ links }: { links: NavigationLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setIsOpen((open) => !open)}
        className="flex size-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
          className="size-6"
        >
          {isOpen ? (
            <path d="m6 6 12 12M18 6 6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {isOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Mobile"
          className="absolute inset-x-0 top-full border-y border-ink/10 bg-cream px-4 py-4 shadow-xl shadow-ink/10 sm:px-6"
        >
          <ul className="mx-auto max-w-7xl space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-4 text-base font-semibold text-ink transition-colors hover:bg-sand/60 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2 sm:hidden">
              <Link
                href="/#book"
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 items-center justify-center rounded-full bg-teal px-6 text-base font-semibold text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                Book Now
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
