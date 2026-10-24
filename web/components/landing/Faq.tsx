import { ChevronDown } from "lucide-react";
import { SectionHeading } from "./Section";

const QA = [
  {
    q: "What happens if someone doesn't pay?",
    a: "After the round ends and the grace period passes, anyone can settle. The contract takes the missed amount plus a 10% penalty from that member's locked BTC. The recipient gets BTC worth the missed payment, and the penalty is shared with honest members.",
  },
  {
    q: "What if the price of Bitcoin drops?",
    a: "Collateral starts at 150% of what you could owe, and you can top it up any time. If BTC falls so far that a defaulter's collateral can't cover a payment, the contract pays out what is there and shows the shortfall openly.",
  },
  {
    q: "Who holds the money?",
    a: "Nobody. Payments and collateral sit in a public smart contract with no owner and no admin keys. Payouts follow the rules in the contract, and anyone can trigger them.",
  },
  {
    q: "Do I have to sell my Bitcoin?",
    a: "No. Your BTC is locked as a guarantee and you can withdraw it after your final payment, or when the circle ends.",
  },
  {
    q: "What is MUSD?",
    a: "MUSD is Mezo's dollar stablecoin, backed by Bitcoin. Every contribution and payout in Round is in MUSD.",
  },
  {
    q: "Can I use real money?",
    a: "Not yet. Round runs on Mezo testnet with test BTC and test MUSD, which have no value.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 pt-28 md:pt-36">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeading
          align="left"
          eyebrow="FAQ"
          title="Questions, answered"
          lead="The short version: your BTC is the promise, and the contract keeps it."
        />
        <div className="divide-y divide-forest/10 rounded-2xl bg-white px-6 shadow-[0_8px_30px_rgba(15,61,28,0.08)]">
          {QA.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown size={20} className="shrink-0 text-forest/60 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 leading-relaxed text-stone-600">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
