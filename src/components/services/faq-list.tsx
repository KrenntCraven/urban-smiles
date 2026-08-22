import type { ServiceFaq } from "@/lib/services/types";

export function FaqList({ faqs }: { faqs: ServiceFaq[] }) {
  return (
    <ul className="mt-8 space-y-3">
      {faqs.map((faq) => (
        <li key={faq.question}>
          <details
            name="service-faq"
            className="group rounded-2xl bg-cream ring-1 ring-ink/10 transition-shadow open:shadow-lg open:shadow-ink/5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-6 py-5 font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal [&::-webkit-details-marker]:hidden">
              {faq.question}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-5 shrink-0 text-teal transition-transform group-open:rotate-180"
              >
                <path d="m6 9.5 6 6 6-6" />
              </svg>
            </summary>
            <p className="px-6 pb-6 leading-relaxed text-muted">{faq.answer}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
