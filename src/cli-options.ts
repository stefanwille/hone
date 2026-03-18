import type Anthropic from "@anthropic-ai/sdk";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

type ModelAlias = "haiku" | "sonnet" | "opus";

const MODEL_MAP: Record<ModelAlias, Anthropic.Messages.Model> = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-6",
};

const DEFAULT_MODEL: Anthropic.Messages.Model = "claude-sonnet-4-6";

export interface CliOptions {
  model?: Anthropic.Messages.Model;
  cwd?: string;
}

export function getCliOptions(): CliOptions {
  const { values } = parseArgs({
    options: {
      model: { type: "string", short: "m" },
      cwd: { type: "string" },
    },
    allowPositionals: true,
  });

  const model: Anthropic.Messages.Model =
    MODEL_MAP[(values.model as ModelAlias) ?? "--"] ?? DEFAULT_MODEL;

  const cwd = values.cwd ? resolve(values.cwd) : undefined;

  return { model, cwd };
}
