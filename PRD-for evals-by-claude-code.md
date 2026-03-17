# PRD: Evaluation Framework

## Overview

Add an evaluation framework to the coding agent using [evalite](https://www.evalite.dev/) to measure agent quality across defined scenarios. Each eval runs the agent in-process (calling `createAgentSession()` + `agentRequest()` directly) inside an SRT sandbox, against a pre-seeded temp directory, then scores the result.

## Goals

- Verify agent correctness across file creation, bug fixing, multi-turn tool use, and reasoning tasks
- Run evals locally to control API costs
- Sandboxed execution via SRT so agent tools (bash, text-editor) are constrained
- Configurable model per eval (default: `claude-sonnet-4-6`)

## Architecture

```
evalite CLI (via SRT)
  └─ *.eval.ts files in src/evals/
       └─ task function:
            1. Create temp dir with pre-seeded files
            2. cd into temp dir
            3. createAgentSession({ model, maxTurns, maxTokens })
            4. agentRequest(prompt1, session)
            5. agentRequest(prompt2, session)  // multi-turn
            6. Return { session, filesystem state } for scoring
       └─ scorers:
            - File-based: check file existence, content match
            - Output-based: check session.messages for expected content
            - LLM-as-judge: evaluate answer quality
```

### Why in-process, not subprocess

Calling `createAgentSession()` + `agentRequest()` directly gives structured access to `session.messages`, token counts, and tool call history. Multi-turn is trivial — call `agentRequest()` multiple times on the same session. Sandboxing is handled by running the evalite process itself via SRT.

### Sandbox integration

Run evalite via SRT: `srt bunx evalite`. This sandboxes all agent tool execution (bash commands, file writes) within the eval. The sandbox policy from `sandbox-settings.json` applies, with `allowedDomains` including `api.anthropic.com` and write access scoped to the temp dir.

A custom sandbox policy for evals may be needed — the eval sandbox config should allow writes to `$TMPDIR` (where test project dirs live) instead of `.` (the repo root).

## Package setup

- Install: `bun add -d evalite autoevals`
- Eval files: `src/evals/*.eval.ts`
- Scripts in package.json:
  - `"eval": "srt bunx evalite"` — one-shot run
  - `"eval:watch": "srt bunx evalite watch"` — watch mode with UI
- Config: `evalite.config.ts` at project root (see below)
- Evalite UI: `localhost:3006` (auto-served by evalite)

### `evalite.config.ts`

```ts
import { defineConfig } from "evalite/config";

export default defineConfig({
  testTimeout: 120_000, // agent calls may be slow
  maxConcurrency: 1, // sequential to avoid rate limits initially
  server: { port: 3006 },
});
```

## MVP Scenarios (4)

### 1. File creation

- **Seeds:** Empty directory
- **Prompt:** `"Create a file called hello.txt containing exactly 'Hello World'"`
- **Scoring:** File-based — verify `hello.txt` exists and content equals `"Hello World"`
- **Model:** configurable (default `claude-sonnet-4-6`)

### 2. Bug fix

- **Seeds:** A file `sum.ts` with a known bug:
  ```ts
  export function sum(a: number, b: number): number {
    return a - b; // bug: should be a + b
  }
  ```
- **Prompt:** `"There is a bug in sum.ts. Find and fix it."`
- **Scoring:** File-based — verify `sum.ts` contains `a + b` (not `a - b`)
- **Model:** configurable

### 3. Multi-turn tool use

- **Seeds:** A file `config.json`:
  ```json
  { "name": "my-app", "debug": false }
  ```
- **Prompts (2 turns):**
  1. `"Read config.json and tell me what fields it has."`
  2. `"Add a field 'version' with value 2 to config.json."`
- **Scoring:**
  - File-based: verify `config.json` contains `"version": 2` and retains original fields
  - Output-based: verify first response mentions `name` and `debug`

### 4. Code reasoning

- **Seeds:** A file `mystery.ts`:
  ```ts
  export function mystery(n: number): number {
    if (n <= 1) return n;
    return mystery(n - 1) + mystery(n - 2);
  }
  ```
- **Prompt:** `"What does the function in mystery.ts do? Be specific about what algorithm it implements."`
- **Scoring:** LLM-as-judge — evaluate whether the response correctly identifies the Fibonacci sequence

## Eval file structure

```
src/evals/
  helpers/
    setup.ts          # createTempDir, seedFiles, createEvalSession utilities
    scorers.ts        # fileExists, fileContains, messageContains, llmJudge scorers
    sandbox-settings.json  # eval-specific sandbox policy (if needed)
  file-creation.eval.ts
  bug-fix.eval.ts
  multi-turn.eval.ts
  code-reasoning.eval.ts
```

### Helper: `setup.ts`

```ts
import { createAgentSession } from "../agent/agent-session";
import { agentRequest } from "../agent/agent-request";
import { mkdtemp, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function createEvalDir(
  files: Record<string, string>,
): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "eval-"));
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(dir, name), content);
  }
  return dir;
}

export type EvalResult = { session: AgentSession; dir: string };

export async function runAgent(options: {
  dir: string;
  prompts: string[];
  model?: string;
  maxTurns?: number;
}): Promise<EvalResult> {
  const originalDir = process.cwd();
  process.chdir(options.dir);
  try {
    const session = await createAgentSession({
      model: options.model ?? "claude-sonnet-4-6",
      maxTokens: 4096,
      maxTurns: options.maxTurns ?? 10,
    });
    for (const prompt of options.prompts) {
      await agentRequest(prompt, session);
    }
    return { session, dir: options.dir };
  } finally {
    process.chdir(originalDir);
  }
}
```

### Helper: `scorers.ts`

Scorers use `createScorer` with typed generics. The `output` type matches what `task` returns (`EvalResult`). Scorers return 0–1, or `{ score, metadata }` for richer reporting in the evalite UI.

```ts
import { createScorer } from "evalite";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import type { EvalResult } from "./setup";

type Input = { files: Record<string, string>; prompts: string[] };

export const fileExists = (filename: string) =>
  createScorer<Input, EvalResult>({
    name: `file-exists:${filename}`,
    description: `Checks that ${filename} exists in the eval directory`,
    scorer: ({ output }) => {
      const exists = existsSync(join(output.dir, filename));
      return { score: exists ? 1 : 0, metadata: { path: join(output.dir, filename) } };
    },
  });

export const fileContains = (filename: string, expected: string) =>
  createScorer<Input, EvalResult>({
    name: `file-contains:${filename}`,
    description: `Checks that ${filename} contains "${expected}"`,
    scorer: async ({ output }) => {
      try {
        const content = await readFile(join(output.dir, filename), "utf-8");
        const found = content.includes(expected);
        return { score: found ? 1 : 0, metadata: { expected, actual: content } };
      } catch {
        return { score: 0, metadata: { error: "file not found" } };
      }
    },
  });

export const fileNotContains = (filename: string, unexpected: string) =>
  createScorer<Input, EvalResult>({
    name: `file-not-contains:${filename}`,
    description: `Checks that ${filename} does not contain "${unexpected}"`,
    scorer: async ({ output }) => {
      try {
        const content = await readFile(join(output.dir, filename), "utf-8");
        return { score: content.includes(unexpected) ? 0 : 1 };
      } catch {
        return { score: 0, metadata: { error: "file not found" } };
      }
    },
  });
```

### Example eval: `bug-fix.eval.ts`

```ts
import { evalite } from "evalite";
import { createEvalDir, runAgent } from "./helpers/setup";
import { fileContains, fileNotContains } from "./helpers/scorers";

evalite("Bug Fix - sum.ts", {
  data: () => [
    {
      input: {
        files: {
          "sum.ts": `export function sum(a: number, b: number): number {\n  return a - b; // bug: should be a + b\n}\n`,
        },
        prompts: ["There is a bug in sum.ts. Find and fix it."],
      },
      expected: null,
    },
  ],
  task: async (input) => {
    const dir = await createEvalDir(input.files);
    return await runAgent({ dir, prompts: input.prompts });
  },
  scorers: [
    fileContains("sum.ts", "a + b"),
    fileNotContains("sum.ts", "a - b"),
  ],
});
```

## Open questions

1. **Cleanup:** Should temp dirs be cleaned up after each eval run, or retained for debugging? Recommend: retain on failure, clean on success.
2. **Concurrency:** Evalite's `maxConcurrency` defaults to 50. Set to 1 initially to avoid rate limits. Increase later.
3. **Caching:** Evalite supports caching of AI SDK model outputs in watch mode (`cache: true` in config). However, our agent calls the Anthropic SDK directly (not via Vercel AI SDK), so evalite's built-in caching won't apply. We'd need our own caching layer if desired.
4. **BashSession CWD:** `BashSession` may need the working directory set to the temp dir. Need to verify whether `process.chdir()` is sufficient or if `BashSession` needs explicit cwd support.
5. **System prompt:** The system prompt loads `CLAUDE.md` files relative to cwd. In eval context, the temp dir won't have a `CLAUDE.md`. Decide whether to seed one per eval or let the agent run without project-specific instructions.

## Compatibility notes

- **Evalite is built on Vitest**, not Bun's test runner. Eval files are `*.eval.ts` (not `*.test.ts`), so they won't conflict with `bun test`. Evalite has its own CLI (`evalite` / `evalite watch`) and does not need a `vitest.config.ts` — it uses `evalite.config.ts` instead, which wraps Vitest config via `defineConfig({ viteConfig: ... })` if needed.
- **Bun compatibility:** Evalite runs via `bunx evalite`, which uses Bun as the runtime. Vitest (under the hood) should work with Bun, but this is a potential friction point to validate early.
- **`autoevals` package** provides pre-built LLM-as-judge scorers (e.g., `Factuality`, `ClosedQA`) that we can use for the code reasoning scenario instead of writing our own.

## Out of scope (v1)

- CI integration
- Cost tracking / budgets per eval run
- Snapshot testing (comparing against previous results)
- Custom eval UI dashboards
- Streaming response evaluation
