import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({
  href = "/lainnya",
  label = "Lainnya",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="mb-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={16} /> {label}
    </Link>
  );
}
