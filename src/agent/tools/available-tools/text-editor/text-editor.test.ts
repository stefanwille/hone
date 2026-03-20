import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { unlink, mkdir, rmdir } from "node:fs/promises";
import { textEditor } from "./text-editor";

const TMP_FILE = "/tmp/text-editor-test-main.txt";
const TMP_DIR = "/tmp/text-editor-test-dir";

describe("textEditor - view", () => {
  beforeEach(async () => {
    await Bun.write(TMP_FILE, "line one\nline two\nline three\n");
  });

  afterEach(async () => {
    await unlink(TMP_FILE).catch(() => {});
  });

  it("returns full file content", async () => {
    const result = await textEditor.run({ command: "view", path: TMP_FILE });
    expect(result).toBe("line one\nline two\nline three\n");
  });

  it("returns a subset of lines when view_range is provided", async () => {
    const result = await textEditor.run({
      command: "view",
      path: TMP_FILE,
      view_range: [2, 3],
    });
    expect(result).toBe("line two\nline three");
  });

  it("truncates output when max_characters is set", async () => {
    const result = await textEditor.run({
      command: "view",
      path: TMP_FILE,
      max_characters: 8,
    });
    expect(result).toBe("line one");
  });

  it("returns empty string when max_characters is zero for a file", async () => {
    const result = await textEditor.run({
      command: "view",
      path: TMP_FILE,
      max_characters: 0,
    });
    expect(result).toBe("");
  });

  it("returns directory listing for a directory", async () => {
    await mkdir(TMP_DIR, { recursive: true });
    await Bun.write(`${TMP_DIR}/alpha.txt`, "a");
    await Bun.write(`${TMP_DIR}/beta.txt`, "b");

    const result = await textEditor.run({ command: "view", path: TMP_DIR });

    expect(result).toContain("alpha.txt");
    expect(result).toContain("beta.txt");

    await unlink(`${TMP_DIR}/alpha.txt`);
    await unlink(`${TMP_DIR}/beta.txt`);
    await rmdir(TMP_DIR);
  });

  it("returns empty string when max_characters is zero for a directory", async () => {
    await mkdir(TMP_DIR, { recursive: true });
    await Bun.write(`${TMP_DIR}/alpha.txt`, "a");

    const result = await textEditor.run({
      command: "view",
      path: TMP_DIR,
      max_characters: 0,
    });

    expect(result).toBe("");

    await unlink(`${TMP_DIR}/alpha.txt`);
    await rmdir(TMP_DIR);
  });

  it("returns error for a non-existent path", async () => {
    const result = await textEditor.run({
      command: "view",
      path: "/tmp/does-not-exist-text-editor.txt",
    });
    expect(result).toContain("does not exist");
  });
});

describe("textEditor - str_replace", () => {
  beforeEach(async () => {
    await Bun.write(TMP_FILE, "hello world\n");
  });

  afterEach(async () => {
    await unlink(TMP_FILE).catch(() => {});
  });

  it("returns Success and writes updated content", async () => {
    const result = await textEditor.run({
      command: "str_replace",
      path: TMP_FILE,
      old_str: "hello",
      new_str: "goodbye",
    });
    expect(result).toBe("Success");

    const content = await Bun.file(TMP_FILE).text();
    expect(content).toBe("goodbye world\n");
  });

  it("returns error when path does not exist", async () => {
    const result = await textEditor.run({
      command: "str_replace",
      path: "/tmp/no-such-file-text-editor.txt",
      old_str: "hello",
      new_str: "goodbye",
    });
    expect(result).toContain("does not exist");
  });

  it("returns error when old_str has no match", async () => {
    const result = await textEditor.run({
      command: "str_replace",
      path: TMP_FILE,
      old_str: "not present",
      new_str: "something",
    });
    expect(result).toContain("No match found");
  });

  it("returns error when old_str matches more than once", async () => {
    await Bun.write(TMP_FILE, "foo foo\n");
    const result = await textEditor.run({
      command: "str_replace",
      path: TMP_FILE,
      old_str: "foo",
      new_str: "bar",
    });
    expect(result).toContain("2");
  });
});

describe("textEditor - create", () => {
  const TMP_CREATE_FILE = "/tmp/text-editor-create-test.txt";
  const TMP_CREATE_DIR = "/tmp/text-editor-create-test-dir";
  const TMP_CREATE_NESTED = "/tmp/text-editor-create-nested/sub/file.txt";

  afterEach(async () => {
    await unlink(TMP_CREATE_FILE).catch(() => {});
    await unlink(TMP_CREATE_NESTED).catch(() => {});
    await rmdir("/tmp/text-editor-create-nested/sub").catch(() => {});
    await rmdir("/tmp/text-editor-create-nested").catch(() => {});
    await rmdir(TMP_CREATE_DIR).catch(() => {});
  });

  it("creates a file with given content", async () => {
    const result = await textEditor.run({
      command: "create",
      path: TMP_CREATE_FILE,
      file_text: "hello create\n",
    });
    expect(result).toBe("Success");

    const content = await Bun.file(TMP_CREATE_FILE).text();
    expect(content).toBe("hello create\n");
  });

  it("creates a file with empty content", async () => {
    const result = await textEditor.run({
      command: "create",
      path: TMP_CREATE_FILE,
      file_text: "",
    });
    expect(result).toBe("Success");

    const content = await Bun.file(TMP_CREATE_FILE).text();
    expect(content).toBe("");
  });

  it("creates parent directories if they do not exist", async () => {
    const result = await textEditor.run({
      command: "create",
      path: TMP_CREATE_NESTED,
      file_text: "nested\n",
    });
    expect(result).toBe("Success");

    const content = await Bun.file(TMP_CREATE_NESTED).text();
    expect(content).toBe("nested\n");
  });

  it("returns error when file already exists", async () => {
    await Bun.write(TMP_CREATE_FILE, "existing\n");
    const result = await textEditor.run({
      command: "create",
      path: TMP_CREATE_FILE,
      file_text: "new content\n",
    });
    expect(result).toContain("already exists");
  });

  it("returns error when path is a directory", async () => {
    await mkdir(TMP_CREATE_DIR, { recursive: true });
    const result = await textEditor.run({
      command: "create",
      path: TMP_CREATE_DIR,
      file_text: "content\n",
    });
    expect(result).toContain("directory");
  });

  it("returns Invalid input when file_text is missing", async () => {
    const spy = spyOn(console, "error").mockImplementation(() => {});
    const result = await textEditor.run({
      command: "create",
      path: TMP_CREATE_FILE,
    });
    spy.mockRestore();
    expect(result).toContain("Error: Invalid input");
  });
});

describe("textEditor - insert", () => {
  beforeEach(async () => {
    await Bun.write(TMP_FILE, "line one\nline two\nline three\n");
  });

  afterEach(async () => {
    await unlink(TMP_FILE).catch(() => {});
  });

  it("inserts text after a middle line", async () => {
    const result = await textEditor.run({
      command: "insert",
      path: TMP_FILE,
      insert_line: 1,
      insert_text: "line inserted",
    });
    expect(result).toBe("Success");

    const content = await Bun.file(TMP_FILE).text();
    expect(content).toBe("line one\nline inserted\nline two\nline three\n");
  });

  it("inserts text after the last line", async () => {
    const result = await textEditor.run({
      command: "insert",
      path: TMP_FILE,
      insert_line: 3,
      insert_text: "line four",
    });
    expect(result).toBe("Success");

    const content = await Bun.file(TMP_FILE).text();
    expect(content).toBe("line one\nline two\nline three\nline four\n");
  });

  it("prepends text when insert_line is 0", async () => {
    const result = await textEditor.run({
      command: "insert",
      path: TMP_FILE,
      insert_line: 0,
      insert_text: "line zero",
    });
    expect(result).toBe("Success");

    const content = await Bun.file(TMP_FILE).text();
    expect(content).toBe("line zero\nline one\nline two\nline three\n");
  });

  it("returns error when file does not exist", async () => {
    const result = await textEditor.run({
      command: "insert",
      path: "/tmp/no-such-file-insert.txt",
      insert_line: 1,
      insert_text: "hello",
    });
    expect(result).toContain("does not exist");
  });

  it("returns Invalid input when insert_text is missing", async () => {
    const spy = spyOn(console, "error").mockImplementation(() => {});
    const result = await textEditor.run({
      command: "insert",
      path: TMP_FILE,
      insert_line: 1,
    });
    spy.mockRestore();
    expect(result).toContain("Error: Invalid input");
  });
});

describe("textEditor - input validation", () => {
  it("returns error when command is missing", async () => {
    const result = await textEditor.run({});
    expect(result).toBe("Error: Invalid command");
  });

  it("returns error when command is not a string", async () => {
    const result = await textEditor.run({ command: 42, path: "/tmp/x" });
    expect(result).toBe("Error: Invalid command");
  });

  it("returns Unknown command for an unrecognised command name", async () => {
    const result = await textEditor.run({
      command: "delete",
      path: "/tmp/x",
    });
    expect(result).toBe("Unknown command delete");
  });

  it("returns Invalid input for a known command with bad arguments", async () => {
    const spy = spyOn(console, "error").mockImplementation(() => {});
    const result = await textEditor.run({ command: "view" });
    spy.mockRestore();
    expect(result).toContain("Error: Invalid input");
  });
});
