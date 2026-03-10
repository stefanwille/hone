// I want to learn the Spawn API in Node.js.

import { spawn } from "child_process";

async function main() {
  const proc = spawn("ls", ["-l"]);

  proc.stdout.on("data", (data) => {
    console.log(data.toString());
  });
  proc.stderr.on("data", (data) => {
    console.error(data.toString());
  });
  proc.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
  });
}

main().catch(console.error);
