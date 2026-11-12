"use client";

import { motion, MotionConfig, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/*
 * Motion for the marketing page only. Everything eases in once (fade + rise), never on every scroll, and respects
 * the visitor's "reduce motion" setting through MotionConfig.
 */

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};

const stagger = (gap = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

const tags = { div: motion.div, ol: motion.ol, ul: motion.ul, li: motion.li, p: motion.p, figure: motion.figure };
type Tag = keyof typeof tags;

/** Trigger once, a little before the element is fully on screen. */
const viewport = { once: true, margin: "0px 0px -10% 0px" } as const;

export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Fades and rises into place when scrolled into view. */
export function Reveal({ children, className, delay = 0, as = "div" }: { children: ReactNode; className?: string; delay?: number; as?: Tag }) {
  const M = tags[as];
  return (
    <M className={className} initial="hidden" whileInView="show" viewport={viewport} variants={{ hidden: fadeUp.hidden, show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE, delay } } }}>
      {children}
    </M>
  );
}

/** A group whose <StaggerItem> children arrive one after another when the group scrolls into view. */
export function Stagger({ children, className, gap, delay, as = "div", ...rest }: { children: ReactNode; className?: string; gap?: number; delay?: number; as?: Tag; "aria-label"?: string }) {
  const M = tags[as];
  return (
    <M className={className} initial="hidden" whileInView="show" viewport={viewport} variants={stagger(gap, delay)} {...rest}>
      {children}
    </M>
  );
}

export function StaggerItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: Tag }) {
  const M = tags[as];
  return (
    <M className={className} variants={fadeUp}>
      {children}
    </M>
  );
}
