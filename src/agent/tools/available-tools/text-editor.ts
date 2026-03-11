import { type } from "arktype";
import type { ExtendedAnthropicTool } from "../tool";
import { view, ViewInputSchema } from "./view";

// https://platform.claude.com/docs/en/agents-and-tools/tool-use/text-editor-tool

const TextEditorInputSchema = ViewInputSchema;

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
