# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

An interactive AI agent built on the Anthropic Claude API with Bun/TypeScript. The agent runs a REPL loop: user input → Claude API → tool execution → render response → repeat.

## Commands

```bash
bun agentic-loop.ts          # Run the interactive agent
bun test                      # Run all tests
bun test render-markdown      # Run tests for a specific file
```

## Architecture

**agentic-loop.ts** — Main loop. `agentRequest()` sends messages to Claude, processes tool calls in a while loop (max 10 turns), accumulates message history. Tool calls within a turn run sequentially. The REPL in `main()` manages multi-turn conversation.

**BashTool.ts** — Persistent bash session. Spawns a single bash process, writes commands + sentinel marker, polls stdout for the sentinel. 120s default timeout, 30KB output limit. Supports restart.

**tools.ts** — Custom tool definitions using arktype for input schemas. Each tool has `name`, `description`, `inputSchema` (arktype), and `jsFunction`. Tools are converted to Anthropic API format via `convertTools()`.

**render-markdown.ts** — Terminal markdown renderer using ANSI escape codes. Line-by-line parser handles headers, code blocks, tables, lists, blockquotes, inline formatting. `renderToolFrame()` draws bordered boxes around tool I/O. Exports: `renderMarkdown`, `formatInline`, `renderToolFrame`.

## Conventions

- **Runtime**: Bun, not Node.js. Use `bun:test`, `Bun.file`, `Bun.$`.
- **Schemas**: arktype for runtime validation + type inference.
- **Formatting**: oxfmt (printWidth: 80).
- **No build step**: Bun runs .ts directly.
- **Env**: Bun auto-loads `.env.local` (contains `ANTHROPIC_API_KEY`).
