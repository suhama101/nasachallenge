import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
mkdirSync(".next-auth-tests", { recursive: true });
writeFileSync(
  "tsconfig.auth-fixture.json",
  JSON.stringify({
    extends: "./tsconfig.json",
    include: [
      "next-env.d.ts",
      "src/**/*.ts",
      "src/**/*.tsx",
      ".next-auth-tests/dev/types/**/*.ts",
    ],
    exclude: ["node_modules"],
  }),
);
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--port", "3102"],
  { stdio: "inherit", env: { ...process.env, MISSIONPULSE_AUTH_FIXTURE: "1" } },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
