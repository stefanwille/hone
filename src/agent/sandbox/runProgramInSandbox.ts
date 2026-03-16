import {
  SandboxManager,
  type SandboxRuntimeConfig,
} from "@anthropic-ai/sandbox-runtime";
import { spawn } from "child_process";

export async function main() {
  if (Bun.env.SRT_SANDBOXED) {
    await childMain();
  } else {
    await parentMain();
  }
}

async function childMain() {
  // Run the actual agent
  // await runAgent();
  console.log("Child: running agent", Bun.argv.join(" "));
}

async function parentMain() {
  // Parent: re-launch ourselves inside the sandbox

  const POLICY_FILE = new URL("sandbox-settings.json", import.meta.url);
  console.log("Loading sandbox policy from", POLICY_FILE.toString());
  const SANDBOX_POLICY: SandboxRuntimeConfig =
    await Bun.file(POLICY_FILE).json();

  await SandboxManager.initialize(SANDBOX_POLICY);
  const cmd = await SandboxManager.wrapWithSandbox(
    `SRT_SANDBOXED=1 ${process.execPath} ${process.argv.slice(1).join(" ")}`,
  );
  spawn(cmd, { shell: true, stdio: "inherit" });
}

main().catch(console.error);
