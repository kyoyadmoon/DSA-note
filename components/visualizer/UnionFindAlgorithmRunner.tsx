import { getUnionFindAlgorithm } from "@/lib/algorithms/registry";
import { highlightSource } from "@/lib/highlight";
import type { UnionFindOp } from "@/lib/types/unionFind";
import { UnionFindAlgorithmRunnerClient } from "./UnionFindAlgorithmRunnerClient";

type Props = {
  slug: string;
  n: number;
  ops: UnionFindOp[];
  /** Pass true for weighted / path-compression variants so the renderer
   * shows rank badges. */
  showRanks?: boolean;
};

export async function UnionFindAlgorithmRunner({
  slug,
  n,
  ops,
  showRanks,
}: Props) {
  const entry = getUnionFindAlgorithm(slug);
  const highlightedLines = await highlightSource(entry.source);

  return (
    <UnionFindAlgorithmRunnerClient
      slug={slug}
      n={n}
      ops={ops}
      highlightedLines={highlightedLines}
      meta={entry.meta}
      showRanks={showRanks}
    />
  );
}
