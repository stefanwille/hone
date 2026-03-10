import { describe, it, expect } from "bun:test";
import { fibonacci } from "./fibonacci";

describe("Fibonacci Calculator", () => {
  it("should return 0 for fibonacci(0)", () => {
    expect(fibonacci(0)).toBe(0);
  });

  it("should return 1 for fibonacci(1)", () => {
    expect(fibonacci(1)).toBe(1);
  });

  it("should return 1 for fibonacci(2)", () => {
    expect(fibonacci(2)).toBe(1);
  });

  it("should return 2 for fibonacci(3)", () => {
    expect(fibonacci(3)).toBe(2);
  });

  it("should return 5 for fibonacci(5)", () => {
    expect(fibonacci(5)).toBe(5);
  });

  it("should return 89 for fibonacci(11)", () => {
    expect(fibonacci(11)).toBe(89);
  });

  it("should return 6765 for fibonacci(20)", () => {
    expect(fibonacci(20)).toBe(6765);
  });

  it("should throw error for negative numbers", () => {
    expect(() => {
      fibonacci(-1);
    }).toThrow("Fibonacci index must be non-negative");
  });

  it("should handle large numbers", () => {
    expect(fibonacci(50)).toBe(12586269025);
  });
});
