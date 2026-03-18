import { Levenshtein } from "autoevals";

export const TrimmedLevenshtein = {
  name: "trimmed-levenshtein",
  description:
    "Scores output similarity using Levenshtein distance after trimming",
  scorer: async ({
    output,
    expected,
  }: {
    output: string;
    expected?: string;
  }) => {
    const result = await Levenshtein({
      output: output.trim(),
      expected: expected?.trim(),
    });
    return { score: result.score ?? 0, metadata: result.metadata };
  },
};
