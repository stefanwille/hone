import { spawn } from "child_process";
import {
  SandboxManager,
  type SandboxRuntimeConfig,
} from "@anthropic-ai/sandbox-runtime";

const BASH_COMMAND = "curl www.google.com";

async function main() {
  const POLICY_FILE = new URL("srt-settings.json", import.meta.url);
  console.log("Loading sandbox policy from", POLICY_FILE.toString());
  const SANDBOX_POLICY = await Bun.file(POLICY_FILE).json();
  // Initialize once with your policy
  await SandboxManager.initialize(SANDBOX_POLICY as SandboxRuntimeConfig);

  // In your bash tool handler:
  const sandboxedCommand = await SandboxManager.wrapWithSandbox(BASH_COMMAND);
  const child = spawn(sandboxedCommand, { shell: true });

  child.stdout.on("data", (data) => {
    console.log(data.toString());
  });
  child.stderr.on("data", (data) => {
    console.error(data.toString());
  });
  child.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
  });
}

main().catch(console.error);
