import { getTreeAlgorithm } from "@/lib/algorithms/registry";
import { highlightSource } from "@/lib/highlight";
import { TreeAlgorithmRunnerClient } from "./TreeAlgorithmRunnerClient";

type Props = {
  slug: string;
  initial: number[];
};

export async function TreeAlgorithmRunner({ slug, initial }: Props) {
  const entry = getTreeAlgorithm(slug);
  const highlightedLines = await highlightSource(entry.source);

  return (
    <TreeAlgorithmRunnerClient
      slug={slug}
      initial={initial}
      highlightedLines={highlightedLines}
      meta={entry.meta}
    />
  );
}
