import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function collectTsxFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return collectTsxFiles(path);
    }

    return path.endsWith(".tsx") ? [path] : [];
  });
}

function hasDivLabInputWithHardCodedWhiteText(source: string): boolean {
  const classNames = source.match(/className="[^"]*"/g) ?? [];

  return classNames.some(
    (className) =>
      className.includes("divlab-input") && className.includes("text-white"),
  );
}

describe("light theme contrast regressions", () => {
  it("never hard-codes white text on semantic DivLab input controls", () => {
    const files = [
      ...collectTsxFiles(join(root, "app")),
      ...collectTsxFiles(join(root, "components")),
    ];
    const offenders = files
      .filter((file) => hasDivLabInputWithHardCodedWhiteText(readFileSync(file, "utf8")))
      .map((file) => file.replace(`${root}/`, ""));

    assert.deepEqual(offenders, []);
  });

  it("uses semantic text colors in the calendar event preview", () => {
    const calendar = readFileSync(
      join(root, "components/calendar/CalendarHub.tsx"),
      "utf8",
    );

    assert.match(calendar, /bg-divlab-blue\/5/);
    assert.match(calendar, /selectedEvent\.company[\s\S]*text-divlab-text|text-divlab-text[\s\S]*selectedEvent\.company/);
    assert.doesNotMatch(calendar, /bg-divlab-blue\/5[\s\S]{0,500}text-white/);
  });

  it("keeps the shared DivLab input primitive theme-aware", () => {
    const globals = readFileSync(join(root, "app/globals.css"), "utf8");

    assert.match(
      globals,
      /\.divlab-input\s*\{[\s\S]*text-divlab-text[\s\S]*\}/,
    );
  });
});
