import type Anthropic from "@anthropic-ai/sdk";
import { parseArgs } from "node:util";

type ModelAlias = "haiku" | "sonnet" | "opus";

const MODEL_MAP: Record<ModelAlias, Anthropic.Messages.Model> = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-6",
};

export interface CliOptions {
  model?: Anthropic.Messages.Model;
}

export function getCliOptions(): { model: string | undefined } {
  const { values } = parseArgs({
    options: {
      model: { type: "string", short: "m" },
    },
    allowPositionals: true,
  });

  let model: string | undefined;
  if (values.model) {
    const alias = values.model as ModelAlias;
    if (!(alias in MODEL_MAP)) {
      console.error(`Invalid model: ${values.model}. Use: haiku, sonnet, opus`);
      process.exit(1);
    }
    model = MODEL_MAP[alias];
  }

  return { model };
}
