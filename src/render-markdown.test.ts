import { describe, it, expect } from "bun:test";
import { renderMarkdown, formatInline, renderToolFrame } from "./render-markdown";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const ITALIC = "\x1b[3m";
const UNDERLINE = "\x1b[4m";
const STRIKETHROUGH = "\x1b[9m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";
const GRAY = "\x1b[90m";

describe("formatInline", () => {
  it("renders bold", () => {
    expect(formatInline("hello **world**")).toBe(
      `hello ${BOLD}world${RESET}`,
    );
  });

  it("renders italic", () => {
    expect(formatInline("hello *world*")).toBe(
      `hello ${ITALIC}world${RESET}`,
    );
  });

  it("renders bold+italic", () => {
    expect(formatInline("hello ***world***")).toBe(
      `hello ${BOLD}${ITALIC}world${RESET}`,
    );
  });

  it("renders inline code", () => {
    expect(formatInline("use `foo()` here")).toBe(
      `use ${CYAN}foo()${RESET} here`,
    );
  });

  it("does not format inside inline code", () => {
    const result = formatInline("use `**not bold**` here");
    expect(result).toBe(`use ${CYAN}**not bold**${RESET} here`);
  });

  it("renders strikethrough", () => {
    expect(formatInline("~~removed~~")).toBe(
      `${STRIKETHROUGH}removed${RESET}`,
    );
  });

  it("renders links", () => {
    expect(formatInline("[click](https://example.com)")).toBe(
      `${UNDERLINE}click${RESET}${GRAY} (https://example.com)${RESET}`,
    );
  });

  it("passes plain text through unchanged", () => {
    expect(formatInline("plain text")).toBe("plain text");
  });

  it("handles multiple inline styles", () => {
    const result = formatInline("**bold** and *italic* and `code`");
    expect(result).toContain(`${BOLD}bold${RESET}`);
    expect(result).toContain(`${ITALIC}italic${RESET}`);
    expect(result).toContain(`${CYAN}code${RESET}`);
  });
});

describe("renderMarkdown", () => {
  describe("headers", () => {
    it("renders h1", () => {
      expect(renderMarkdown("# Hello")).toBe(
        `${BOLD}${MAGENTA}${UNDERLINE}Hello${RESET}`,
      );
    });

    it("renders h2", () => {
      expect(renderMarkdown("## Hello")).toBe(
        `${BOLD}${CYAN}Hello${RESET}`,
      );
    });

    it("renders h3", () => {
      expect(renderMarkdown("### Hello")).toBe(
        `${BOLD}${YELLOW}Hello${RESET}`,
      );
    });
  });

  describe("code blocks", () => {
    it("renders code block without language", () => {
      const result = renderMarkdown("```\nconst x = 1;\n```");
      const lines = result.split("\n");
      expect(lines[0]).toBe(`${DIM}┌──${RESET}`);
      expect(lines[1]).toBe(`${DIM}│ ${RESET}${GREEN}const x = 1;${RESET}`);
      expect(lines[2]).toBe(`${DIM}└──${RESET}`);
    });

    it("renders code block with language", () => {
      const result = renderMarkdown("```typescript\nconst x = 1;\n```");
      const lines = result.split("\n");
      expect(lines[0]).toBe(`${DIM}┌─ typescript ─${RESET}`);
    });

    it("renders multiple code blocks", () => {
      const result = renderMarkdown("```\na\n```\ntext\n```\nb\n```");
      const lines = result.split("\n");
      expect(lines[0]).toContain("┌");
      expect(lines[2]).toContain("└");
      expect(lines[3]).toBe("text");
      expect(lines[4]).toContain("┌");
      expect(lines[6]).toContain("└");
    });
  });

  describe("lists", () => {
    it("renders bullet list", () => {
      const result = renderMarkdown("- item one\n- item two");
      expect(result).toBe("  • item one\n  • item two");
    });

    it("renders numbered list", () => {
      const result = renderMarkdown("1. first\n2. second");
      expect(result).toBe("  1. first\n  2. second");
    });

    it("renders nested bullet list", () => {
      const result = renderMarkdown("- top\n  - mid\n    - deep");
      const lines = result.split("\n");
      expect(lines[0]).toBe("  • top");
      expect(lines[1]).toBe("    ◦ mid");
      expect(lines[2]).toBe("      ▪ deep");
    });

    it("renders nested numbered list", () => {
      const result = renderMarkdown("1. top\n  1. nested");
      const lines = result.split("\n");
      expect(lines[0]).toBe("  1. top");
      expect(lines[1]).toBe("    1. nested");
    });
  });

  describe("blockquotes", () => {
    it("renders blockquote", () => {
      const result = renderMarkdown("> some quote");
      expect(result).toBe(`${DIM}│ ${ITALIC}some quote${RESET}`);
    });

    it("renders blockquote with inline formatting", () => {
      const result = renderMarkdown("> **bold** quote");
      expect(result).toContain(`${BOLD}bold${RESET}`);
      expect(result).toContain("quote");
    });
  });

  describe("horizontal rules", () => {
    it("renders --- as horizontal rule", () => {
      expect(renderMarkdown("---")).toBe(`${DIM}${"─".repeat(40)}${RESET}`);
    });

    it("renders *** as horizontal rule", () => {
      expect(renderMarkdown("***")).toBe(`${DIM}${"─".repeat(40)}${RESET}`);
    });

    it("renders ___ as horizontal rule", () => {
      expect(renderMarkdown("___")).toBe(`${DIM}${"─".repeat(40)}${RESET}`);
    });
  });

  describe("tables", () => {
    it("renders a simple table", () => {
      const input = "| Name | Age |\n|---|---|\n| Alice | 30 |";
      const result = renderMarkdown(input);
      expect(result).toContain("┌");
      expect(result).toContain("┘");
      expect(result).toContain("│");
      expect(result).toContain("Alice");
      expect(result).toContain("30");
    });

    it("renders header row as bold", () => {
      const input = "| Name | Age |\n|---|---|\n| Bob | 25 |";
      const result = renderMarkdown(input);
      expect(result).toContain(`${BOLD}Name`);
    });

    it("renders table with multiple body rows", () => {
      const input =
        "| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |";
      const result = renderMarkdown(input);
      const lines = result.split("\n");
      // top border, header, separator, row1, row2, bottom border
      expect(lines.length).toBe(6);
    });
  });

  describe("mixed content", () => {
    it("renders paragraph with mixed inline styles", () => {
      const result = renderMarkdown(
        "This has **bold**, *italic*, and `code` in it.",
      );
      expect(result).toContain(`${BOLD}bold${RESET}`);
      expect(result).toContain(`${ITALIC}italic${RESET}`);
      expect(result).toContain(`${CYAN}code${RESET}`);
    });
  });

  describe("edge cases", () => {
    it("returns empty string for empty input", () => {
      expect(renderMarkdown("")).toBe("");
    });

    it("passes plain text through unchanged", () => {
      expect(renderMarkdown("just text")).toBe("just text");
    });
  });
});

describe("renderToolFrame", () => {
  it("renders tool name in top border", () => {
    const result = renderToolFrame("bash", { command: "ls" }, "file.ts");
    expect(result).toContain("┌─ bash ");
    expect(result).toContain("┐");
  });

  it("renders input as YELLOW", () => {
    const result = renderToolFrame("bash", { command: "ls" }, "output");
    expect(result).toContain(YELLOW);
    expect(result).toContain("command");
  });

  it("renders result separator", () => {
    const result = renderToolFrame("test", "input", "output");
    expect(result).toContain("├─ result ");
    expect(result).toContain("┤");
  });

  it("renders result content", () => {
    const result = renderToolFrame("test", "in", "hello world");
    expect(result).toContain("hello world");
  });

  it("renders bottom border", () => {
    const result = renderToolFrame("test", "in", "out");
    expect(result).toContain("└");
    expect(result).toContain("┘");
  });

  it("truncates long results", () => {
    const longResult = Array(30).fill("line").join("\n");
    const result = renderToolFrame("test", "in", longResult);
    expect(result).toContain("more lines");
  });

  it("renders object input as JSON", () => {
    const result = renderToolFrame("bash", { command: "ls", timeout: 5000 }, "out");
    expect(result).toContain('"command": "ls"');
    expect(result).toContain('"timeout": 5000');
  });

  it("renders string input directly", () => {
    const result = renderToolFrame("test", "raw input", "out");
    expect(result).toContain("raw input");
  });
});
