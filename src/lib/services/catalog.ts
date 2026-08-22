import type { Service, ServiceOption } from "./types";

export const services: readonly Service[] = [
  {
    slug: "routine-cleaning",
    name: "Routine Cleaning & Checkup",
    category: "preventive",
    tagline:
      "A thorough clean, a full oral health check, and a clear plan for what comes next.",
    detailedOverview: [
      "A routine cleaning removes the plaque and hardened tartar that brushing cannot reach, particularly along the gumline and between teeth. Left in place, that buildup is what turns into gum inflammation, persistent bad breath, and eventually decay.",
      "Every cleaning at Urban Smiles includes a full examination. We check each tooth, chart your gum pockets, and screen the soft tissue, so small problems get named while they are still inexpensive to fix.",
    ],
    highlights: [
      "Ultrasonic scaling and polish",
      "Full gum pocket charting",
      "Oral cancer screening",
      "Written findings you keep",
    ],
    recommendedFor: [
      "Anyone due for their six-month visit",
      "Patients noticing bleeding gums when brushing",
      "First-time patients establishing a baseline",
    ],
    procedureSteps: [
      {
        title: "Examination and charting",
        description:
          "We review your history, then examine each tooth and measure your gum pockets to record a baseline.",
        durationMinutes: 10,
      },
      {
        title: "Scaling",
        description:
          "An ultrasonic scaler lifts tartar from the tooth surface and just beneath the gumline. You will feel vibration and water, not scraping.",
        durationMinutes: 20,
      },
      {
        title: "Polish and fluoride",
        description:
          "A gentle polish removes surface staining, followed by a fluoride varnish to strengthen enamel.",
        durationMinutes: 10,
      },
      {
        title: "Findings and plan",
        description:
          "We walk you through what we found, what needs attention now, and what can safely wait.",
        durationMinutes: 10,
      },
    ],
    pricing: {
      currency: "PHP",
      from: 1500,
      to: 2500,
      note: "Includes examination and fluoride. HMO cards accepted.",
    },
    duration: { minMinutes: 45, maxMinutes: 60, visits: 1 },
    faqs: [
      {
        question: "Will the cleaning hurt?",
        answer:
          "For most patients it is uncomfortable at worst, usually around inflamed gum tissue. Tell us if you are sensitive and we can apply a topical numbing gel before we start.",
      },
      {
        question: "How often should I come in?",
        answer:
          "Every six months suits most people. If you smoke, are pregnant, or have a history of gum disease, we will usually recommend every three to four months.",
      },
      {
        question: "My gums bled during brushing. Should I wait until it stops?",
        answer:
          "No. Bleeding gums are the main sign that a cleaning is overdue, not a reason to postpone one.",
      },
    ],
    relatedSlugs: ["teeth-whitening", "dental-implants"],
  },
  {
    slug: "teeth-whitening",
    name: "Professional Teeth Whitening",
    category: "cosmetic",
    tagline:
      "In-clinic whitening that lifts years of coffee, tea, and wine staining in a single sitting.",
    detailedOverview: [
      "In-clinic whitening uses a professional-strength gel activated under controlled light, supervised the entire time. That is the difference between a predictable result and the uneven patches that over-the-counter kits often leave behind.",
      "We shade-match before and after, so the change is measured rather than guessed at. Most patients lift several shades in one appointment.",
    ],
    highlights: [
      "Several shades in one visit",
      "Gum barrier applied throughout",
      "Before and after shade matching",
      "Custom take-home trays included",
    ],
    recommendedFor: [
      "Staining from coffee, tea, wine, or tobacco",
      "Anyone with an event coming up",
      "Patients whose natural shade has yellowed with age",
    ],
    procedureSteps: [
      {
        title: "Shade assessment",
        description:
          "We record your starting shade against a reference guide and confirm whitening is right for your enamel.",
        durationMinutes: 15,
      },
      {
        title: "Pre-treatment clean",
        description:
          "Surface film is polished away so the gel contacts enamel evenly. Whitening over plaque gives patchy results.",
        durationMinutes: 15,
      },
      {
        title: "Gum protection",
        description:
          "A resin barrier is placed along the gumline to keep the gel entirely on the teeth.",
        durationMinutes: 10,
      },
      {
        title: "Gel application cycles",
        description:
          "The gel is applied in timed cycles, rinsed and reapplied, with sensitivity checked between each round.",
        durationMinutes: 45,
      },
      {
        title: "Final shade and aftercare",
        description:
          "We record the new shade, fit your take-home trays, and go through the foods to avoid for 48 hours.",
        durationMinutes: 15,
      },
    ],
    pricing: {
      currency: "PHP",
      from: 12000,
      to: 18000,
      note: "Includes custom take-home trays and one top-up syringe.",
    },
    duration: { minMinutes: 90, maxMinutes: 120, visits: 1 },
    faqs: [
      {
        question: "How long do the results last?",
        answer:
          "Typically one to two years, depending on diet and smoking. The take-home trays let you top up rather than repeat the full treatment.",
      },
      {
        question: "Will it work on crowns or veneers?",
        answer:
          "No. Whitening only changes natural enamel. If you have restorations in your smile line, we will plan the shade around them so everything still matches.",
      },
      {
        question: "Is sensitivity normal afterwards?",
        answer:
          "Mild sensitivity to cold for 24 to 48 hours is common and expected. We include desensitising gel, and it settles on its own.",
      },
    ],
    relatedSlugs: ["routine-cleaning", "invisalign-clear-aligners"],
  },
  {
    slug: "dental-implants",
    name: "Dental Implants",
    category: "surgical",
    tagline:
      "A permanent replacement for a missing tooth, anchored into the jaw so it bites like the original.",
    detailedOverview: [
      "An implant replaces the root of a missing tooth with a titanium post placed into the jawbone. Once the bone has fused to it, a custom crown is fitted on top. Unlike a bridge, nothing is ground down on the neighbouring teeth.",
      "The trade-off is time. Bone integration cannot be rushed, so the full process runs across several months, with only the surgical placement requiring recovery.",
      "Implants also preserve the jawbone. Bone under a gap recedes over the years, which is what gradually changes the shape of the face after tooth loss.",
    ],
    highlights: [
      "3D CBCT scan before placement",
      "Titanium post with lifetime warranty",
      "Neighbouring teeth left untouched",
      "Sedation available",
    ],
    recommendedFor: [
      "A single missing tooth or several gaps",
      "Denture wearers wanting a fixed alternative",
      "Patients with adequate jawbone density",
    ],
    procedureSteps: [
      {
        title: "Consultation and 3D scan",
        description:
          "A CBCT scan maps your bone volume and the position of nerves and sinuses, which determines whether a graft is needed first.",
        durationMinutes: 45,
      },
      {
        title: "Implant placement",
        description:
          "Under local anaesthetic, the titanium post is placed into the jaw and the site is closed. Most patients describe it as easier than an extraction.",
        durationMinutes: 90,
      },
      {
        title: "Osseointegration",
        description:
          "The bone fuses to the implant over three to six months. You wear a temporary restoration and carry on normally.",
      },
      {
        title: "Abutment and impression",
        description:
          "Once fused, the connector is fitted and a digital scan is taken so the crown matches your bite and shade.",
        durationMinutes: 45,
      },
      {
        title: "Crown fitting",
        description:
          "The permanent crown is seated and adjusted until the bite feels level and nothing catches when you chew.",
        durationMinutes: 60,
      },
    ],
    pricing: {
      currency: "PHP",
      from: 40000,
      to: 55000,
      unit: "per implant",
      note: "Includes post, abutment, and crown. Bone grafting quoted separately.",
    },
    duration: { minMinutes: 45, maxMinutes: 90, visits: 4 },
    faqs: [
      {
        question: "How long does the whole process take?",
        answer:
          "Usually four to nine months from first consultation to final crown. Most of that is bone healing, not appointments — you will be in the clinic four or five times.",
      },
      {
        question: "Is the surgery painful?",
        answer:
          "The placement itself is done under local anaesthetic and is not painful. Expect two to three days of soreness afterwards, manageable with standard pain relief.",
      },
      {
        question: "What if I do not have enough bone?",
        answer:
          "A bone graft can rebuild the site before the implant goes in. The CBCT scan at your consultation tells us whether this applies, and we quote it before you commit.",
      },
      {
        question: "How long do implants last?",
        answer:
          "The post is designed to be permanent and carries a lifetime warranty. The crown on top typically needs replacing after 10 to 15 years of wear.",
      },
    ],
    relatedSlugs: ["routine-cleaning", "invisalign-clear-aligners"],
  },
  {
    slug: "invisalign-clear-aligners",
    name: "Invisalign Clear Aligners",
    category: "orthodontics",
    tagline:
      "Straighten your teeth with removable aligners instead of fixed brackets and wires.",
    detailedOverview: [
      "Clear aligners move teeth in small increments using a series of custom trays, each worn for one to two weeks. They are removable, so you eat and brush normally, and they are close to invisible at conversational distance.",
      "We plan the entire movement digitally before the first tray is made, which means you see a simulation of your finished result at the consultation rather than at the end.",
      "Aligners suit mild to moderate crowding, spacing, and bite issues. Complex cases are sometimes better served by fixed braces, and we will tell you plainly if that is you.",
    ],
    highlights: [
      "Digital preview before you commit",
      "Removable for meals and cleaning",
      "Fewer clinic visits than fixed braces",
      "Retainers included at completion",
    ],
    recommendedFor: [
      "Mild to moderate crowding or spacing",
      "Adults who do not want visible brackets",
      "Relapse after previous orthodontic work",
    ],
    procedureSteps: [
      {
        title: "Digital scan and assessment",
        description:
          "An intraoral scan captures your bite in three dimensions. No impression trays.",
        durationMinutes: 45,
      },
      {
        title: "Treatment simulation",
        description:
          "We map every planned movement and show you the projected outcome and timeline before anything is manufactured.",
        durationMinutes: 30,
      },
      {
        title: "Fitting your first trays",
        description:
          "Attachments are bonded where extra grip is needed, and we check the fit of your first aligner set.",
        durationMinutes: 60,
      },
      {
        title: "Progress reviews",
        description:
          "Every six to eight weeks we confirm teeth are tracking to plan and hand over your next sets of trays.",
        durationMinutes: 20,
      },
      {
        title: "Retention",
        description:
          "Once aligned, custom retainers hold the result. Teeth drift back without them.",
        durationMinutes: 30,
      },
    ],
    pricing: {
      currency: "PHP",
      from: 120000,
      to: 300000,
      note: "Lighter cases sit near the lower end; comprehensive treatment reaches the upper. 0% installment plans available over 12 to 24 months.",
    },
    duration: { minMinutes: 20, maxMinutes: 60, visits: 8 },
    faqs: [
      {
        question: "How many hours a day do I need to wear them?",
        answer:
          "Twenty to twenty-two hours, removed only for eating and brushing. This is the single biggest factor in whether treatment finishes on schedule.",
      },
      {
        question: "How long will treatment take?",
        answer:
          "Mild cases finish in six to nine months; moderate cases run twelve to eighteen. You will get a specific projection at your simulation, not a guess.",
      },
      {
        question: "Will it affect my speech?",
        answer:
          "A slight lisp is common for the first few days while your tongue adjusts, then it disappears.",
      },
    ],
    relatedSlugs: ["teeth-whitening", "routine-cleaning"],
  },
];

const serviceBySlug = new Map(services.map((service) => [service.slug, service]));

export function getServiceBySlug(slug: string): Service | undefined {
  return serviceBySlug.get(slug);
}

export function isServiceSlug(slug: string): boolean {
  return serviceBySlug.has(slug);
}

export function getAllServiceSlugs(): string[] {
  return services.map((service) => service.slug);
}

export function getServiceOptions(): ServiceOption[] {
  return services.map(({ slug, name }) => ({ slug, name }));
}

export function getRelatedServices(service: Service): Service[] {
  return service.relatedSlugs
    .map((slug) => serviceBySlug.get(slug))
    .filter((related): related is Service => related !== undefined);
}
