import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const standalone = join(process.cwd(), ".next", "standalone");

if (existsSync(standalone)) {
  cpSync(join(process.cwd(), "public"), join(standalone, "public"), {
    recursive: true,
    force: true,
  });
  mkdirSync(join(standalone, ".next"), { recursive: true });
  cpSync(join(process.cwd(), ".next", "static"), join(standalone, ".next", "static"), {
    recursive: true,
    force: true,
  });
}
