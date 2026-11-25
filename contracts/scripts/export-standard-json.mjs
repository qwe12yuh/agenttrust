import fs from "node:fs";
import path from "node:path";

const buildInfoDir = path.resolve("artifacts/build-info");
const outDir = path.resolve("verify");
fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(buildInfoDir).filter((f) => f.endsWith(".json") && !f.endsWith(".output.json"));
if (files.length === 0) {
  throw new Error("No Hardhat build-info found. Run `npx hardhat compile` first.");
}

// Pick the newest build-info file
files.sort((a, b) => fs.statSync(path.join(buildInfoDir, b)).mtimeMs - fs.statSync(path.join(buildInfoDir, a)).mtimeMs);
const latest = JSON.parse(fs.readFileSync(path.join(buildInfoDir, files[0]), "utf8"));

const outPath = path.join(outDir, "standard-json-input.json");
fs.writeFileSync(outPath, JSON.stringify(latest.input, null, 2));
console.log("Exported Standard JSON Input for BscScan manual verification:", outPath);
