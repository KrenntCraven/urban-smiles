"use client";

import { useMemo, useState } from "react";
import { DentistCard } from "./dentist-card";
import { DentistProfileDialog } from "./dentist-profile-dialog";
import {
  dentistSpecialtyLabels,
  type Dentist,
  type DentistSpecialty,
} from "@/lib/team/types";

type FilterId = "all" | DentistSpecialty;

export function DentistDirectory({
  dentists,
  specialties,
}: {
  dentists: readonly Dentist[];
  specialties: readonly DentistSpecialty[];
}) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const filters: { id: FilterId; label: string }[] = [
    { id: "all", label: "All Specialists" },
    ...specialties.map((specialty) => ({
      id: specialty,
      label: dentistSpecialtyLabels[specialty],
    })),
  ];

  const visible = useMemo(
    () =>
      activeFilter === "all"
        ? dentists
        : dentists.filter((dentist) =>
            dentist.specialties.includes(activeFilter),
          ),
    [dentists, activeFilter],
  );

  const openDentist =
    dentists.find((dentist) => dentist.slug === openSlug) ?? null;

  return (
    <>
      <div
        role="group"
        aria-label="Filter dentists by specialty"
        className="flex flex-wrap gap-2 sm:gap-3"
      >
        {filters.map((filter) => {
          const isActive = filter.id === activeFilter;
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveFilter(filter.id)}
              className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
                isActive
                  ? "bg-ink text-cream"
                  : "border border-ink/20 text-ink hover:border-teal hover:text-teal"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-muted">
        Showing{" "}
        <span className="font-semibold text-ink tabular-nums">
          {visible.length}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-ink tabular-nums">
          {dentists.length}
        </span>{" "}
        specialists
      </p>

      <ul className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((dentist, index) => (
          <li key={dentist.slug}>
            <DentistCard
              dentist={dentist}
              priority={index < 3}
              onViewProfile={() => setOpenSlug(dentist.slug)}
            />
          </li>
        ))}
      </ul>

      <DentistProfileDialog
        dentist={openDentist}
        onClose={() => setOpenSlug(null)}
      />
    </>
  );
}
