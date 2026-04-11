import { getAlgorithm } from "@/lib/algorithms/registry";
import { highlightSource } from "@/lib/highlight";
import { AlgorithmRunnerClient } from "./AlgorithmRunnerClient";

type Props = {
  slug: string;
  initial: number[];
};

export async function AlgorithmRunner({ slug, initial }: Props) {
  const entry = getAlgorithm(slug);
  const highlightedLines = await highlightSource(entry.source);

  return (
    <AlgorithmRunnerClient
      slug={slug}
      initial={initial}
      highlightedLines={highlightedLines}
      meta={entry.meta}
    />
  );
}
