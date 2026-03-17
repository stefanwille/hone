# AI Coding Agent

A terminal-based AI coding agent built from scratch with the [Anthropic Claude API](https://docs.anthropic.com/en/docs/), [Bun](https://bun.sh), and TypeScript. It runs an interactive REPL where you chat with Claude, and the model can execute bash commands on your machine autonomously through tool use.

**This is a learning project.** I'm using it to explore AI engineering concepts hands-on — agentic loops, tool use, prompt design, and building real applications on top of LLM APIs. Feel free to poke around, learn from it, or use it as a starting point for your own experiments.

## What It Does

```
> What files are in this directory?

┌─ bash ──────────────────────────────────────┐
│ {"command":"ls -la"}
├─ result ────────────────────────────────────┤
│ total 120
│ drwxr-xr-x  12 user  staff   384 Mar 10 09:00 .
│ -rw-r--r--   1 user  staff   847 Mar 10 09:00 package.json
│ drwxr-xr-x   5 user  staff   160 Mar 10 09:00 src
│ ...
└──────────────────────────────────────────────┘

Here are the files in the current directory: ...
```

The agent follows a classic **agentic loop**:

1. You type a message
2. The message is sent to Claude via the Anthropic API
3. Claude responds — possibly requesting tool calls (e.g. running a bash command)
4. Tool results are sent back to Claude
5. Steps 3–4 repeat until Claude produces a final text response
6. The response is rendered as formatted Markdown in your terminal

## Features

- **Interactive REPL** with persistent command history across sessions
- **Agentic loop** — multi-turn tool use with configurable max turns
- **Bash tool use** — Claude can run shell commands in a persistent bash session
- **Terminal Markdown rendering** — headings, code blocks, tables, lists, bold/italic, links, all with ANSI colors
- **Bordered tool frames** — tool inputs and outputs are displayed in visual boxes
- **System prompt from CLAUDE.md** — automatically loads `~/.claude/CLAUDE.md` and `./CLAUDE.md`
- **Instant CLAUDE.md reloading** - changes to CLAUDE.md immediately affect the next turn
- **Pipe mode** — use non-interactively: `echo "what is 1+2" | bun start`
- **Error handling** — rate limits, connection errors, max tokens, and refusals
- **Sandboxing** — the agent runs inside an [`@anthropic-ai/sandbox-runtime`](https://www.npmjs.com/package/@anthropic-ai/sandbox-runtime) sandbox with configurable filesystem and network restrictions

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# Clone the repo
git clone https://github.com/stefanwille/ai-coding-agent.git
cd ai-coding-agent

# Install dependencies
bun install

# Add your API key
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local

# Run the agent
bun start
```

Bun automatically loads `.env.local`, so your API key is picked up without any extra config.

### Pipe Mode

You can also pipe input for non-interactive, single-shot usage:

```bash
echo "Explain the difference between TCP and UDP" | bun start
```

## How It Works

**Agent Session** (`agent-session.ts`) — holds all state for a conversation: the Anthropic client, message history, registered tools, model configuration, and token counter.

**Agentic Loop** (`agent-request.ts`) — the core loop. Sends the conversation to Claude, checks the stop reason, executes any requested tools, appends results to the message history, and loops until Claude says it's done (or we hit the max turn limit).

**Bash Tool** (`bash-session.ts`) — spawns a long-lived bash process. Commands are sent via stdin with a UUID sentinel marker appended. The session polls stdout until the sentinel appears, then returns everything before it. 120-second timeout, 30KB output cap.

**Tool System** (`tools.ts`) — tools are defined with [arktype](https://arktype.io) schemas for input validation. The bash tool uses Anthropic's special `bash_20250124` tool type for computer use.

**Markdown Renderer** (`render-markdown.ts`) — a from-scratch terminal Markdown renderer. Converts headings, code fences, tables, blockquotes, lists, inline formatting, and links into styled ANSI output.

**Sandbox** (`sandbox/runProgramInSandbox.ts`) — wraps the agent process in an `@anthropic-ai/sandbox-runtime` sandbox. On first launch (no `SRT_SANDBOXED` env var), it loads `sandbox-settings.json`, initializes the sandbox policy, and re-spawns itself inside the sandbox. Policy controls filesystem read/write access and allowed network domains.

## Development

```bash
bun start              # Run the agent
bun test               # Run all tests
bun test render-markdown  # Run tests matching a name
bun run format         # Format with oxfmt
bun run lint           # Lint with oxlint
bun run typecheck      # TypeScript type check
```

### Tech Stack

| Component      | Choice                                             |
| -------------- | -------------------------------------------------- |
| Runtime        | [Bun](https://bun.sh)                              |
| Language       | TypeScript                                         |
| LLM API        | [Anthropic Claude API](https://docs.anthropic.com) |
| Default Model  | `claude-sonnet-4-6`                                |
| Schema Library | [arktype](https://arktype.io)                      |
| Formatter      | [oxfmt](https://oxc.rs)                            |
| Linter         | [oxlint](https://oxc.rs)                           |
| Test Runner    | `bun:test`                                         |
