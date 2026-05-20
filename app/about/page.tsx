import Link from "next/link";
import ThreeAboutHero from "@/src/components/ThreeAboutHero";

/**
 * About Page
 *
 * Purpose:
 * - Provide a polished “About” landing page for the `/about` route.
 *
 * Inputs:
 * - None (static page).
 *
 * Outputs:
 * - A responsive page describing the author/site plus clear next actions.
 *
 * Side effects:
 * - None.
 */
export default function AboutPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-transparent">
      {/* Purpose: Page hero with a clear identity statement. */}
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -bottom-40 left-[-12rem] h-[30rem] w-[30rem] rounded-full bg-violet-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-sm font-semibold tracking-wider text-blue-600 uppercase">
                About
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Building clean, modern experiences—
                <span className="text-blue-600"> one detail at a time</span>.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700 sm:text-lg">
                This site is a starter template for a personal blog / product
                space built with Next.js (App Router), TypeScript, Tailwind CSS,
                and a lightweight “online chat” experience.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Back to home
                </Link>
                <a
                  href="#values"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-900 backdrop-blur transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  What I value
                </a>
              </div>
            </div>

            {/* Purpose: A flat “profile” card that matches the rest of the UI. */}
            <div className="lg:col-span-5">
              <ThreeAboutHero className="mt-4 sm:mt-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Purpose: Values section for credibility + clarity. */}
      <section
        id="values"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            What I value
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            A few principles that guide how I build and write.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-slate-900">Clarity</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Interfaces should explain themselves—good defaults, helpful
              language, and obvious next steps.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-slate-900">Speed</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Fast pages feel “expensive”. I optimize the critical path and keep
              UI lightweight.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
            <p className="text-sm font-semibold text-slate-900">Craft</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Small details compound: spacing, typography, accessibility, and
              consistency across screens.
            </p>
          </div>
        </div>

        {/* Purpose: Friendly CTA to keep users moving. */}
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur sm:p-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-base font-semibold text-slate-900">
                Want to see the template in action?
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Browse the latest posts, or open chat for quick help.
              </p>
            </div>
            <Link
              href="/#latest"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              View latest posts
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

