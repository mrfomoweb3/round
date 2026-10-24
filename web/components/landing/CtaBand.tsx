import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CtaBand() {
  return (
    <section className="pt-28 md:pt-36">
      <div className="relative overflow-hidden rounded-[2rem] bg-[url('/bg.png')] bg-[length:100%_160%] bg-top px-6 py-16 text-center sm:px-12 sm:py-20">
        <svg aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 text-white/10" viewBox="0 0 200 200" fill="none">
          {[90, 70, 50, 30].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} stroke="currentColor" strokeWidth="1.5" />
          ))}
        </svg>
        <svg aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 text-white/10" viewBox="0 0 200 200" fill="none">
          {[90, 60, 30].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} stroke="currentColor" strokeWidth="1.5" />
          ))}
        </svg>
        <h2 className="relative mx-auto max-w-2xl text-4xl font-light leading-[1.1] tracking-[-0.03em] text-white sm:text-5xl">
          Start a circle with your people today
        </h2>
        <p className="relative mx-auto mt-5 max-w-lg text-lg text-white/85">
          Pick an amount, share the link, and let Bitcoin keep everyone&apos;s promise.
        </p>
        <div className="relative mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-medium text-ink shadow-sm transition hover:bg-mint"
          >
            Start a circle <ArrowRight size={18} />
          </Link>
          <Link
            href="/circles"
            className="inline-flex items-center rounded-xl border border-white/40 bg-white/15 px-7 py-3.5 font-medium text-white backdrop-blur transition hover:bg-white/25"
          >
            Browse circles
          </Link>
        </div>
      </div>
    </section>
  );
}
