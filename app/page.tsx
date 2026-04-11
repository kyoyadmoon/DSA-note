import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-8 py-20">
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted">
        Interactive DSA notebook
      </div>
      <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
        看得見的演算法，
        <br />
        <span className="text-accent">一步一步拆給你看。</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/70">
        這是一份會動的資料結構與演算法筆記。每一題都配上可播放、可暫停、可逐步檢視的動畫，
        同步高亮對應的程式碼行，讓你不只看到結果，還看得懂過程。
      </p>

      <div className="mt-16">
        <div className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">
          目前開放
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TopicCard
            href="/sorting/bubble-sort"
            eyebrow="Sorting · 6 algorithms"
            title="排序演算法"
            description="從 bubble sort 到 heap sort，六個經典排序各自有專屬的逐步動畫。"
          />
          <TopicCard
            href="/tree/bst-insert"
            eyebrow="Tree · BST"
            title="樹狀結構"
            description="從 BST 插入開始，用動畫看懂樹的遞迴結構與搜尋路徑。"
          />
        </div>
      </div>

      <div className="mt-24 text-sm text-muted">
        更多主題（searching、trees、graphs、DP…）陸續補齊中。
      </div>
    </div>
  );
}

function TopicCard({
  href,
  eyebrow,
  title,
  description,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-border bg-surface p-6 transition-all hover:border-accent/50 hover:bg-surface-raised"
    >
      <div className="text-[11px] uppercase tracking-widest text-muted">
        {eyebrow}
      </div>
      <div className="mt-2 font-serif text-2xl tracking-tight">{title}</div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/70">
        {description}
      </p>
      <div className="mt-6 text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100">
        開始閱讀 →
      </div>
    </Link>
  );
}
