import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findIconFlipIssues } from "./support/rtlIcons";

const flipped = 'className="size-5 rtl:-scale-x-100"';

describe("findIconFlipIssues", () => {
  it("exige rtl:-scale-x-100 sur une icône de direction de lucide", () => {
    const source = `import { ChevronRight, Search } from "lucide-react";\n<ChevronRight aria-hidden="true" className="size-5" />`;
    expect(findIconFlipIssues(source)).toEqual([{ icon: "ChevronRight", line: 2, problem: "not-flipped" }]);
  });

  it("refuse rtl:-scale-x-100 sur une icône sans direction", () => {
    const source = `import { Search } from "lucide-react";\n<Search ${flipped} />`;
    expect(findIconFlipIssues(source)).toEqual([{ icon: "Search", line: 2, problem: "flipped" }]);
  });

  it("lit une balise sur plusieurs lignes et un import sur plusieurs lignes", () => {
    const source = `import {\n  ChevronLeft,\n  X,\n} from "lucide-react";\n<ChevronLeft\n  aria-hidden="true"\n  ${flipped}\n/>\n<X className="size-6" />`;
    expect(findIconFlipIssues(source)).toEqual([]);
  });

  it("ne regarde que les icônes importées de lucide-react", () => {
    expect(findIconFlipIssues(`import { Play } from "./ui";\n<Play />`)).toEqual([]);
  });

  it("suit une icône passée en prop (Icon={LogOut}) avec flipIcon", () => {
    const source = `import { LogOut, House } from "lucide-react";\n<MenuAction Icon={LogOut} label="x" />\n<MenuLink Icon={House} flipIcon />`;
    expect(findIconFlipIssues(source)).toEqual([
      { icon: "LogOut", line: 2, problem: "not-flipped" },
      { icon: "House", line: 3, problem: "flipped" },
    ]);
  });
});

/** Tous les .tsx de src/. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

describe("les icônes de src/", () => {
  it("se retournent en arabe si elles indiquent une direction, et seulement dans ce cas", () => {
    const root = path.resolve(__dirname, "../../../src");
    const issues = sourceFiles(root).flatMap((file) =>
      findIconFlipIssues(readFileSync(file, "utf8")).map(
        (issue) => `${path.relative(root, file)}:${issue.line} ${issue.icon} ${issue.problem}`,
      ),
    );
    expect(issues).toEqual([]);
  });
});
