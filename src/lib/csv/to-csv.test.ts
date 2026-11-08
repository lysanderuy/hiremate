import { describe, expect, it } from "vitest";

import { csvFileName, toCsv } from "./to-csv";

const BOM = "﻿";

describe("toCsv", () => {
  it("starts with a BOM and uses CRLF", () => {
    const csv = toCsv(["a", "b"], [["1", "2"]]);
    expect(csv.startsWith(BOM)).toBe(true);
    expect(csv).toBe(`${BOM}a,b\r\n1,2\r\n`);
  });

  it("outputs only the header when there are no rows", () => {
    expect(toCsv(["a", "b"], [])).toBe(`${BOM}a,b\r\n`);
  });

  it("quotes cells with commas, quotes and newlines", () => {
    const csv = toCsv(["h"], [["a,b"], ['say "hi"'], ["line1\nline2"], ["cr\rcell"]]);
    expect(csv).toBe(`${BOM}h\r\n"a,b"\r\n"say ""hi"""\r\n"line1\nline2"\r\n"cr\rcell"\r\n`);
  });

  it.each(["=SUM(A1)", "+1", "-1", "@cmd"])("prefixes %s with a single quote", (value) => {
    expect(toCsv(["h"], [[value]])).toBe(`${BOM}h\r\n'${value}\r\n`);
  });

  it("prefixes a leading tab and carriage return", () => {
    expect(toCsv(["h"], [["\t=1"]])).toBe(`${BOM}h\r\n'\t=1\r\n`);
    expect(toCsv(["h"], [["\r=1"]])).toBe(`${BOM}h\r\n"'\r=1"\r\n`);
  });

  it("does not prefix numbers", () => {
    expect(toCsv(["h"], [[-5], [0], [12.5]])).toBe(`${BOM}h\r\n-5\r\n0\r\n12.5\r\n`);
  });

  it("renders null and undefined as empty cells", () => {
    expect(toCsv(["a", "b", "c"], [[null, undefined, "x"]])).toBe(`${BOM}a,b,c\r\n,,x\r\n`);
  });

  it("combines formula prefix with escaping", () => {
    expect(toCsv(["h"], [["=A1,B1"]])).toBe(`${BOM}h\r\n"'=A1,B1"\r\n`);
  });
});

describe("csvFileName", () => {
  const date = new Date("2026-03-04T23:59:59.000Z");

  it("builds prefix_date.csv from the UTC date", () => {
    expect(csvFileName("users", date)).toBe("users_2026-03-04.csv");
  });

  it("sanitises unsafe characters", () => {
    expect(csvFileName('../my "file"/x', date)).toBe("my_file_x_2026-03-04.csv");
  });

  it("falls back to export", () => {
    expect(csvFileName("???", date)).toBe("export_2026-03-04.csv");
  });
});
