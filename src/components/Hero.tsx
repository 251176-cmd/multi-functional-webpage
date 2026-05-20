"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export type HeroCta = {
  label: string;
  href: string;
};

export type HeroProps = {
  name: string;
  tagline: string;
  description: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
};

function buildVariants(shouldReduceMotion: boolean): {
  container: Variants;
  item: Variants;
  subtleFloat: Variants;
} {
  // Intent: Keep motion gentle and optional for accessibility.
  if (shouldReduceMotion) {
    return {
      container: { hidden: { opacity: 0 }, show: { opacity: 1 } },
      item: { hidden: { opacity: 0 }, show: { opacity: 1 } },
      subtleFloat: { initial: { opacity: 1 }, animate: { opacity: 1 } },
    };
  }

  return {
    container: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
      },
    },
    item: {
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    },
    subtleFloat: {
      initial: { opacity: 1 },
      animate: {
        opacity: 1,
        y: [0, -6, 0],
        transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      },
    },
  };
}

export default function Hero({
  name,
  tagline,
  description,
  primaryCta,
  secondaryCta,
}: HeroProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const variants = React.useMemo(
    () => buildVariants(shouldReduceMotion),
    [shouldReduceMotion],
  );

  return (
    <section className="relative overflow-hidden border-b border-gray-200 bg-white">
      {/* Decorative background (kept subtle and flat) */}
      <motion.div
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl"
        variants={variants.subtleFloat}
        initial="initial"
        animate="animate"
        aria-hidden="true"
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-100/70 blur-3xl"
        variants={variants.subtleFloat}
        initial="initial"
        animate="animate"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <motion.div
          variants={variants.container}
          initial="hidden"
          animate="show"
          className="grid items-center gap-10 lg:grid-cols-12"
        >
          <div className="lg:col-span-7">
            <motion.p
              variants={variants.item}
              className="text-sm font-semibold tracking-wider text-blue-600 uppercase"
            >
              Personal blog
            </motion.p>

            <motion.h1
              variants={variants.item}
              className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
            >
              Hi, I’m <span className="text-blue-600">{name}</span>.
              <br className="hidden sm:block" /> {tagline}
            </motion.h1>

            <motion.p
              variants={variants.item}
              className="mt-5 max-w-2xl text-base leading-relaxed text-gray-700 sm:text-lg"
            >
              {description}
            </motion.p>

            <motion.div
              variants={variants.item}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href={primaryCta.href}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {primaryCta.label}
              </Link>

              {secondaryCta ? (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {secondaryCta.label}
                </Link>
              ) : null}
            </motion.div>
          </div>

          {/* Simple “preview card” that matches PostCard styling (no shadow) */}
          <motion.div
            variants={variants.item}
            className="lg:col-span-5"
            aria-hidden="true"
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600" />
                <div className="flex-1">
                  <div className="h-3 w-28 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-40 rounded bg-gray-100" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-11/12 rounded bg-gray-100" />
                <div className="h-3 w-9/12 rounded bg-gray-100" />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-9 w-24 rounded-xl bg-blue-50" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

