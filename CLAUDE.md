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
```

## Validation Commands

- echo "What is 1+2" | bun start
- bun run format
- bun run lint
- bun run typecheck
- bun test

## Architecture

`src/main.ts` — Entry point. Creates readline and agent sessions, runs the REPL loop.

`src/agent/agent-session.ts` — `AgentSession` type holds all session state: Anthropic client, message history, tools, model config, token counter. `createAgentSession()` wires everything together.

`src/agent/agent-request.ts` — `agentRequest()` sends messages to Claude, processes tool calls in a loop (max turns configurable, default 20). Tool calls within a turn run sequentially. Handles all stop reasons. Ensures messages alternate user/assistant for API compliance.

`src/agent/tools/tools.ts` — Tool definitions using arktype for input schemas. Each `Tool` has `name`, `description`, `inputSchema` (arktype), and `run`. `convertTools()` converts to Anthropic API format. The bash tool uses the special `bash_20250124` tool type.

`src/agent/tools/bash-session.ts` — Persistent bash process. Writes command + sentinel marker, polls stdout for sentinel. 120s timeout, 30KB output limit.

`src/agent/system-prompt.ts` — Loads `~/.claude/CLAUDE.md` and `./CLAUDE.md`, concatenates them as system prompt.

`src/agent/markdown-renderer/render-markdown.ts` — Terminal markdown renderer using ANSI codes. `renderToolFrame()` draws bordered boxes around tool I/O.

`src/agent/readline/` — Readline session and persistent history (`~/.ai-agent-history`).

## Conventions

- **Runtime**: Bun, not Node.js. Use `bun:test`, `Bun.file`, `Bun.$`.
- **Schemas**: arktype for runtime validation + type inference.
- **Formatting**: oxfmt (printWidth: 80).
- **No build step**: Bun runs .ts directly.
- **Env**: Bun auto-loads `.env.local` (contains `ANTHROPIC_API_KEY`).
- **Default model**: `claude-sonnet-4-6` (set in agent-session.ts).
