import { CircleView } from "@/components/CircleView";

// Static export (Cloudflare Pages): pre-render a shell for the first circles.
// Higher ids are served by the rewrite in public/_redirects; the view reads the id from the URL.
export function generateStaticParams() {
  return Array.from({ length: 50 }, (_, i) => ({ id: String(i + 1) }));
}

export const dynamicParams = false;

export default function CirclePage() {
  return <CircleView />;
}
