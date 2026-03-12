# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

An interactive AI agent built on the Anthropic Claude API with Bun/TypeScript. The agent runs a REPL loop: user input → Claude API → tool execution → render response → repeat.

It can also execute a request piped into the CLI:

```
echo "what is 1+2" | bun start
```

## Commands

```bash
bun start                      # Run the agent
bun test                       # Run all tests
bun test render-markdown       # Run tests matching a name
bun run format                 # Format with oxfmt
bun run lint                   # Lint with oxlint
bun run typecheck              # Type-check without emitting
bun run verify                 # Lint + typecheck + test
```

## Validation Commands

Run these commands to verify the project is in clean state.

- bun run format
- bun run lint
- bun run typecheck
- bun test
- echo "What is 1+2" | bun start

## Architecture

`src/main.ts` — Entry point. Detects TTY for REPL vs batch mode. Creates readline and agent sessions, runs the REPL loop.

`src/agent/agent-session.ts` — `AgentSession` type holds all session state: Anthropic client, message history, tools, model config, token counter. `createAgentSession()` wires everything together.

`src/agent/agent-request.ts` — `agentRequest()` sends messages to Claude, processes tool calls in a loop (max turns configurable, default 20). Tool calls within a turn run sequentially. Handles all stop reasons. Ensures messages alternate user/assistant for API compliance.

`src/agent/tools/tool.ts` — Two tool types: `AIAgentTool` (custom tools with arktype input schemas) and `ExtendedAnthropicTool` (Anthropic-native tools like bash). Both expose a `run` function.

`src/agent/tools/tool-list.ts` — `createTools()` assembles the tool list, `convertTools()` converts to Anthropic API format.

`src/agent/tools/available-tools/` — Individual tool implementations:
- `bash/` — Persistent bash process via `BashSession`. Uses `bash_20250124` Anthropic tool type. Sentinel-based output capture, 120s timeout, 30KB output limit.
- `text-editor/` — File operations (`_view.ts`, `_str_replace.ts`, `_create.ts`). Uses `text_editor_20250124` Anthropic tool type.
- `get-weather.ts`, `get-location.ts` — Example custom tools.

`src/agent/system-prompt/system-prompt.ts` — Loads `SYSTEM_PROMPT.md`, `~/.claude/CLAUDE.md`, and `./CLAUDE.md`, concatenates them as system prompt.

`src/agent/markdown-renderer/render-markdown.ts` — Terminal markdown renderer using ANSI codes. `renderToolFrame()` draws bordered boxes around tool I/O.

`src/agent/readline/` — Readline session and persistent history (`~/.ai-agent-history`).

## Conventions

- **Runtime**: Bun, not Node.js. Use `bun:test`, `Bun.file`, `Bun.$`.
- **Schemas**: arktype for runtime validation + type inference.
- **Formatting**: oxfmt (printWidth: 80).
- **No build step**: Bun runs .ts directly.
- **Env**: Bun auto-loads `.env.local` (contains `ANTHROPIC_API_KEY`).
- **Default model**: `claude-sonnet-4-6` (set in agent-session.ts).

## Tests

Order test scenarios such that the happy paths are in the beginning.
