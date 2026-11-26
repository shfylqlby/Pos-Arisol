import { rmSync } from "node:fs";

const target = process.argv[2] || ".next-e2e";
rmSync(target, { recursive: true, force: true });
console.log(`removed ${target}`);
