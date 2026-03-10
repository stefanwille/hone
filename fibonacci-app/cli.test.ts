import { describe, it, expect } from "bun:test";
import { spawn } from "bun";

describe("CLI Tests", () => {
  it("should calculate fibonacci(5)", async () => {
    const proc = spawn(["bun", "cli.ts", "5"], {
      cwd: import.meta.dir,
    });
    const output = await new Response(proc.stdout).text();
    expect(output.trim()).toBe("Fibonacci(5) = 5");
  });

  it("should calculate fibonacci(0)", async () => {
    const proc = spawn(["bun", "cli.ts", "0"], {
      cwd: import.meta.dir,
    });
    const output = await new Response(proc.stdout).text();
    expect(output.trim()).toBe("Fibonacci(0) = 0");
  });

  it("should calculate fibonacci(20)", async () => {
    const proc = spawn(["bun", "cli.ts", "20"], {
      cwd: import.meta.dir,
    });
    const output = await new Response(proc.stdout).text();
    expect(output.trim()).toBe("Fibonacci(20) = 6765");
  });

  it("should show help with --help flag", async () => {
    const proc = spawn(["bun", "cli.ts", "--help"], {
      cwd: import.meta.dir,
    });
    const output = await new Response(proc.stdout).text();
    expect(output).toContain("Fibonacci Calculator CLI");
    expect(output).toContain("Usage:");
  });

  it("should handle invalid input gracefully", async () => {
    const proc = spawn(["bun", "cli.ts", "abc"], {
      cwd: import.meta.dir,
    });
    const exitCode = await proc.exited;
    expect(exitCode).not.toBe(0);
  });
});
