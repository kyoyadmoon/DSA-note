import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="font-serif text-4xl sm:text-5xl tracking-tight leading-[1.1] mt-0 mb-3">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-serif text-2xl sm:text-3xl tracking-tight leading-tight mt-14 mb-4">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-serif text-xl sm:text-2xl tracking-tight mt-10 mb-3">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-[17px] leading-[1.75] text-foreground/85 my-5">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 space-y-2 my-5 text-[17px] text-foreground/85 marker:text-muted">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 space-y-2 my-5 text-[17px] text-foreground/85 marker:text-muted">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-[1.75]">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground">{children}</em>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="my-6 overflow-x-auto rounded-xl border border-border bg-surface-raised p-4 text-[14px] leading-relaxed font-mono"
      {...props}
    >
      {children}
    </pre>
  ),
  code: (props) => {
    const { children, ...rest } = props as React.ComponentProps<"code"> & {
      "data-language"?: string;
    };
    // If rehype-pretty-code processed this code (fenced block), render without inline styling
    if ("data-language" in rest) {
      return <code {...rest}>{children}</code>;
    }
    return (
      <code className="font-mono text-[0.88em] px-1.5 py-0.5 rounded bg-surface-raised border border-border text-accent">
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-accent/60 pl-4 py-1 my-6 text-foreground/75 italic">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent transition-colors"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-10 border-border" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-[15px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-surface-raised/60">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-border last:border-b-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left font-semibold text-foreground text-[13px] uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-foreground/85 align-top">{children}</td>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
