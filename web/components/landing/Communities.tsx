import { MapPin } from "lucide-react";
import { SectionHeading } from "./Section";

const NAMES = [
  { name: "Ajo & Esusu", where: "Nigeria" },
  { name: "Susu", where: "Ghana & the Caribbean" },
  { name: "Tandas", where: "Mexico & Latin America" },
  { name: "Chit funds", where: "India" },
  { name: "Hui", where: "China & the diaspora" },
  { name: "Paluwagan", where: "The Philippines" },
];

export function Communities() {
  return (
    <section className="pt-28 md:pt-36">
      <SectionHeading
        eyebrow="Who it's for"
        title="Different names. The same promise."
        lead="Savings circles are widely used across Africa, Latin America and Asia. Round keeps the habit and adds a guarantee that doesn't depend on knowing everyone."
      />
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NAMES.map((n) => (
          <li
            key={n.name}
            className="flex items-center justify-between rounded-2xl border border-forest/10 bg-white/70 px-6 py-5 backdrop-blur"
          >
            <span className="text-xl font-medium tracking-tight text-forest">{n.name}</span>
            <span className="flex items-center gap-1.5 text-sm text-stone-500">
              <MapPin size={15} strokeWidth={1.75} />
              {n.where}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
