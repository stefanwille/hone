import { type } from "arktype";

export const InsertInputSchema = type({
  command: '"insert"',
  path: "string",
  insert_line: "number",
  insert_text: "string",
  "+": "reject",
});

type InsertInput = typeof InsertInputSchema.infer;

export async function insert(input: InsertInput): Promise<string> {
  const file = Bun.file(input.path);
  if (!(await file.exists())) {
    return `Error: File ${input.path} does not exist`;
  }

  const content = await file.text();
  const lines = content.split("\n");

  // insert_line is 1-based; 0 means prepend before line 1
  const insertAt = Math.max(0, Math.min(input.insert_line, lines.length));
  lines.splice(insertAt, 0, input.insert_text);

  await Bun.write(input.path, lines.join("\n"));
  return "Success";
}
