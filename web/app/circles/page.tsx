"use client";

import { CircleCard } from "@/components/CircleCard";
import { LinkButton, NotConfigured } from "@/components/ui";
import { isConfigured } from "@/lib/contracts";
import { useCircleCount } from "@/lib/useCircle";

export default function Circles() {
  const { data: count, isLoading } = useCircleCount();
  const ids = count ? Array.from({ length: Number(count) }, (_, i) => count - BigInt(i)) : [];

  return (
    <div className="pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-light tracking-[-0.03em] text-white sm:text-5xl">Circles</h1>
        <LinkButton href="/create" variant="light">
          Start a circle
        </LinkButton>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {!isConfigured && <NotConfigured />}
        {isConfigured && !isLoading && ids.length === 0 && (
          <p className="text-white/85">No circles yet. Start the first one.</p>
        )}
        {ids.map((id) => (
          <CircleCard key={id.toString()} id={id} />
        ))}
      </div>
    </div>
  );
}
