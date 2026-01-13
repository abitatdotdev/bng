#!/usr/bin/env bun

import { readdirSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const generatorsDir = join(import.meta.dir, "generators");

// Get all files in the generators directory
const files = readdirSync(generatorsDir).filter(
  (file) => file.endsWith(".js") || file.endsWith(".ts")
);

console.log(`Running ${files.length} generator scripts...\n`);

for (const file of files) {
  const filePath = join(generatorsDir, file);
  console.log(`Running ${file}...`);

  const result = spawnSync("bun", [filePath], {
    stdio: "inherit", // This redirects stdout/stderr to parent process
    cwd: import.meta.dir,
  });

  if (result.error) {
    console.error(`Error running ${file}:`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${file} exited with code ${result.status}`);
    process.exit(result.status || 1);
  }

  console.log(`✓ ${file} completed\n`);
}

console.log("All generator scripts completed successfully!");
