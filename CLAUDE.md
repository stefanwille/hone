# CLAUDE.md

## Project

Interactive AI coding agent built on the Anthropic Claude API. REPL loop: user input → Claude API → tool execution → render response → repeat. Also supports piped input: `echo "what is 1+2" | bun start`.

## Validation Commands

Run these in order to verify clean state:

- bun run format
- bun run lint
- bun run typecheck
- bun test
- echo "What is 1+2" | bun start

## Gotchas

- **Env**: API key lives in `.env.local` (not `.env`). Bun auto-loads it.
- **System prompt assembly**: `system-prompt.ts` concatenates `SYSTEM_PROMPT.md` + `~/.claude/CLAUDE.md` + `./CLAUDE.md`. Changes to any of these affect agent behavior.
- **Message alternation**: The API requires strict user/assistant message alternation. `agentRequest()` handles this, but be aware when modifying message history.

## Conventions

- Order test scenarios with happy paths first.
- Prefer named functions over consts-with-arrow-function.
- Test descriptions are written in third person, not using should. Good: `it("works")`, Bad: `it("should work")`
