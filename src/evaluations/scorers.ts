export const TrimmedMatch = {
  name: "trimmed-match",
  description: "Checks if the output is equal to the expected value, trimmed",
  scorer: ({ output, expected }: { output: string; expected?: string }) => {
    return {
      score: output.trim() === expected?.trim() ? 1 : 0,
      metadata: { matched: output === expected },
    };
  },
};
