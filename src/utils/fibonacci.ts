/**
 * Returns the nth Fibonacci number (0-indexed).
 * fib(0) = 0, fib(1) = 1, fib(2) = 1, ...
 */
export function fib(n: number): number {
  if (n < 0) throw new RangeError(`n must be >= 0, got ${n}`);
  if (n === 0) return 0;
  let a = 0;
  let b = 1;
  for (let i = 1; i < n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}
