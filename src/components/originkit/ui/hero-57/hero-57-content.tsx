/* eslint-disable */
// @ts-nocheck
"use client";
// Originkit hero-57, adapted for Baton: our nav, copy and calls to action over the original sunset scene,
// with a staged entrance (Framer Motion) and a compact nav that follows you down the page.
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { TryDemoButton } from "@/app/try-demo";
import { EASE } from "@/components/landing-motion";
import SunsetVelocity from "@/components/originkit/ui/hero-57/sunset-velocity";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#roles", label: "Who it’s for" },
  { href: "#faq", label: "FAQ" },
];

const HEADLINE: { text: string; muted?: boolean }[] = [
  { text: "Every" },
  { text: "report" },
  { text: "gets", muted: true },
  { text: "an", muted: true },
  { text: "owner." },
];

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE, delay },
});

function Logo() {
  return (
    <>
      {/* striped half-sun: echoes the sunset in the scene */}
      <svg viewBox="0 0 28 20" aria-hidden>
        <clipPath id="sun-bands">
          <rect width="28" height="9" />
          <rect y="11" width="28" height="3" />
          <rect y="16" width="28" height="2" />
        </clipPath>
        <circle
          cx="14"
          cy="18"
          r="13"
          clipPath="url(#sun-bands)"
          fill="currentColor"
        />
      </svg>
      Baton
    </>
  );
}

/** Compact nav that slides in once the hero has scrolled away, so section links stay one click away. */
function FloatingNav() {
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) =>
    setShow(y > window.innerHeight * 0.75),
  );
  return (
    <AnimatePresence>
      {show && (
        <motion.header
          className="float-nav"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <a className="logo" href="#top" aria-label="Back to top">
            <Logo />
          </a>
          <nav aria-label="Sections">
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <Link className="btn" href="/new">
            Create an event
          </Link>
        </motion.header>
      )}
    </AnimatePresence>
  );
}

export default function App({ error }: { error?: string }) {
  return (
    <section className="hero" id="top">
      {/* The outer div keeps the CSS centring transform on phones; motion animates only the inner wrapper. */}
      <div className="hero-scene" aria-hidden>
        <motion.div
          style={{ width: "100%", height: "100%" }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.1 }}
        >
          <SunsetVelocity
            background="#ffffff"
            skyTop="#F7D3C8"
            skyHorizon="#F4A493"
            advanced={{
              sunX: 1,
              sunY: 61,
              sunSize: 90,
              vignette: 0,
              hazeColor: "#F6C2B4",
              hazeOpacity: 60,
              turbineFar: "#D49AA2",
              cloudColor: "#E7A0A2",
            }}
            style={{ minWidth: 0, minHeight: 0 }}
          />
        </motion.div>
      </div>
      <div className="hero-fade" />

      <motion.header
        className="nav"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <Link className="logo" href="/" aria-label="Baton home">
          <Logo />
        </Link>
        <nav aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <Link className="btn" href="/new">
          Create an event
        </Link>
      </motion.header>

      <div className="hero-copy">
        {error && (
          <p className="hero-error" role="alert">
            That link didn’t work ({error.replaceAll("-", " ")}).
          </p>
        )}
        <motion.p className="eyebrow" {...rise(0.15)}>
          Real-time incident coordination for event crews
        </motion.p>
        <h1 aria-label="Every report gets an owner.">
          {HEADLINE.map((w, k) => (
            <motion.span
              key={k}
              aria-hidden
              className={w.muted ? "word muted" : "word"}
              initial={{ opacity: 0, y: "0.35em", filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.3 + k * 0.09 }}
            >
              {w.text}
            </motion.span>
          ))}
        </h1>
        <motion.p {...rise(0.8)}>
          Attendees and volunteers report problems. Baton turns them into live
          incidents your crew can claim, and tells everyone who reported it when
          it’s fixed.
        </motion.p>
        <motion.div className="hero-actions" {...rise(0.95)}>
          <TryDemoButton className="cta" errorClassName="hero-error">
            Try Baton live <span aria-hidden>→</span>
          </TryDemoButton>
          <Link className="cta-ghost" href="/new">
            Set up your event
          </Link>
        </motion.div>
      </div>

      <FloatingNav />
    </section>
  );
}
