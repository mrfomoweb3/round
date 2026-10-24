import { Bitcoin, CircleDollarSign, Eye, KeyRound, PenLine, Scale, Zap, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./Section";

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: CircleDollarSign, title: "Save in dollars", body: "Every payment and payout is in MUSD, Mezo's Bitcoin-backed dollar." },
  { icon: PenLine, title: "One signature to pay", body: "MUSD supports permit, so paying is one signature and one transaction." },
  { icon: KeyRound, title: "Nobody in charge", body: "No owner, no admin keys, no upgrades. The rules are the contract." },
  { icon: Zap, title: "Anyone can settle", body: "When a round is due, any member can trigger the payout. No keeper needed." },
  { icon: Eye, title: "Every move on-chain", body: "Joins, payments, payouts and defaults are public events you can verify." },
  { icon: Scale, title: "Fair to honest members", body: "A defaulter's penalty is shared with everyone who kept their promise." },
];

export function Features() {
  return (
    <section className="pt-28 md:pt-36">
      <SectionHeading
        eyebrow="Why Round"
        title="Built so the circle keeps its promise"
        lead="Traditional circles break when someone takes the pot early and stops paying. Round removes that risk without adding a middleman."
      />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-forest p-8 text-white lg:row-span-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-leaf-light">
            <Bitcoin size={28} strokeWidth={1.75} />
          </span>
          <h3 className="mt-6 text-2xl font-semibold">Your Bitcoin stays yours</h3>
          <p className="mt-3 leading-relaxed text-white/75">
            You never sell your BTC to save in dollars. It sits in the contract as your guarantee and comes back after
            your last payment.
          </p>
          <CollateralMeter />
        </div>
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(15,61,28,0.08)]">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-mint text-forest">
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{title}</h3>
            <p className="mt-2 leading-relaxed text-stone-600">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Small illustration: collateral covering what's still owed, shrinking as you pay. */
function CollateralMeter() {
  const rows = [
    { label: "Round 1", owed: 100, note: "3 payments left" },
    { label: "Round 3", owed: 34, note: "1 payment left" },
    { label: "Done", owed: 0, note: "BTC unlocked" },
  ];
  return (
    <div className="mt-8 space-y-4 rounded-xl bg-white/5 p-5 ring-1 ring-white/10 lg:mt-auto">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex justify-between text-sm text-white/70">
            <span>{r.label}</span>
            <span>{r.note}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-leaf-light" style={{ width: `${r.owed}%` }} />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1 text-xs text-white/60">
        <span className="h-2 w-2 rounded-full bg-leaf-light" /> What you still owe, covered 1.5× by your BTC
      </div>
    </div>
  );
}
