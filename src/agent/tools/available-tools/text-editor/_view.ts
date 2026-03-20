import { type } from "arktype";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export const ViewInputSchema = type({
  command: "/^view$/",
  path: "string",
  "view_range?": ["number", "number"],
  /**
   * Maximum number of characters to display when viewing a file or directory listing.
   * Omitted or null means no limit; 0 returns an empty string.
   */
  "max_characters?": "number | null",
  "+": "reject",
});

type ViewInput = typeof ViewInputSchema.infer;

function truncateToMaxCharacters(
  content: string,
  maxCharacters: number | null | undefined,
): string {
  if (typeof maxCharacters !== "number") {
    return content;
  }
  return content.slice(0, maxCharacters);
}

async function fileType(
  path: string,
): Promise<"directory" | "file" | "not_found"> {
  let stats;
  try {
    stats = await stat(path);
  } catch {
    return "not_found"; // path doesn't exist
  }
  if (stats.isDirectory()) {
    return "directory";
  }
  if (stats.isFile() || stats.isSymbolicLink()) {
    return "file";
  }
  throw new Error(`Unknown file type at path: ${path}`);
}

async function listFilesRecursive(
  dir: string,
  files: string[],
  depth: number,
  maxDepth: number,
): Promise<void> {
  if (depth > maxDepth) return;
  const entries = await readdir(dir);
  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const fullPath = join(dir, entry);
    files.push(fullPath);
    let stats;
    try {
      stats = await stat(fullPath);
    } catch {
      continue;
    }
    if (stats.isDirectory() && depth < maxDepth) {
      await listFilesRecursive(fullPath, files, depth + 1, maxDepth);
    }
  }
}

async function viewDirectory(input: ViewInput): Promise<string> {
  if (input.view_range) {
    return "Error: The `view_range` parameter is not allowed when `path` points to a directory.";
  }
  const files: string[] = [];
  await listFilesRecursive(input.path, files, 0, 1);
  files.sort();
  const content = files.join("\n");
  return truncateToMaxCharacters(content, input.max_characters);
}

function formatWithLineNumbers(lines: string[], initLine: number): string {
  return lines
    .map((line, i) => `${String(i + initLine).padStart(6)}\t${line}`)
    .join("\n");
}

async function viewFile(input: ViewInput): Promise<string> {
  const raw = await Bun.file(input.path).text();
  const lines = raw.split("\n");

  let formatted: string;
  if (input.view_range) {
    const start = input.view_range[0] - 1;
    const end = input.view_range[1] === -1 ? undefined : input.view_range[1];
    const slicedLines = lines.slice(start, end);
    formatted = formatWithLineNumbers(slicedLines, start + 1);
  } else {
    formatted = formatWithLineNumbers(lines, 1);
  }

  const content = `Here's the result of running \`cat -n\` on ${input.path}:\n${formatted}\n`;
  return truncateToMaxCharacters(content, input.max_characters);
}

export async function view(input: ViewInput): Promise<string> {
  const detected = await fileType(input.path);
  switch (detected) {
    case "directory":
      return await viewDirectory(input);
    case "file":
      return await viewFile(input);
    case "not_found":
      return `Error: File ${input.path} does not exist`;
    default:
      throw new Error(`Unknown file type at path: ${input.path}`);
  }
}
