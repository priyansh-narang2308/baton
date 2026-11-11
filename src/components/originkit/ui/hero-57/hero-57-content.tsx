/* eslint-disable */
// @ts-nocheck
"use client";
// Originkit hero-57, adapted for Baton: our nav, copy and calls to action over the original sunset scene.
import Link from "next/link";
import { TryDemoButton } from "@/app/try-demo";
import SunsetVelocity from "@/components/originkit/ui/hero-57/sunset-velocity";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#roles", label: "Who it’s for" },
  { href: "#faq", label: "FAQ" },
];

export default function App({ error }: { error?: string }) {
  return (
    <section className="hero">
      <div className="hero-scene" aria-hidden>
        <SunsetVelocity
          background="#ffffff"
          skyTop="#F7D3C8"
          skyHorizon="#F4A493"
          advanced={{ sunX: 1, sunY: 61, sunSize: 90, vignette: 0, hazeColor: "#F6C2B4", hazeOpacity: 60, turbineFar: "#D49AA2", cloudColor: "#E7A0A2" }}
          style={{ minWidth: 0, minHeight: 0 }}
        />
      </div>
      <div className="hero-fade" />

      <header className="nav">
        <Link className="logo" href="/" aria-label="Baton home">
          {/* striped half-sun: echoes the sunset in the scene */}
          <svg viewBox="0 0 28 20" aria-hidden>
            <clipPath id="sun-bands">
              <rect width="28" height="9" />
              <rect y="11" width="28" height="3" />
              <rect y="16" width="28" height="2" />
            </clipPath>
            <circle cx="14" cy="18" r="13" clipPath="url(#sun-bands)" fill="currentColor" />
          </svg>
          Baton
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
      </header>

      <div className="hero-copy">
        {error && <p className="hero-error" role="alert">That link didn’t work ({error.replaceAll("-", " ")}).</p>}
        <p className="eyebrow">Real-time incident coordination for event crews</p>
        <h1>
          Every report <span>gets an</span> owner.
        </h1>
        <p>Attendees and volunteers report problems. Baton turns them into live incidents your crew can claim, and tells everyone who reported it when it’s fixed.</p>
        <div className="hero-actions">
          <TryDemoButton className="cta" errorClassName="hero-error">
            Try Baton live <span aria-hidden>→</span>
          </TryDemoButton>
          <Link className="cta-ghost" href="/new">
            Set up your event
          </Link>
        </div>
      </div>
    </section>
  );
}
