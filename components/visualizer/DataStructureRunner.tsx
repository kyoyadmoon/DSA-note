import { getDataStructureAlgorithm } from "@/lib/algorithms/registry";
import { highlightSource } from "@/lib/highlight";
import type { DataStructureInput } from "@/lib/types/dataStructure";
import { DataStructureRunnerClient } from "./DataStructureRunnerClient";

type Props = {
  slug: string;
  initial: DataStructureInput;
};

export async function DataStructureRunner({ slug, initial }: Props) {
  const entry = getDataStructureAlgorithm(slug);
  const highlightedLines = await highlightSource(entry.source);

  return (
    <DataStructureRunnerClient
      slug={slug}
      initial={initial}
      highlightedLines={highlightedLines}
      meta={entry.meta}
    />
  );
}
