import Link from "next/link";

export default function DataStructuresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[96rem] px-6 py-12 sm:px-10 sm:py-20">
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
        >
          ← back to index
        </Link>
      </div>
      {children}
    </article>
  );
}
