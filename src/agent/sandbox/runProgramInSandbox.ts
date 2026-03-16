import {
  SandboxManager,
  SandboxRuntimeConfigSchema,
  type SandboxRuntimeConfig,
} from "@anthropic-ai/sandbox-runtime";
import { spawn } from "child_process";

export type Program = () => Promise<void>;

export async function runInSandbox(program: Program) {
  if (Bun.env.SRT_SANDBOXED) {
    // Child: Run the actual agent
    await program();
  } else {
    // Parent
    await relaunchProgramInSandbox();
  }
}

async function relaunchProgramInSandbox() {
  // Parent: re-launch ourselves inside the sandbox

  const config = await loadSandboxRuntimeConfig();
  await SandboxManager.initialize(config);
  const cmd = await SandboxManager.wrapWithSandbox(
    `SRT_SANDBOXED=1 ${process.execPath} ${process.argv.slice(1).join(" ")}`,
  );
  spawn(cmd, { shell: true, stdio: "inherit" });
}

async function loadSandboxRuntimeConfig(): Promise<SandboxRuntimeConfig> {
  const POLICY_FILE = new URL("sandbox-settings.json", import.meta.url);
  console.log("Loading sandbox policy from", POLICY_FILE.toString());
  const SANDBOX_POLICY = await Bun.file(POLICY_FILE).json();
  return SandboxRuntimeConfigSchema.parse(SANDBOX_POLICY);
}
