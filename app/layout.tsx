import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "DSA Notes — 互動式演算法筆記",
  description:
    "用動畫逐步呈現經典資料結構與演算法，從排序開始。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="min-h-screen grid md:grid-cols-[15rem_minmax(0,1fr)_15rem]">
          <aside className="border-r border-border bg-surface/60 px-6 py-8 hidden md:flex md:flex-col gap-8">
            <Link href="/" className="block">
              <div className="font-serif text-2xl leading-none tracking-tight">
                DSA<span className="text-accent">.</span>
              </div>
              <div className="text-xs text-muted mt-1">
                interactive notes
              </div>
            </Link>

            <nav className="text-sm space-y-6">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted mb-2">
                  Sorting
                </div>
                <ul className="space-y-1.5">
                  <SidebarLink href="/sorting/bubble-sort">
                    Bubble sort
                  </SidebarLink>
                  <SidebarLink href="/sorting/selection-sort">
                    Selection sort
                  </SidebarLink>
                  <SidebarLink href="/sorting/insertion-sort">
                    Insertion sort
                  </SidebarLink>
                  <SidebarLink href="/sorting/quick-sort">
                    Quick sort
                  </SidebarLink>
                  <SidebarLink href="/sorting/merge-sort">
                    Merge sort
                  </SidebarLink>
                  <SidebarLink href="/sorting/heap-sort">
                    Heap sort
                  </SidebarLink>
                </ul>
              </div>
            </nav>
          </aside>

          <main className="min-w-0">{children}</main>
          <div className="hidden md:block" aria-hidden="true" />
        </div>
      </body>
    </html>
  );
}

function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-md px-2 py-1 text-foreground/80 hover:text-foreground hover:bg-surface-raised transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
