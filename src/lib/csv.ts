// CSV parse + serialise, RFC 4180, no dependencies.
//
// This exists because clients often start their contact database in a
// spreadsheet — the programme ships one — and then import it. Real exports from
// Excel, Numbers and Google Sheets contain quoted fields
// with commas inside, embedded newlines inside quotes, CRLF line endings and a
// UTF-8 BOM — a split(",") would mangle all four.

// Parses CSV text into a grid. Blank trailing lines are dropped; a lone blank
// line inside the file yields a single empty cell row, which callers filter.
export function parseCsv(input: string): string[][] {
  // Excel writes a UTF-8 BOM, which would otherwise become part of the first
  // header name and break header matching.
  const text = input.replace(/^﻿/, "");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        // "" inside a quoted field is a literal quote.
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      endField();
      i++;
      continue;
    }
    if (c === "\r") {
      // CRLF or a lone CR both end the row.
      endRow();
      i += text[i + 1] === "\n" ? 2 : 1;
      continue;
    }
    if (c === "\n") {
      endRow();
      i++;
      continue;
    }
    field += c;
    i++;
  }

  // Whatever is left after the last delimiter is the final field, unless the
  // file ended on a newline (in which case there is nothing pending).
  if (field.length || row.length) endRow();

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// A cell beginning with =, +, - or @ is executed as a formula when the file is
// opened in Excel or Sheets. A contact named "=cmd|..." pasted from anywhere
// untrusted would then run on open. Prefixing with an apostrophe neutralises it
// and is stripped by the spreadsheet on display.
function guardFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCell(value: string): string {
  const guarded = guardFormula(value ?? "");
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

// Serialises to CRLF-delimited CSV with a BOM, which is what Excel needs to read
// UTF-8 names correctly.
export function serialiseCsv(rows: (string | null | undefined)[][]): string {
  const body = rows.map((r) => r.map((c) => escapeCell(c ?? "")).join(",")).join("\r\n");
  return `﻿${body}\r\n`;
}

// Matches a header cell to a known field, tolerating case, spaces, underscores
// and the wording differences between the programme's worksheet and a hand-made
// spreadsheet.
export function normaliseHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}
