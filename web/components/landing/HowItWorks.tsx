import { HandCoins, LockKeyhole, PenLine, ShieldCheck, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./Section";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: LockKeyhole, title: "Join and lock BTC", body: "Lock Bitcoin worth 150% of what you could owe. Mezo's price feed sizes it live." },
  { icon: PenLine, title: "Pay each round", body: "Pay the same MUSD amount every round with one signature. No separate approval." },
  { icon: HandCoins, title: "Take the pot", body: "When your turn comes, you receive the whole pot. Payout order is join order." },
  { icon: ShieldCheck, title: "Stay protected", body: "If anyone misses a payment, their locked BTC pays it, plus a 10% penalty to the group." },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 pt-28 md:pt-36">
      <SectionHeading
        eyebrow="How it works"
        title="A savings circle, with Bitcoin as the guarantee"
        lead="The circle your community already knows. Everyone pays in, one person takes the pot each round, and locked BTC replaces blind trust."
      />
      <ol className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div aria-hidden className="absolute left-[12%] right-[12%] top-[52px] hidden border-t-2 border-dashed border-leaf/30 lg:block" />
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="relative rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(15,61,28,0.08)]">
            <div className="flex items-center justify-between">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-forest text-leaf-light">
                <Icon size={26} strokeWidth={1.75} />
              </span>
              <span className="text-sm font-semibold text-forest/40">0{i + 1}</span>
            </div>
            <h3 className="mt-6 text-lg font-semibold">{title}</h3>
            <p className="mt-2 leading-relaxed text-stone-600">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
