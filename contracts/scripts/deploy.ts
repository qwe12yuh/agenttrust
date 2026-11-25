import { network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

// Verified SPACE ID Agent ID (HandleRegistry) on BNB Smart Chain Mainnet
const BSC_MAINNET_AGENT_ID_REGISTRY = "0x60b9262456de011f7d15a54cdd8c48baaa8b022f";

async function main() {
  const { ethers } = await network.getOrCreate();
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);

  console.log(`Deploying AgentTrust on chainId=${chainId} with account=${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} BNB`);

  let registryAddress = process.env.AGENT_ID_REGISTRY || "";

  if (!registryAddress) {
    if (chainId === 56) {
      registryAddress = BSC_MAINNET_AGENT_ID_REGISTRY;
    } else {
      console.log("Non-mainnet detected and AGENT_ID_REGISTRY unset; deploying MockHandleRegistry...");
      const MockRegistry = await ethers.getContractFactory("MockHandleRegistry");
      const mock = await MockRegistry.deploy();
      await mock.waitForDeployment();
      registryAddress = await mock.getAddress();
      console.log(`MockHandleRegistry deployed at: ${registryAddress}`);
    }
  }

  const Renderer = await ethers.getContractFactory("PassportRenderer");
  const renderer = await Renderer.deploy();
  await renderer.waitForDeployment();
  const rendererAddress = await renderer.getAddress();
  console.log(`PassportRenderer deployed at: ${rendererAddress}`);

  const AgentTrust = await ethers.getContractFactory("AgentTrust");
  const trust = await AgentTrust.deploy(registryAddress, rendererAddress);
  await trust.waitForDeployment();
  const trustAddress = await trust.getAddress();

  console.log(`AgentTrust deployed at: ${trustAddress}`);
  console.log(`Bound to Agent ID Registry: ${registryAddress}`);

  const deployment = {
    chainId,
    agentTrustAddress: trustAddress,
    passportRendererAddress: rendererAddress,
    agentIdRegistry: registryAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.resolve(process.cwd(), `deployment-${chainId}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log(`Saved deployment manifest to ${outPath}`);
  console.log("\nTo verify both contracts on BscScan:");
  console.log(`npx hardhat verify --network bsc ${rendererAddress}`);
  console.log(`npx hardhat verify --network bsc ${trustAddress} ${registryAddress} ${rendererAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
