export async function loadSystemPrompt(): Promise<string> {
  const prompts: string[] = [];

  // Load ~/.claude/CLAUDE.md
  try {
    const homeDir = Bun.env.HOME || Bun.env.USERPROFILE;
    if (homeDir) {
      const globalFile = Bun.file(`${homeDir}/.claude/CLAUDE.md`);
      if (await globalFile.exists()) {
        prompts.push(await globalFile.text());
      }
    }
  } catch {}

  // Load ./CLAUDE.md (current working directory)
  try {
    const file = Bun.file("CLAUDE.md");
    if (await file.exists()) {
      prompts.push(await file.text());
    }
  } catch {}

  return prompts.join("\n\n");
}
