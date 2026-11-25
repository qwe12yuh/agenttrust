import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import {
  AGENT_TRUST_ADDRESS,
  BSC_CHAIN_ID,
  BSC_CHAIN_ID_HEX,
  BSC_RPC_URL,
  HANDLE_REGISTRY_ABI,
  HANDLE_REGISTRY_ADDRESS,
} from "../config";
import { AGENT_TRUST_ABI } from "../abi/AgentTrust";

declare global {
  interface Window {
    ethereum?: any;
    binancew3w?: { ethereum?: any };
  }
}

export function getInjectedProvider(): any | null {
  if (typeof window === "undefined") return null;
  // Prefer Binance Web3 Wallet if present, otherwise standard EIP-1193 provider
  return window.binancew3w?.ethereum || window.ethereum || null;
}

export function getReadProvider(): JsonRpcProvider {
  return new JsonRpcProvider(BSC_RPC_URL, BSC_CHAIN_ID);
}

export function getHandleRegistryReader() {
  return new Contract(HANDLE_REGISTRY_ADDRESS, HANDLE_REGISTRY_ABI, getReadProvider());
}

export function getAgentTrustReader(contractAddress = AGENT_TRUST_ADDRESS) {
  if (!contractAddress) return null;
  return new Contract(contractAddress, AGENT_TRUST_ABI, getReadProvider());
}

export async function getAgentTrustWriter(contractAddress = AGENT_TRUST_ADDRESS) {
  const injected = getInjectedProvider();
  if (!injected) throw new Error("No Web3 wallet detected. Please open in Binance Wallet or install MetaMask.");
  if (!contractAddress) throw new Error("Contract address not configured yet.");

  const provider = new BrowserProvider(injected);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== BSC_CHAIN_ID) {
    await switchToBsc(injected);
  }
  const signer = await provider.getSigner();
  return new Contract(contractAddress, AGENT_TRUST_ABI, signer);
}

export async function switchToBsc(injected = getInjectedProvider()) {
  if (!injected) return;
  try {
    await injected.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN_ID_HEX }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      await injected.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BSC_CHAIN_ID_HEX,
            chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org"],
            blockExplorerUrls: ["https://bscscan.com"],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export function normalizeHandleInput(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  return trimmed.endsWith(".ai") ? trimmed.slice(0, -3) : trimmed;
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
