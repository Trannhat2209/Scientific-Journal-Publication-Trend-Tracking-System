import fs from "node:fs";
import path from "node:path";

const roots = ["src", "server", "tests", "scripts", "ScientificJournalTrendSystem"];
const ignored = new Set(["node_modules", "dist", "bin", "obj", ".git", ".artifacts"]);
const extensions = new Set([".js", ".jsx", ".mjs", ".json", ".css", ".cs", ".csproj", ".sql", ".md"]);
const suspicious = [/\uFFFD/u, /â(?:œ|š|€™|€|€“|€”)/u, /Ã(?:¡|©|¨|ª|´|¶|¹|º|»|¼|½|¾)/u];
const decoder = new TextDecoder("utf-8", { fatal: true });
const failures = [];

function scan(target) {
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      scan(fullPath);
      continue;
    }
    if (!extensions.has(path.extname(entry.name).toLowerCase())) continue;
    try {
      const text = decoder.decode(fs.readFileSync(fullPath));
      const lines = text.split(/\r?\n/u);
      lines.forEach((line, index) => {
        if (suspicious.some((pattern) => pattern.test(line))) failures.push(`${fullPath}:${index + 1}: suspicious mojibake`);
      });
    } catch {
      failures.push(`${fullPath}: invalid UTF-8`);
    }
  }
}

roots.filter(fs.existsSync).forEach(scan);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Encoding check passed: all tracked source files are valid UTF-8 without known mojibake patterns.");
}
