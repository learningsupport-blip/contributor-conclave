import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const rounded = /rounded-(?:full|sm|md|lg|xl|2xl|3xl)\b/;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      return entry === "generated" ? [] : sourceFiles(fullPath);
    }
    return fullPath.endsWith(".tsx") ? [fullPath] : [];
  });
}

describe("button shape", () => {
  it("keeps buttons and button links as sharp rectangles", () => {
    const failures = sourceFiles(path.join(root, "src")).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const relative = path.relative(root, file);
      const buttons = source.match(/<button\b[^>]*>/g) ?? [];
      const buttonFailures = buttons
        .filter((tag) => rounded.test(tag))
        .map((tag) => `${relative}: ${tag.replace(/\s+/g, " ")}`);
      const linkFailures =
        relative === "src/components/ui/button-link.tsx" && rounded.test(source) ? [relative] : [];
      return [...buttonFailures, ...linkFailures];
    });

    expect(failures).toEqual([]);
  });
});
