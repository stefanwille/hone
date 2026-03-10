import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

export type BashToolInput =
  | { command: string; timeout?: number; restart?: never }
  | { restart: true; command?: never; timeout?: never };

export class BashSession {
  private process: ChildProcessWithoutNullStreams;
  private outputBuffer = "";
  private readonly SENTINEL = "__DONE__";

  constructor() {
    this.process = spawn("bash", [], { env: process.env });
    this.process.stdout.on("data", (d) => (this.outputBuffer += d.toString()));
    this.process.stderr.on("data", (d) => (this.outputBuffer += d.toString()));
  }

  async run(command: string, timeoutMs = 120_000): Promise<string> {
    this.outputBuffer = "";

    // Write command + sentinel so we know when output is done
    this.process.stdin.write(`${command}\necho "${this.SENTINEL}"\n`);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Command timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const poll = setInterval(() => {
        if (this.outputBuffer.includes(this.SENTINEL)) {
          clearInterval(poll);
          clearTimeout(timer);
          const output = this.outputBuffer
            .replace(this.SENTINEL + "\n", "")
            .trim();
          resolve(output.slice(0, 30_000)); // match Claude Code's truncation
        }
      }, 50);
    });
  }

  restart() {
    this.process.kill();
    this.outputBuffer = "";
    this.process = spawn("bash", [], { env: process.env });
    this.process.stdout.on("data", (d) => (this.outputBuffer += d.toString()));
    this.process.stderr.on("data", (d) => (this.outputBuffer += d.toString()));
  }
}
