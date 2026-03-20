import { type } from "arktype";

export const StrReplaceInputSchema = type({
  command: '"str_replace"',
  path: "string",
  old_str: "string",
  new_str: "string",
  "+": "reject",
});

type StrReplaceInput = typeof StrReplaceInputSchema.infer;

export async function strReplace(input: StrReplaceInput): Promise<string> {
  const file = Bun.file(input.path);
  if (!(await file.exists())) {
    return `Error: File ${input.path} does not exist`;
  }

  if (input.old_str === "") {
    return "Error: old_str must not be empty.";
  }

  const content = await file.text();
  const count = content.split(input.old_str).length - 1;

  if (count === 0) {
    return "Error: No match found for replacement text. Check your text and try again.";
  }
  if (count > 1) {
    return `Error: Found ${count} matches for replacement text. Provide more context to make a unique match.`;
  }

  const newContent = content.replace(input.old_str, input.new_str);
  await Bun.write(input.path, newContent);
  return "Success";
}
