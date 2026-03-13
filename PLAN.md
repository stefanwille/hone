# Plan: Spinner for API Calls

## Goal

Show an animated spinner with a random activity gerund while waiting for Claude API responses and tool execution.

## New file: `src/agent/spinner.ts`

- **Spinner characters**: `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` (braille dots, smooth animation)
- **Load gerunds** from existing `activity-gerunds.txt`
- `startSpinner()` → picks a random gerund, starts a `setInterval` (~80ms) writing `\r⠋ simmering...` to `stderr`, returns a stop handle
- `stopSpinner()` → clears interval, writes `\r` + spaces + `\r` to erase the line
- Write to `process.stderr` so it doesn't mix with `console.log` (stdout) output

## Changes to `agent-request.ts`

Two spinner points per loop iteration:

1. **Before `messages.create()`** → `startSpinner()`. Stop it when the response arrives (or on error).
2. **Before `executeToolUse()`** → `startSpinner()`. Stop it before printing the tool frame.

Both are simple: wrap the `await` with start/stop calls.

## Edge cases

- Spinner must stop on API errors (already handled — stop in `catch` or use `finally`)
- Multiple tool calls in a turn execute sequentially, so one spinner per tool call is fine
- Batch mode (piped input) — spinner still works since it writes to stderr

## Tests: `src/agent/spinner.test.ts`

- `startSpinner` returns an object with a `stop` method
- `stop` clears the interval (no more writes)
- Gerunds load correctly from file

## No changes needed

- `main.ts` — no changes
- `agent-session.ts` — no changes
