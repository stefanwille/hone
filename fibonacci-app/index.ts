import { fibonacci } from "./fibonacci";

async function main() {
  const stdin = process.stdin;
  
  console.log("Fibonacci Calculator");
  console.log("====================");
  console.log("Enter a number to calculate its Fibonacci value:");
  
  const input = await new Promise<string>((resolve) => {
    let data = "";
    
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      data += chunk;
    });
    
    stdin.on("end", () => {
      resolve(data.trim());
    });
  });
  
  const n = parseInt(input, 10);
  
  if (isNaN(n)) {
    console.error("Error: Please enter a valid number");
    process.exit(1);
  }
  
  try {
    const result = fibonacci(n);
    console.log(`\nFibonacci(${n}) = ${result}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
