"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR = "[data-parallax]";

type Layer = {
  element: HTMLElement;
  top: number;
  height: number;
  distance: number;
};

export function ParallaxController() {
  const pathname = usePathname();

  useEffect(() => {
    if (
      !window.matchMedia(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      ).matches
    ) {
      return;
    }

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(SELECTOR),
    );
    if (elements.length === 0) return;

    let layers: Layer[] = [];
    let frame = 0;

    // Geometry is cached so the scroll loop never reads layout. Offsets are
    // cleared first, otherwise each measurement inherits the previous one.
    const measure = () => {
      for (const element of elements) {
        element.style.setProperty("--parallax-y", "0px");
      }

      layers = elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          top: rect.top + window.scrollY,
          height: rect.height,
          distance: Number(element.dataset.parallaxDistance ?? 32),
        };
      });

      apply();
    };

    const apply = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const viewportCenter = window.scrollY + viewportHeight / 2;

      for (const layer of layers) {
        const layerCenter = layer.top + layer.height / 2;
        const progress =
          (viewportCenter - layerCenter) / (viewportHeight + layer.height);
        const limit = Math.abs(layer.distance);
        const offset = Math.max(
          -limit,
          Math.min(limit, progress * layer.distance * 2),
        );

        layer.element.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
      }
    };

    const requestUpdate = () => {
      if (frame === 0) frame = requestAnimationFrame(apply);
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.body);

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", measure);
      if (frame !== 0) cancelAnimationFrame(frame);

      for (const element of elements) {
        element.style.removeProperty("--parallax-y");
      }
    };
  }, [pathname]);

  return null;
}
