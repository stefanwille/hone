import { readdir, stat } from "node:fs/promises";
import { type } from "arktype";
import type { ExtendedAnthropicTool } from "../tool";

// https://platform.claude.com/docs/en/agents-and-tools/tool-use/text-editor-tool

const ViewInputSchema = type({
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

const TextEditorInputSchema = ViewInputSchema;

async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false; // path doesn't exist
  }
}

async function view(input: typeof ViewInputSchema.infer): Promise<string> {
  if (await isDirectory(input.path)) {
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

  const file = Bun.file(input.path);
  if (!(await file.exists())) {
    return `File ${input.path} does not exist`;
  }

  // It is a file
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

export const textEditor: ExtendedAnthropicTool = {
  type: "text_editor_20250728",
  name: "str_replace_based_edit_tool",
  run: async (input: unknown) => {
    const parsedInput = TextEditorInputSchema(input);
    if (parsedInput instanceof type.errors) {
      console.error(
        "Text editor tool: invalid input",
        input,
        parsedInput.summary,
      );
      return `Invalid input: ${parsedInput.summary}`;
    }
    switch (parsedInput.command) {
      case "view":
        return await view(parsedInput);
      default:
        return "Text editor tool called";
    }
  },
};
