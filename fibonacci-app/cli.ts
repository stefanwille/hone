import { fibonacci } from "./fibonacci";

function printUsage() {
  console.log("Fibonacci Calculator CLI");
  console.log("=======================");
  console.log("\nUsage:");
  console.log("  bun cli.ts <number>    Calculate the Fibonacci number for the given index");
  console.log("  bun cli.ts --help      Show this help message");
  console.log("\nExamples:");
  console.log("  bun cli.ts 10          # Calculate Fibonacci(10)");
  console.log("  bun cli.ts 0           # Calculate Fibonacci(0)");
  console.log("  bun cli.ts 50          # Calculate Fibonacci(50)");
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  const input = args[0];
  const n = parseInt(input, 10);

  if (isNaN(n)) {
    console.error(`Error: '${input}' is not a valid number`);
    process.exit(1);
  }

  try {
    const result = fibonacci(n);
    console.log(`Fibonacci(${n}) = ${result}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
