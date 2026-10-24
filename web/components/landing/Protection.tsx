import { Bitcoin, Clock, Users } from "lucide-react";
import { SectionHeading } from "./Section";

const POINTS = [
  { icon: Clock, title: "A grace period first", body: "A missed payment only counts once the round and its grace period have passed." },
  { icon: Bitcoin, title: "BTC pays the gap", body: "The contract values the defaulter's BTC with Mezo's price feed and sends the missed share to the recipient." },
  { icon: Users, title: "The group is made whole", body: "A 10% penalty is split among honest members. The defaulter's own payout is cancelled." },
];

export function Protection() {
  return (
    <section id="protection" className="scroll-mt-24 pt-28 md:pt-36">
      <div className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-14 sm:px-12 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-leaf/20 blur-3xl"
        />
        <div className="relative grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              tone="light"
              align="left"
              eyebrow="Default protection"
              title="Someone takes the pot and stops paying? The circle still pays."
            />
            <ul className="mt-10 space-y-7">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-leaf-light">
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <div>
                    <div className="font-semibold text-white">{title}</div>
                    <p className="mt-1 leading-relaxed text-white/70">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <CircleDiagram />
        </div>
      </div>
    </section>
  );
}

/** Round 2 of a 4-person circle: C and D pay, A missed, A's BTC covers it, B receives. */
function CircleDiagram() {
  const node = (x: number, y: number, letter: string, tone: "ok" | "bad" | "recipient") => {
    const fill = tone === "bad" ? "#3f1a1a" : tone === "recipient" ? "#6fe08f" : "#ffffff";
    const stroke = tone === "bad" ? "#f87171" : "none";
    const text = tone === "bad" ? "#fca5a5" : "#0a1128";
    return (
      <g>
        <circle cx={x} cy={y} r="28" fill={fill} stroke={stroke} strokeWidth="2" />
        <text x={x} y={y + 6} textAnchor="middle" fontSize="17" fontWeight="600" fill={text}>
          {letter}
        </text>
      </g>
    );
  };
  const label = "fill-white/75 text-[11px] font-medium";
  return (
    <figure className="mx-auto w-full max-w-md">
      <svg viewBox="0 0 420 420" className="w-full" role="img" aria-label="Diagram: A missed a payment, A's BTC covers it, B receives the pot">
        <defs>
          <marker id="arrow-w" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="rgba(255,255,255,0.7)" />
          </marker>
          <marker id="arrow-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#6fe08f" />
          </marker>
          <marker id="arrow-o" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#f7931a" />
          </marker>
        </defs>

        <circle cx="210" cy="210" r="160" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 6" />

        {/* payments in */}
        <line x1="82" y1="210" x2="146" y2="210" stroke="rgba(255,255,255,0.7)" strokeWidth="2" markerEnd="url(#arrow-w)" />
        <text x="114" y="198" textAnchor="middle" className={label}>100 MUSD</text>
        <line x1="210" y1="338" x2="210" y2="274" stroke="rgba(255,255,255,0.7)" strokeWidth="2" markerEnd="url(#arrow-w)" />
        <text x="218" y="310" className={label}>100 MUSD</text>

        {/* missed payment covered by BTC */}
        <line x1="210" y1="82" x2="210" y2="146" stroke="#f7931a" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow-o)" />
        <circle cx="210" cy="112" r="13" fill="#f7931a" />
        <text x="210" y="117" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">₿</text>
        <text x="232" y="108" className="fill-[#fbbf77] text-[11px] font-medium">from A&apos;s collateral</text>

        {/* payout */}
        <line x1="272" y1="210" x2="336" y2="210" stroke="#6fe08f" strokeWidth="3" markerEnd="url(#arrow-g)" />
        <text x="304" y="196" textAnchor="middle" className="fill-[#6fe08f] text-[11px] font-semibold">pot</text>

        {/* the pot */}
        <circle cx="210" cy="210" r="58" fill="#ffffff" />
        <text x="210" y="206" textAnchor="middle" fontSize="24" fontWeight="600" fill="#0a1128">$300</text>
        <text x="210" y="226" textAnchor="middle" fontSize="11" fill="#57534e">round 2 pot</text>

        {node(210, 50, "A", "bad")}
        {node(370, 210, "B", "recipient")}
        {node(210, 370, "C", "ok")}
        {node(50, 210, "D", "ok")}

        <g>
          <rect x="98" y="38" width="76" height="22" rx="11" fill="#3f1a1a" stroke="#f87171" />
          <text x="136" y="53" textAnchor="middle" className="fill-[#fca5a5] text-[10px] font-semibold">✗ missed</text>
        </g>
        <g>
          <rect x="331" y="250" width="78" height="22" rx="11" fill="#6fe08f" />
          <text x="370" y="265" textAnchor="middle" className="fill-[#0a1128] text-[10px] font-semibold">★ receives</text>
        </g>
      </svg>
      <figcaption className="mt-2 text-center text-sm text-white/60">
        Round 2: A already took the pot in round 1, then skipped. B still gets the full pot.
      </figcaption>
    </figure>
  );
}
