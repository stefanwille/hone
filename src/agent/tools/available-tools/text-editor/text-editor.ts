import { type } from "arktype";
import type { ExtendedAnthropicTool, ToolResult } from "../../tool";
import { strReplace, StrReplaceInputSchema } from "./_str_replace";
import { view, ViewInputSchema } from "./_view";

// https://platform.claude.com/docs/en/agents-and-tools/tool-use/text-editor-tool

const TextEditorInputSchema = ViewInputSchema.or(StrReplaceInputSchema);

// oxlint-disable-line typescript-eslint/no-explicit-any
type Command = (input: any) => Promise<ToolResult>;

const CommandMapping: Record<string, Command> = {
  view: view,
  str_replace: strReplace,
};

export const textEditor: ExtendedAnthropicTool = {
  type: "text_editor_20250728",
  name: "str_replace_based_edit_tool",
  run: async (input: unknown) => {
    const commandName =
      typeof input === "object" && input !== null && "command" in input
        ? input.command
        : null;
    if (typeof commandName !== "string") {
      return `Error: Invalid command`;
    }
    const command = CommandMapping[commandName];
    if (!command) {
      return `Unknown command ${commandName}`;
    }
    const parsedInput = TextEditorInputSchema(input);
    if (parsedInput instanceof type.errors) {
      console.error(
        "Text editor tool: invalid input",
        input,
        parsedInput.summary,
      );
      return `Error: Invalid input: ${parsedInput.summary}`;
    }
    return await command(parsedInput);
  },
};
