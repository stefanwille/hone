import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

export class BashSession {
  private process: ChildProcessWithoutNullStreams = this.createBashProcess();
  private outputBuffer = "";
  private readonly SENTINEL = `DONE_${crypto.randomUUID().replace(/-/g, "")}`;

  public async run(command: string, timeoutMs = 120_000): Promise<string> {
    this.outputBuffer = "";

    // Write command + sentinel so we know when output is done
    this.process.stdin.write(`${command}\necho "${this.SENTINEL}"\n`);

    return new Promise((resolve, reject) => {
      let poll: ReturnType<typeof setInterval>;

      const timer = setTimeout(() => {
        clearInterval(poll);
        this.restart();
        reject(new Error(`Command timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      poll = setInterval(() => {
        if (this.outputBuffer.includes(this.SENTINEL)) {
          clearInterval(poll);
          clearTimeout(timer);
          const output = this.outputBuffer
            .replace(this.SENTINEL + "\n", "")
            .trim();
          resolve(output.slice(0, 30_000));
        }
      }, 50);
    });
  }

  public restart() {
    this.process.stdout.removeAllListeners();
    this.process.stderr.removeAllListeners();
    this.process.kill();
    this.outputBuffer = "";
    this.process = this.createBashProcess();
  }

  private createBashProcess() {
    const bashProcess = spawn("bash", []);
    bashProcess.stdout.on("data", (d) => (this.outputBuffer += d.toString()));
    bashProcess.stderr.on("data", (d) => (this.outputBuffer += d.toString()));
    return bashProcess;
  }
}
