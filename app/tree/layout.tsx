import Link from "next/link";

export default function TreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[96rem] px-6 sm:px-10 py-12 sm:py-20">
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
        >
          ← back to index
        </Link>
      </div>
      {children}
    </article>
  );
}
