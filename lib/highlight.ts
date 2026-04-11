import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark-dimmed"],
      langs: ["typescript"],
    });
  }
  return highlighterPromise;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function highlightSource(
  code: string,
  lang: "typescript" = "typescript",
): Promise<string[]> {
  const highlighter = await getHighlighter();
  const { tokens } = highlighter.codeToTokens(code, {
    lang,
    theme: "github-dark-dimmed",
  });

  return tokens.map((line) =>
    line
      .map((token) => {
        const color = token.color ?? "inherit";
        return `<span style="color:${color}">${escapeHtml(token.content)}</span>`;
      })
      .join(""),
  );
}
