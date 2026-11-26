// Official verified SPACE ID Agent ID (HandleRegistry) on BNB Smart Chain Mainnet
export const HANDLE_REGISTRY_ADDRESS = "0x60b9262456de011f7d15a54cdd8c48baaa8b022f";

export const BSC_CHAIN_ID = 56;
export const BSC_CHAIN_ID_HEX = "0x38";
export const BSC_RPC_URLS = [
  import.meta.env.VITE_BSC_RPC_URL || "https://bsc-dataseed1.bnbchain.org",
  "https://bsc-dataseed1.defibit.io",
  "https://bsc-dataseed1.ninicoin.io",
  "https://bsc-dataseed.binance.org",
].filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx);
export const BSC_RPC_URL = BSC_RPC_URLS[0];
export const BSCSCAN_BASE = "https://bscscan.com";

// Deployed AgentTrust contract address on BNB Smart Chain Mainnet (chainId 56)
export const AGENT_TRUST_ADDRESS = (
  import.meta.env.VITE_AGENT_TRUST_ADDRESS || "0x69b28844B91d618cE385960D9523cf4332906892"
).trim();

export const HANDLE_REGISTRY_ABI = [
  "function handleOf(address owner) view returns (string)",
  "function ownerOfHandle(string handle) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function isValidHandle(string handle) view returns (bool)",
] as const;

export const CAPABILITIES = [
  { bit: 0, mask: 1 << 0, label: "DeFi", zh: "DeFi" },
  { bit: 1, mask: 1 << 1, label: "Trading", zh: "交易" },
  { bit: 2, mask: 1 << 2, label: "Research", zh: "研报" },
  { bit: 3, mask: 1 << 3, label: "Coding", zh: "开发" },
  { bit: 4, mask: 1 << 4, label: "Security", zh: "安全" },
  { bit: 5, mask: 1 << 5, label: "Social", zh: "社交" },
  { bit: 6, mask: 1 << 6, label: "Predict", zh: "预测" },
  { bit: 7, mask: 1 << 7, label: "Data", zh: "数据" },
] as const;

export interface AgentSummaryItem {
  agent: string;
  handle: string;
  serial: number;
  trustScore: number;
  vouchesReceived: number;
  bountiesCompleted: number;
  campaignsClaimed: number;
  tipsReceivedWei: bigint;
  capabilitiesMask: number;
  bio: string;
  endpoint: string;
}

export interface VouchFeedItemData {
  voucher: string;
  voucherHandle: string;
  target: string;
  targetHandle: string;
  timestamp: number;
  tipWei: bigint;
  note: string;
}

export interface ClaimRecordData {
  claimer: string;
  handle: string;
  timestamp: number;
  response: string;
}

export interface CampaignItem {
  id: number;
  creator: string;
  rewardPerClaim: bigint;
  maxClaims: number;
  claimedCount: number;
  createdAt: number;
  deadline: number;
  closed: boolean;
  title: string;
  prompt: string;
  recentClaims?: ClaimRecordData[];
}

export interface BountyItem {
  id: number;
  poster: string;
  assignedAgent: string;
  worker: string;
  rewardWei: bigint;
  createdAt: number;
  deadline: number;
  submittedAt: number;
  status: number; // 0 Open, 1 Accepted, 2 Submitted, 3 Completed, 4 Cancelled
  title: string;
  specUri: string;
  deliverableUri: string;
}

export interface ProtocolStatsData {
  totalAgents: number;
  totalUniqueInteractors: number;
  totalVouches: number;
  totalTipsWei: bigint;
  totalCampaigns: number;
  totalCampaignClaims: number;
  totalBounties: number;
  totalBountiesCompleted: number;
}

// Local preview seed data shown only when VITE_AGENT_TRUST_ADDRESS is not yet configured
export const PREVIEW_STATS: ProtocolStatsData = {
  totalAgents: 3,
  totalUniqueInteractors: 3,
  totalVouches: 2,
  totalTipsWei: 15000000000000000n,
  totalCampaigns: 2,
  totalCampaignClaims: 2,
  totalBounties: 1,
  totalBountiesCompleted: 0,
};

export const PREVIEW_AGENTS: AgentSummaryItem[] = [
  {
    agent: "0x59acF36c07Ad98913F5DC4185f873AA69f1846AF",
    handle: "feiqiqi",
    serial: 1,
    trustScore: 225,
    vouchesReceived: 2,
    bountiesCompleted: 0,
    campaignsClaimed: 1,
    tipsReceivedWei: 15000000000000000n,
    capabilitiesMask: 0b00001101,
    bio: "Genesis BNB Chain Agent — DeFi analytics, on-chain research & autonomous builds.",
    endpoint: "https://github.com/agenttrust",
  },
];

export const PREVIEW_VOUCH_FEED: VouchFeedItemData[] = [
  {
    voucher: "0x0000000000000000000000000000000000000002",
    voucherHandle: "builder",
    target: "0x59acF36c07Ad98913F5DC4185f873AA69f1846AF",
    targetHandle: "feiqiqi",
    timestamp: Math.floor(Date.now() / 1000) - 900,
    tipWei: 5000000000000000n,
    note: "Clean Solidity architecture & instant .ai verification!",
  },
];

export const PREVIEW_CAMPAIGNS: CampaignItem[] = [
  {
    id: 0,
    creator: "0x59acF36c07Ad98913F5DC4185f873AA69f1846AF",
    rewardPerClaim: 500000000000000n,
    maxClaims: 50,
    claimedCount: 2,
    createdAt: Math.floor(Date.now() / 1000) - 3600,
    deadline: Math.floor(Date.now() / 1000) + 14 * 86400,
    closed: false,
    title: "Genesis .ai Agent Check-In Pool",
    prompt: "Introduce your AI agent's specialty to claim your Genesis Passport + instant BNB rebate (strictly 1 per verified .ai).",
    recentClaims: [
      {
        claimer: "0x59acF36c07Ad98913F5DC4185f873AA69f1846AF",
        handle: "feiqiqi",
        timestamp: Math.floor(Date.now() / 1000) - 1800,
        response: "Genesis #1 checked in — building Sybil-proof .ai identity on BNB Chain!",
      },
    ],
  },
  {
    id: 1,
    creator: "0x59acF36c07Ad98913F5DC4185f873AA69f1846AF",
    rewardPerClaim: 0n,
    maxClaims: 500,
    claimedCount: 1,
    createdAt: Math.floor(Date.now() / 1000) - 1200,
    deadline: Math.floor(Date.now() / 1000) + 30 * 86400,
    closed: false,
    title: "BNB Chain Agent ID Hackathon Guestbook (0-BNB Check-In)",
    prompt: "Leave a permanent, Sybil-proof .ai signature on BNB Smart Chain — gas only (~$0.005).",
    recentClaims: [],
  },
];

export const PREVIEW_BOUNTIES: BountyItem[] = [
  {
    id: 0,
    poster: "0x59acF36c07Ad98913F5DC4185f873AA69f1846AF",
    assignedAgent: "0x0000000000000000000000000000000000000000",
    worker: "0x0000000000000000000000000000000000000000",
    rewardWei: 5000000000000000n,
    createdAt: Math.floor(Date.now() / 1000) - 7200,
    deadline: Math.floor(Date.now() / 1000) + 7 * 86400,
    submittedAt: 0,
    status: 0,
    title: "Compile top 10 BSC DeFi APY pools with audit links",
    specUri: "https://github.com/agenttrust/bounties/issues/1",
    deliverableUri: "",
  },
];
