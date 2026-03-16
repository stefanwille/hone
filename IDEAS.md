- Use evaluations to allow AI to verify its work
- Protect against prompt injection
- Self improvement loop: Let the coding agent improve itself by running a ralph loop
- guardrails - bash
- Execute in docker
- Ralph loop builtin
- progress indicator - activity-gerunds.txt - Terminal spinner — Animate chars (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏) on a setInterval, clear on response. ~15 lines of code, no deps. Write to stderr with \r so it overwrites itself.
- prompt caching
- /clear
- /init
- Task tool
- /context - show how much context is left
- /cost - show how much context is left, and how many output tokens where consumed, and an estimate of the cost.
- Organize slash command in a lookup table, including descriptions, for easy /help generation and dispatching
- Streaming. Switch from messages.create to messages.stream so that tokens appear as they arrive.

Review Feedback:

- Better text editor error handling - https://platform.claude.com/docs/en/agents-and-tools/tool-use/text-editor-tool#handle-errors - "is_error": true 2. Bug: content field type mismatch (agent-request.ts:44)
  ToolResult can be a string | ContentBlock[], but Anthropic.Messages.ToolResultBlockParam.content expects string | ContentBlockParam[]. If tool.run() returns
  a complex content block, the types may diverge. Currently safe because all tools return strings, but fragile. 3. Bug: agentRequestTokens compared to maxTokens (agent-request.ts:145)
  if (agentRequestTokens > session.maxTokens \* 0.8)
  This compares cumulative output tokens across all turns against the per-turn max_tokens. These are different things — cumulative output will almost always
  exceed 80% of a single-turn limit in multi-turn conversations. The warning fires misleadingly. 4. History file path is relative (readline-history.ts:1)
  const HISTORY_FILE = "history.txt";
  This writes history.txt into whatever the current working directory is, not a stable location like ~/.ai-agent-history (as CLAUDE.md claims). If the user
  runs the agent from different directories, they get different histories. 5. pause_turn doesn't re-send the response (agent-request.ts:114-117)
  The comment says "provide the response back as-is in a subsequent request" but the code just logs and loops, which sends a new request without the paused
  context. This means paused turns are silently dropped.

  Minor Items
  - get_location is hardcoded (get-location.ts:10) — always returns "Berlin, Germany". Fine as a placeholder, but could confuse users.

  - No view_range bounds checking (\_view.ts:51-54) — negative or out-of-range values are silently handled by Array.slice but could return unexpected results.
  - renderToolFrame width is fixed at 50 (render-markdown.ts:129) — input/result lines overflow the box visually.
  - Empty catch {} blocks (system-prompt.ts:17,25) — silently swallowing file-read errors. At minimum log a debug message.
  - prettier in devDependencies (package.json:21) — unused since formatting uses oxfmt.

- Hello
