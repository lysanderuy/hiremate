import { describe, expect, it } from "vitest";

import { createSkillMatcher } from "./extract-skills";

const lexicon = [
  { name: "java", aliases: [] },
  { name: "javascript", aliases: ["js"] },
  { name: "power", aliases: [] },
  { name: "power bi", aliases: ["powerbi"] },
  { name: "c++", aliases: [] },
  { name: "c#", aliases: [] },
  { name: "c", aliases: [] },
  { name: "node.js", aliases: ["nodejs"] },
  { name: "sql", aliases: [] },
];

const match = createSkillMatcher(lexicon);

describe("createSkillMatcher", () => {
  it("prefers the longest name at a position", () => {
    expect(match("Experienced with Power BI dashboards")).toEqual(["power bi"]);
  });

  it("handles c++ and c# without matching plain c", () => {
    expect(match("Wrote C++ and C# services")).toEqual(["c#", "c++"]);
  });

  it("maps aliases to the canonical name", () => {
    expect(match("Strong JS skills")).toEqual(["javascript"]);
  });

  it("does not match inside longer words", () => {
    expect(match("javascript only")).toEqual(["javascript"]);
    expect(match("sqlite and mysql")).toEqual([]);
  });

  it("is case-insensitive", () => {
    expect(match("JAVA, Sql")).toEqual(["java", "sql"]);
  });

  it("dedupes and sorts results", () => {
    expect(match("sql SQL java js javascript")).toEqual(["java", "javascript", "sql"]);
  });

  it("returns an empty list for empty inputs", () => {
    expect(match("")).toEqual([]);
    expect(createSkillMatcher([])("java")).toEqual([]);
  });

  it("treats accented letters as part of a word", () => {
    expect(match("Développeur sql, ésql, sqlé")).toEqual(["sql"]);
  });

  it("lets an entry name win over another entry's alias", () => {
    const named = createSkillMatcher([
      { name: "spring boot", aliases: ["spring framework"] },
      { name: "spring framework", aliases: [] },
    ]);
    expect(named("Spring Framework")).toEqual(["spring framework"]);
  });

  it("matches names containing a dot", () => {
    expect(match("Built APIs in Node.js and nodejs")).toEqual(["node.js"]);
    expect(match("nodexjs")).toEqual([]);
  });
});
