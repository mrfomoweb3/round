const FACTS = [
  { value: "150%", label: "BTC collateral by default" },
  { value: "1", label: "signature per payment" },
  { value: "0", label: "admin keys or custodians" },
  { value: "2–12", label: "people per circle" },
];

/** Product facts straight from the contract — no market numbers. */
export function Facts() {
  return (
    <section className="pt-20">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-forest/10 bg-forest/10 lg:grid-cols-4">
        {FACTS.map((f) => (
          <div key={f.label} className="bg-white/80 px-6 py-8 text-center backdrop-blur">
            <div className="text-4xl font-light tracking-[-0.03em] text-forest sm:text-5xl">{f.value}</div>
            <div className="mt-2 text-sm text-stone-600">{f.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
