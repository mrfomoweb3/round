import Link from "next/link";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(15,61,28,0.08)] ${className}`}>{children}</div>;
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-stone-500">{hint}</div>}
    </div>
  );
}

type Variant = "primary" | "secondary" | "light" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90 disabled:bg-stone-300 disabled:text-white",
  secondary: "border border-stone-300 bg-white text-ink hover:bg-mint disabled:text-stone-400",
  light: "bg-white text-ink shadow-sm hover:bg-mint",
  ghost: "border border-white/40 bg-white/15 text-white backdrop-blur hover:bg-white/25",
};

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", className = "", ...props }: BtnProps) {
  return (
    <button
      className={`rounded-xl px-5 py-3 text-base font-semibold transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: Variant }) {
  return (
    <Link href={href} className={`inline-block rounded-xl px-7 py-3.5 text-center text-base font-medium transition ${VARIANTS[variant]}`}>
      {children}
    </Link>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>;
}

export function NotConfigured() {
  return (
    <Card>
      <p className="text-sm text-stone-600">
        The Round contract address isn&apos;t set. Add <code>NEXT_PUBLIC_ROUND_ADDRESS</code> to <code>web/.env.local</code>.
      </p>
    </Card>
  );
}
