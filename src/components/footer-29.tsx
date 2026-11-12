"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

/*
 * Footer adapted from Watermelon's footer-29: warm surface, link columns, illustrated scene along the bottom.
 * Trimmed to what Baton has: no newsletter (there's no list to join) and no social links (no accounts to point at).
 */

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface Footer29Props {
  logo: ReactNode;
  brandName: string;
  tagline?: string;
  linkGroups: FooterLinkGroup[];
  backgroundImage?: string;
  note?: ReactNode;
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function Footer29({ logo, brandName, tagline, linkGroups, backgroundImage, note, className = "" }: Footer29Props) {
  return (
    <footer className={`relative w-full overflow-hidden bg-[#faede1] text-stone-800 ${className}`}>
      {backgroundImage && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[220px] w-full bg-cover bg-bottom bg-no-repeat sm:h-[340px] lg:h-[420px] 2xl:h-[560px]"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-16 pb-[220px] sm:px-6 sm:pb-[340px] lg:pt-20 lg:pb-[420px] 2xl:pb-[560px]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="flex flex-col justify-between gap-12 lg:flex-row lg:gap-24"
        >
          <motion.div variants={itemVariants} className="shrink-0 space-y-4 lg:w-[320px]">
            <div className="flex items-center gap-2">
              <span className="text-stone-900">{logo}</span>
              <span className="text-lg font-semibold tracking-wider uppercase">{brandName}</span>
            </div>
            {tagline && <p className="text-[15px] leading-relaxed text-stone-600">{tagline}</p>}
            {note && <p className="text-[13px] text-stone-500">{note}</p>}
          </motion.div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:max-w-md lg:gap-12">
            {linkGroups.map((group) => (
              <motion.div key={group.title} variants={itemVariants} className="space-y-5">
                <h4 className="text-xs font-semibold tracking-wider text-stone-500 uppercase">{group.title}</h4>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-stone-600 transition-colors hover:text-stone-900">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
