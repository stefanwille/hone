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

export function formatInline(text: string): string {
  // 1. Inline code — protect contents from further formatting
  const codeSegments: string[] = [];
  text = text.replace(/`([^`]+)`/g, (_match, code) => {
    const placeholder = `\x00CODE${codeSegments.length}\x00`;
    codeSegments.push(`${CYAN}${code}${RESET}`);
    return placeholder;
  });

  // 2. Bold+italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, `${BOLD}${ITALIC}$1${RESET}`);

  // 3. Bold
  text = text.replace(/\*\*(.+?)\*\*/g, `${BOLD}$1${RESET}`);

  // 4. Italic (single * not preceded/followed by *)
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, `${ITALIC}$1${RESET}`);

  // 5. Strikethrough
  text = text.replace(/~~(.+?)~~/g, `${STRIKETHROUGH}$1${RESET}`);

  // 6. Links
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `${UNDERLINE}$1${RESET}${GRAY} ($2)${RESET}`,
  );

  // Restore inline code
  text = text.replace(/\x00CODE(\d+)\x00/g, (_m, idx) => codeSegments[+idx]!);

  return text;
}

function renderTable(tableLines: string[]): string {
  const rows: string[][] = [];
  let headerIndex = -1;

  for (let i = 0; i < tableLines.length; i++) {
    const line = tableLines[i]!;
    // Skip separator rows
    if (/^\|[\s-:|]+\|$/.test(line.trim())) {
      if (rows.length > 0) headerIndex = rows.length - 1;
      continue;
    }
    const cells = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    rows.push(cells);
  }

  if (rows.length === 0) return "";

  const colCount = Math.max(...rows.map((r) => r.length));
  const colWidths: number[] = Array(colCount).fill(0);
  for (const row of rows) {
    for (let i = 0; i < colCount; i++) {
      const cell = row[i] ?? "";
      colWidths[i] = Math.max(colWidths[i]!, cell.length);
    }
  }

  const hLine = (left: string, mid: string, right: string, fill: string) =>
    DIM +
    left +
    colWidths.map((w) => fill.repeat(w + 2)).join(mid) +
    right +
    RESET;

  const output: string[] = [];
  output.push(hLine("┌", "┬", "┐", "─"));

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    const cells = colWidths.map((w, i) => {
      const cell = row[i] ?? "";
      const padded = cell.padEnd(w);
      const isHeader = headerIndex >= 0 && r <= headerIndex;
      return isHeader ? `${BOLD}${padded}${RESET}` : formatInline(padded);
    });
    output.push(
      DIM + "│" + RESET + " " +
      cells.join(` ${DIM}│${RESET} `) +
      " " + DIM + "│" + RESET,
    );

    if (r === headerIndex) {
      output.push(hLine("├", "┼", "┤", "─"));
    }
  }

  output.push(hLine("└", "┴", "┘", "─"));
  return output.join("\n");
}

function nestDepth(indent: string): number {
  return Math.floor(indent.length / 2);
}

const bulletMarkers = ["•", "◦", "▪"];

export function renderToolFrame(
  name: string,
  input: unknown,
  result: string,
): string {
  const width = 50;
  const output: string[] = [];

  // Top border with tool name
  const topLabel = ` ${name} `;
  const topPad = Math.max(0, width - 2 - topLabel.length);
  output.push(DIM + "┌─" + topLabel + "─".repeat(topPad) + "┐" + RESET);

  // Input lines
  const inputStr =
    typeof input === "string" ? input : JSON.stringify(input, null, 2);
  for (const line of inputStr.split("\n")) {
    output.push(DIM + "│ " + RESET + YELLOW + line + RESET);
  }

  // Separator with "result" label
  const midLabel = " result ";
  const midPad = Math.max(0, width - 2 - midLabel.length);
  output.push(DIM + "├─" + midLabel + "─".repeat(midPad) + "┤" + RESET);

  // Result lines (truncate if too long)
  const resultLines = result.split("\n");
  const maxLines = 20;
  const truncated = resultLines.length > maxLines;
  const displayLines = truncated
    ? resultLines.slice(0, maxLines)
    : resultLines;
  for (const line of displayLines) {
    output.push(DIM + "│ " + RESET + line);
  }
  if (truncated) {
    output.push(
      DIM +
        "│ " +
        RESET +
        GRAY +
        `... (${resultLines.length - maxLines} more lines)` +
        RESET,
    );
  }

  // Bottom border
  output.push(DIM + "└" + "─".repeat(width) + "┘" + RESET);
  return output.join("\n");
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const output: string[] = [];
  let inCodeBlock = false;
  let codeLang = "";
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      output.push(renderTable(tableBuffer));
      tableBuffer = [];
    }
  };

  for (const line of lines) {
    // Table accumulation
    if (!inCodeBlock && /^\|/.test(line.trim())) {
      tableBuffer.push(line);
      continue;
    }
    flushTable();

    // Code fence
    const trimmed = line.trimStart();
    if (trimmed.startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
        output.push(
          DIM + "┌─" + (codeLang ? " " + codeLang + " " : "") + "─" + RESET,
        );
      } else {
        inCodeBlock = false;
        codeLang = "";
        output.push(DIM + "└──" + RESET);
      }
      continue;
    }

    if (inCodeBlock) {
      output.push(DIM + "│ " + RESET + GREEN + line + RESET);
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headerMatch) {
      const level = headerMatch[1]!.length;
      const text = headerMatch[2]!;
      if (level === 1) {
        output.push(`${BOLD}${MAGENTA}${UNDERLINE}${text}${RESET}`);
      } else if (level === 2) {
        output.push(`${BOLD}${CYAN}${text}${RESET}`);
      } else {
        output.push(`${BOLD}${YELLOW}${text}${RESET}`);
      }
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      output.push(DIM + "─".repeat(40) + RESET);
      continue;
    }

    // Blockquote
    const quoteMatch = line.match(/^>\s?(.*)/);
    if (quoteMatch) {
      output.push(
        DIM + "│ " + ITALIC + formatInline(quoteMatch[1]!) + RESET,
      );
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (bulletMatch) {
      const depth = nestDepth(bulletMatch[1]!);
      const marker = bulletMarkers[Math.min(depth, bulletMarkers.length - 1)]!;
      const indent = "  ".repeat(depth);
      output.push(`${indent}  ${marker} ${formatInline(bulletMatch[2]!)}`);
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (numMatch) {
      const depth = nestDepth(numMatch[1]!);
      const indent = "  ".repeat(depth);
      output.push(
        `${indent}  ${numMatch[2]}. ${formatInline(numMatch[3]!)}`,
      );
      continue;
    }

    // Regular line
    output.push(formatInline(line));
  }

  flushTable();
  return output.join("\n");
}
