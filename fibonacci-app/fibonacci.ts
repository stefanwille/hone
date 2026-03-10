/**
 * Calculates the nth Fibonacci number
 * @param n - The position in the Fibonacci sequence
 * @returns The nth Fibonacci number
 */
export function fibonacci(n: number): number {
  if (n < 0) {
    throw new Error("Fibonacci index must be non-negative");
  }
  if (n === 0) return 0;
  if (n === 1) return 1;

  let prev = 0;
  let current = 1;

  for (let i = 2; i <= n; i++) {
    const next = prev + current;
    prev = current;
    current = next;
  }

  return current;
}
