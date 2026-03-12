import { describe, expect, test } from "bun:test";
import { fib } from "./fibonacci";

describe("fib", () => {
  test("base cases", () => {
    expect(fib(0)).toBe(0);
    expect(fib(1)).toBe(1);
  });

  test("known values", () => {
    expect(fib(2)).toBe(1);
    expect(fib(6)).toBe(8);
    expect(fib(10)).toBe(55);
    expect(fib(20)).toBe(6765);
  });

  test("negative throws", () => {
    expect(() => fib(-1)).toThrow(RangeError);
  });
});
