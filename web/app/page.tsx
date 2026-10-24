"use client";

import { HeroCard } from "@/components/HeroCard";
import { Communities } from "@/components/landing/Communities";
import { CtaBand } from "@/components/landing/CtaBand";
import { Facts } from "@/components/landing/Facts";
import { Faq } from "@/components/landing/Faq";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Protection } from "@/components/landing/Protection";
import { LinkButton } from "@/components/ui";
import { DEMO_CIRCLE_ID, isConfigured } from "@/lib/contracts";
import { useCircleCount } from "@/lib/useCircle";

export default function Home() {
  const { data: count } = useCircleCount();
  const featured = DEMO_CIRCLE_ID ?? (count && count > 0n ? count : undefined);

  return (
    <>
      <section className="grid items-center gap-12 pt-10 md:grid-cols-[1.5fr_1fr] md:pt-16">
        <div>
          <h1 className="text-5xl font-light leading-[1.08] tracking-[-0.035em] text-white sm:text-6xl lg:text-[3.35rem] xl:text-[3.4rem]">
            Save together in dollars. <br className="hidden lg:block" />
            Keep your Bitcoin.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
            Savings circles where everyone pays the same MUSD each round and one person takes the pot. Your locked BTC is
            the promise: if someone stops paying, their Bitcoin covers it.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <LinkButton href="/circles" variant="light">
              Join a circle
            </LinkButton>
            <LinkButton href="/create" variant="ghost">
              Start a circle
            </LinkButton>
          </div>
        </div>

        <div>
          <HeroCard id={isConfigured ? featured : undefined} />
        </div>
      </section>

      <HowItWorks />
      <Facts />
      <Features />
      <Protection />
      <Communities />
      <Faq />
      <CtaBand />
    </>
  );
}

