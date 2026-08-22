import { ScrollPanel } from "@/components/motion/scroll-panel";
import { Hero } from "@/components/sections/hero";
import { Philosophy } from "@/components/sections/philosophy";
import { QuickBookingWidget } from "@/components/sections/quick-booking-widget";
import { ServicesShowcase } from "@/components/sections/services-showcase";
import { SocialProofGallery } from "@/components/sections/social-proof-gallery";
import { getServiceOptions } from "@/lib/services/catalog";
import { dentists } from "@/lib/team/roster";

export default function Home() {
  const bookingDentists = dentists.map(
    ({ slug, name, credential, role, branchId, defaultServiceSlug }) => ({
      slug,
      name,
      credential,
      role,
      branchId,
      defaultServiceSlug,
    }),
  );

  return (
    <>
      <ScrollPanel>
        <Hero />
      </ScrollPanel>
      <ScrollPanel>
        <Philosophy />
      </ScrollPanel>
      <ScrollPanel>
        <ServicesShowcase />
      </ScrollPanel>
      <ScrollPanel>
        <SocialProofGallery />
      </ScrollPanel>
      <ScrollPanel revealAmount={0.08}>
        <QuickBookingWidget
          services={getServiceOptions()}
          dentists={bookingDentists}
        />
      </ScrollPanel>
    </>
  );
}
