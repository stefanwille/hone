import { type } from "arktype";
import { readdir, stat } from "node:fs/promises";

export const ViewInputSchema = type({
  command: "/^view$/",
  path: "string",
  "view_range?": ["number", "number"],
  /**
   * Maximum number of characters to display when viewing a file. If not specified,
   * defaults to displaying the full file.
   */
  "max_characters?": "number | null",
  "+": "reject",
});

type ViewInput = typeof ViewInputSchema.infer;

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

async function viewDirectory(input: ViewInput): Promise<string> {
  if (input.view_range) {
    return "Error: text editor view command on a directory does not support view_range";
  }
  const entries = await readdir(input.path);
  let content = entries.join("\n");
  if (input.max_characters) {
    content = content.slice(0, input.max_characters);
  }
  return content;
}

async function viewFile(input: ViewInput): Promise<string> {
  let content = await Bun.file(input.path).text();
  if (input.view_range) {
    const lines = content.split("\n");
    const start = input.view_range[0] - 1;
    const end = input.view_range[1] === -1 ? undefined : input.view_range[1];
    const slicedLines = lines.slice(start, end);
    content = slicedLines.join("\n");
  }

  if (input.max_characters) {
    content = content.slice(0, input.max_characters);
  }
  return content;
}

export async function view(input: ViewInput): Promise<string> {
  const detected = await fileType(input.path);
  switch (detected) {
    case "directory":
      return await viewDirectory(input);
    case "file":
      return await viewFile(input);
    case "not_found":
      return `File ${input.path} does not exist`;
    default:
      throw new Error(`Unknown file type at path: ${input.path}`);
  }
}
