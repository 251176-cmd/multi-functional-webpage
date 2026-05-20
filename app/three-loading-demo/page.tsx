import Link from "next/link";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Demo page that intentionally waits so the route segment `loading.tsx` is visible.
 */
export default async function ThreeLoadingDemoPage(): Promise<React.JSX.Element> {
  await sleep(2200);

  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold tracking-wider text-blue-600 uppercase">
          Demo
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Three.js 3D loading screen
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-700">
          This page intentionally pauses for ~2 seconds on navigation so you can
          see the 3D loader. Navigate away and back to replay it.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Back home
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-900 backdrop-blur transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Go to About
          </Link>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur sm:p-8">
          <p className="text-sm font-semibold text-slate-900">
            What’s included
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Three.js WebGL renderer mounted in a client component</li>
            <li>Reduced-motion friendly (animation pauses if enabled)</li>
            <li>Resize-aware canvas</li>
            <li>Proper cleanup to avoid WebGL context leaks</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

