"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Snapping is delegated to the compositor via `scroll-snap-type` on `html`, so
 * it stays continuous with the browser's own momentum. The snap area sits on
 * the untransformed wrapper; the reveal transform belongs to the inner element
 * so it can never shift the snap target.
 */
export function ScrollPanel({
  children,
  revealAmount = 0.15,
}: {
  children: ReactNode;
  /**
   * Keep this low. A section taller than `viewport / revealAmount` can never
   * reach the threshold, and `once: true` would leave it invisible for good.
   */
  revealAmount?: number | "some" | "all";
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="snap-start">
      <motion.div
        data-reveal
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: revealAmount }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 120, damping: 22, mass: 0.9 }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
