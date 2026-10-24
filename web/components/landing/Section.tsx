/** Shared section heading: small uppercase eyebrow, large light title, muted lead. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  tone = "dark",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "center" | "left";
  tone?: "dark" | "light";
}) {
  const c = tone === "dark" ? ["text-leaf", "text-forest", "text-forest/70"] : ["text-leaf-light", "text-white", "text-white/75"];
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <div className={`text-sm font-semibold uppercase tracking-[0.2em] ${c[0]}`}>{eyebrow}</div>
      <h2 className={`mt-4 text-4xl font-normal leading-[1.1] tracking-[-0.03em] sm:text-5xl ${c[1]}`}>{title}</h2>
      {lead && <p className={`mt-5 text-lg leading-relaxed ${c[2]}`}>{lead}</p>}
    </div>
  );
}
