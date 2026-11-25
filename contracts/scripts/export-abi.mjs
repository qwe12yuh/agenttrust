import fs from "node:fs";
import path from "node:path";

const artifactPath = path.resolve("artifacts/contracts/AgentTrust.sol/AgentTrust.json");
const frontendAbiDir = path.resolve("../frontend/src/abi");

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
fs.mkdirSync(frontendAbiDir, { recursive: true });

fs.writeFileSync(
  path.join(frontendAbiDir, "AgentTrust.ts"),
  `// Auto-generated from Hardhat artifact — do not edit manually.\nexport const AGENT_TRUST_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`
);

console.log("Exported ABI to frontend/src/abi/AgentTrust.ts");
