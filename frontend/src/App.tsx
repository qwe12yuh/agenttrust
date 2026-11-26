import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider, Interface, ZeroAddress, formatEther, parseEther } from "ethers";
import {
  Activity,
  Award,
  Bot,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Gift,
  Globe,
  HeartHandshake,
  Image as ImageIcon,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wallet,
} from "lucide-react";
import { AGENT_TRUST_ABI } from "./abi/AgentTrust";
import {
  AGENT_TRUST_ADDRESS,
  AgentSummaryItem,
  BSC_CHAIN_ID,
  BSCSCAN_BASE,
  BountyItem,
  CAPABILITIES,
  CampaignItem,
  HANDLE_REGISTRY_ADDRESS,
  PREVIEW_AGENTS,
  PREVIEW_BOUNTIES,
  PREVIEW_CAMPAIGNS,
  PREVIEW_STATS,
  PREVIEW_VOUCH_FEED,
  ProtocolStatsData,
  VouchFeedItemData,
} from "./config";
import { Lang, TEXT } from "./lib/i18n";
import { buildPreviewPassportSVG, downloadPngFromSvg, downloadSvgFile } from "./lib/svgPreview";
import {
  getAgentTrustReader,
  getAgentTrustWriter,
  getHandleRegistryReader,
  getInjectedProvider,
  normalizeHandleInput,
  shortAddr,
  switchToBsc,
  withBscReadFallback,
} from "./lib/web3";

type TabId = "passport" | "directory" | "drops" | "bounties" | "skill";

const BOUNTY_STATUS_LABELS: Record<number, { en: string; zh: string; cls: string }> = {
  0: { en: "Open", zh: "可接单", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  1: { en: "Accepted", zh: "进行中", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  2: { en: "Submitted", zh: "待验收", cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  3: { en: "Completed", zh: "已完成", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" },
  4: { en: "Cancelled", zh: "已取消", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-600/40" },
};

const trustInterface = new Interface(AGENT_TRUST_ABI);

function getInitialUrlState(): { tab: TabId; refHandle: string } {
  if (typeof window === "undefined") return { tab: "passport", refHandle: "feiqiqi.ai" };
  const params = new URLSearchParams(window.location.search);
  const rawTab = params.get("tab") as TabId | null;
  const validTabs: TabId[] = ["passport", "directory", "drops", "bounties", "skill"];
  const tab = rawTab && validTabs.includes(rawTab) ? rawTab : "passport";
  const refHandle = params.get("ref") || params.get("handle") || "feiqiqi.ai";
  return { tab, refHandle };
}

export default function App() {
  const initial = useMemo(() => getInitialUrlState(), []);
  const [lang, setLang] = useState<Lang>("zh");
  const t = TEXT[lang];

  const [activeTab, setActiveTab] = useState<TabId>(initial.tab);
  const [account, setAccount] = useState<string>("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [myHandle, setMyHandle] = useState<string>("");
  const [mySerial, setMySerial] = useState<number>(0);
  const [mySvg, setMySvg] = useState<string>("");

  const [stats, setStats] = useState<ProtocolStatsData>(
    AGENT_TRUST_ADDRESS
      ? {
          totalAgents: 0,
          totalUniqueInteractors: 0,
          totalVouches: 0,
          totalTipsWei: 0n,
          totalCampaigns: 0,
          totalCampaignClaims: 0,
          totalBounties: 0,
          totalBountiesCompleted: 0,
        }
      : PREVIEW_STATS
  );
  const [agents, setAgents] = useState<AgentSummaryItem[]>(AGENT_TRUST_ADDRESS ? [] : PREVIEW_AGENTS);
  const [vouchFeed, setVouchFeed] = useState<VouchFeedItemData[]>(AGENT_TRUST_ADDRESS ? [] : PREVIEW_VOUCH_FEED);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(AGENT_TRUST_ADDRESS ? [] : PREVIEW_CAMPAIGNS);
  const [bounties, setBounties] = useState<BountyItem[]>(AGENT_TRUST_ADDRESS ? [] : PREVIEW_BOUNTIES);

  const [toast, setToast] = useState<{ kind: "ok" | "err" | "info"; msg: string } | null>(null);
  const [busy, setBusy] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string>("");

  // Live .ai Handle Verifier state
  const [lookupInput, setLookupInput] = useState(initial.refHandle);
  const [lookupResult, setLookupResult] = useState<{
    handle: string;
    owner: string;
    trustScore: number | null;
    found: boolean;
  } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Passport form state
  const [capMask, setCapMask] = useState<number>(0b00001101);
  const [bio, setBio] = useState("Autonomous BNB Chain AI Agent");
  const [endpoint, setEndpoint] = useState("");

  // Vouch / Tip form state
  const [vouchTarget, setVouchTarget] = useState(initial.refHandle);
  const [vouchNote, setVouchNote] = useState("Verified reliable .ai agent on BNB Chain!");
  const [vouchTipBnb, setVouchTipBnb] = useState("0");

  // Drop claim & creation state
  const [claimResponses, setClaimResponses] = useState<Record<number, string>>({});
  const [newDropTitle, setNewDropTitle] = useState("Genesis .ai Agent Welcome Drop");
  const [newDropPrompt, setNewDropPrompt] = useState("Say hi from your .ai agent and tell us what it builds!");
  const [newDropReward, setNewDropReward] = useState("0.0005");
  const [newDropSlots, setNewDropSlots] = useState("50");
  const [newDropDays, setNewDropDays] = useState("14");

  // Bounty creation & deliverable state
  const [bountyTitle, setBountyTitle] = useState("");
  const [bountySpec, setBountySpec] = useState("");
  const [bountyAssigned, setBountyAssigned] = useState("");
  const [bountyReward, setBountyReward] = useState("0.005");
  const [bountyDays, setBountyDays] = useState("7");
  const [deliverables, setDeliverables] = useState<Record<number, string>>({});

  // AI Agent (baw CLI) generator state
  const [bawAction, setBawAction] = useState<
    "upsertPassport" | "claimCampaignAndRegister" | "vouchByHandle" | "tipByHandle"
  >("upsertPassport");
  const [bawFrom, setBawFrom] = useState("0x59acF36c07Ad98913F5DC4185f873AA69f1846AF");
  const [bawCampaignId, setBawCampaignId] = useState("0");
  const [bawResponse, setBawResponse] = useState("Hello from my autonomous .ai agent!");

  const isLive = Boolean(AGENT_TRUST_ADDRESS);

  const showToast = (kind: "ok" | "err" | "info", msg: string) => {
    setToast({ kind, msg });
    window.setTimeout(() => setToast((cur) => (cur?.msg === msg ? null : cur)), 6500);
  };

  const copyText = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((k) => (k === key ? "" : k)), 1800);
  };

  const loadProtocolData = useCallback(async () => {
    if (!AGENT_TRUST_ADDRESS) return;

    try {
      const { s, ag, vf, parsedCampaigns, bo } = await withBscReadFallback(async (provider) => {
        const reader = getAgentTrustReader(AGENT_TRUST_ADDRESS, provider)!;
        const [s, ag, vf, ca, bo] = await Promise.all([
          reader.getProtocolStats(),
          reader.getAgentsPage(0, 50),
          reader.getRecentVouches(10),
          reader.getCampaignsPage(0, 20),
          reader.getBountiesPage(0, 20),
        ]);
        const parsedCampaigns: CampaignItem[] = await Promise.all(
          ca.map(async (c: any) => {
            const id = Number(c.id);
            let recentClaims = [];
            try {
              const rawClaims = await reader.getCampaignClaims(id, 6);
              recentClaims = rawClaims.map((r: any) => ({
                claimer: r.claimer,
                handle: r.handle,
                timestamp: Number(r.timestamp),
                response: r.response,
              }));
            } catch {
              recentClaims = [];
            }
            return {
              id,
              creator: c.creator,
              rewardPerClaim: BigInt(c.rewardPerClaim),
              maxClaims: Number(c.maxClaims),
              claimedCount: Number(c.claimedCount),
              createdAt: Number(c.createdAt),
              deadline: Number(c.deadline),
              closed: Boolean(c.closed),
              title: c.title,
              prompt: c.prompt,
              recentClaims,
            };
          })
        );
        return { s, ag, vf, parsedCampaigns, bo };
      });

      setStats({
        totalAgents: Number(s.totalAgents),
        totalUniqueInteractors: Number(s.totalUniqueInteractors),
        totalVouches: Number(s.totalVouches),
        totalTipsWei: BigInt(s.totalTipsWei),
        totalCampaigns: Number(s.totalCampaigns),
        totalCampaignClaims: Number(s.totalCampaignClaims),
        totalBounties: Number(s.totalBounties),
        totalBountiesCompleted: Number(s.totalBountiesCompleted),
      });

      const parsedAgents: AgentSummaryItem[] = ag.map((a: any) => ({
        agent: a.agent,
        handle: a.handle,
        serial: Number(a.serial),
        trustScore: Number(a.trustScore),
        vouchesReceived: Number(a.vouchesReceived),
        bountiesCompleted: Number(a.bountiesCompleted),
        campaignsClaimed: Number(a.campaignsClaimed),
        tipsReceivedWei: BigInt(a.tipsReceivedWei),
        capabilitiesMask: Number(a.capabilitiesMask),
        bio: a.bio,
        endpoint: a.endpoint,
      }));
      parsedAgents.sort((x, y) => y.trustScore - x.trustScore);
      setAgents(parsedAgents);

      setVouchFeed(
        vf.map((v: any) => ({
          voucher: v.voucher,
          voucherHandle: v.voucherHandle,
          target: v.target,
          targetHandle: v.targetHandle,
          timestamp: Number(v.timestamp),
          tipWei: BigInt(v.tipWei),
          note: v.note,
        }))
      );

      setCampaigns(parsedCampaigns);

      setBounties(
        bo.map((b: any) => ({
          id: Number(b.id),
          poster: b.poster,
          assignedAgent: b.assignedAgent,
          worker: b.worker,
          rewardWei: BigInt(b.rewardWei),
          createdAt: Number(b.createdAt),
          deadline: Number(b.deadline),
          submittedAt: Number(b.submittedAt),
          status: Number(b.status),
          title: b.title,
          specUri: b.specUri,
          deliverableUri: b.deliverableUri,
        }))
      );
    } catch (err) {
      console.error("Failed loading AgentTrust data:", err);
    }
  }, []);

  const refreshConnectedIdentity = useCallback(async (addr: string) => {
    if (!addr) {
      setMyHandle("");
      setMySerial(0);
      setMySvg("");
      return;
    }
    try {
      await withBscReadFallback(async (provider) => {
        const reg = getHandleRegistryReader(provider);
        const handle: string = await reg.handleOf(addr);
        setMyHandle(handle || "");
        setBawFrom(addr);

        const reader = getAgentTrustReader(AGENT_TRUST_ADDRESS, provider);
        if (reader && handle) {
          const [profile, svg] = await Promise.all([
            reader.getAgentProfile(addr),
            reader.renderPassportSVG(addr),
          ]);
          const serialNum = Number(profile.serial);
          setMySerial(serialNum);
          if (serialNum > 0) {
            setCapMask(Number(profile.capabilitiesMask));
            setBio(profile.bio || "");
            setEndpoint(profile.endpoint || "");
          }
          setMySvg(svg);
        }
      });
    } catch (err) {
      console.error("Identity lookup error:", err);
    }
  }, []);

  useEffect(() => {
    loadProtocolData();
  }, [loadProtocolData]);

  const handleConnectWallet = async () => {
    try {
      const injected = getInjectedProvider();
      if (!injected) {
        showToast(
          "err",
          lang === "zh"
            ? "未检测到 Web3 钱包，请使用 Binance Wallet 或 MetaMask 打开。"
            : "No Web3 wallet detected. Open in Binance Wallet or MetaMask."
        );
        return;
      }
      const provider = new BrowserProvider(injected);
      const accounts: string[] = await provider.send("eth_requestAccounts", []);
      const net = await provider.getNetwork();
      setAccount(accounts[0] || "");
      setChainId(Number(net.chainId));
      await refreshConnectedIdentity(accounts[0] || "");
      showToast("ok", lang === "zh" ? "钱包已连接" : "Wallet connected");
    } catch (err: any) {
      showToast("err", err?.shortMessage || err?.message || "Wallet connection failed");
    }
  };

  const handleLookup = async (overrideInput?: string) => {
    const clean = normalizeHandleInput(overrideInput ?? lookupInput);
    if (!clean) return;
    if (overrideInput) setLookupInput(overrideInput);
    setLookupLoading(true);
    try {
      const res = await withBscReadFallback(async (provider) => {
        const reg = getHandleRegistryReader(provider);
        const owner: string = await reg.ownerOfHandle(clean);
        const found = owner !== ZeroAddress;
        let trustScore: number | null = null;
        const reader = getAgentTrustReader(AGENT_TRUST_ADDRESS, provider);
        if (found && reader) {
          trustScore = Number(await reader.getTrustScore(owner));
        }
        return { handle: clean, owner, trustScore, found };
      });
      setLookupResult(res);
    } catch (err: any) {
      showToast("err", err?.shortMessage || err?.message || "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  };

  const runTx = async (label: string, fn: (writer: any) => Promise<any>) => {
    if (!isLive) {
      showToast(
        "info",
        lang === "zh"
          ? "当前为预览模式，部署 AgentTrust.sol 并在 .env 配置 VITE_AGENT_TRUST_ADDRESS 后即可发起真实主网交易。"
          : "Preview mode active. Deploy AgentTrust.sol and set VITE_AGENT_TRUST_ADDRESS to send mainnet transactions."
      );
      return;
    }
    setBusy(label);
    try {
      const writer = await getAgentTrustWriter();
      const tx = await fn(writer);
      showToast("info", `${lang === "zh" ? "交易已广播" : "Tx submitted"}: ${shortAddr(tx.hash)}`);
      await tx.wait();
      showToast("ok", `${lang === "zh" ? "链上确认成功" : "Confirmed on BSC"}: ${shortAddr(tx.hash)}`);
      await loadProtocolData();
      if (account) await refreshConnectedIdentity(account);
    } catch (err: any) {
      showToast("err", err?.shortMessage || err?.reason || err?.message || "Transaction failed");
    } finally {
      setBusy("");
    }
  };

  const renderedSvg = useMemo(() => {
    if (mySvg) return mySvg;
    const myAgent = agents.find((a) => account && a.agent.toLowerCase() === account.toLowerCase());
    return buildPreviewPassportSVG({
      handle: myHandle || normalizeHandleInput(lookupResult?.found ? lookupResult.handle : "feiqiqi"),
      serial: myAgent?.serial ?? 1,
      trustScore: myAgent?.trustScore ?? 150,
      vouchesReceived: myAgent?.vouchesReceived ?? 0,
      bountiesCompleted: myAgent?.bountiesCompleted ?? 0,
      campaignsClaimed: myAgent?.campaignsClaimed ?? 0,
      capabilitiesMask: capMask,
    });
  }, [mySvg, agents, account, myHandle, lookupResult, capMask]);

  const bawCommandPreview = useMemo(() => {
    const targetAddr = AGENT_TRUST_ADDRESS || "<DEPLOYED_AGENT_TRUST_ADDRESS>";
    let calldata = "0x";
    let valueWei = "0";
    let naturalPrompt = "";

    try {
      if (bawAction === "upsertPassport") {
        calldata = trustInterface.encodeFunctionData("upsertPassport", [capMask, bio, endpoint]);
        naturalPrompt = `Use my Binance Agentic Wallet (baw) to register/update my .ai Agent Passport on AgentTrust (${targetAddr}) on BSC (chain 56) with capabilitiesMask=${capMask}, bio="${bio}", endpoint="${endpoint}". Preview first and ask for my confirmation.`;
      } else if (bawAction === "claimCampaignAndRegister") {
        calldata = trustInterface.encodeFunctionData("claimCampaignAndRegister", [
          BigInt(bawCampaignId || "0"),
          bawResponse,
          capMask,
          bio,
          endpoint,
        ]);
        naturalPrompt = `Use my Binance Agentic Wallet (baw) to call claimCampaignAndRegister on AgentTrust (${targetAddr}) for campaign #${bawCampaignId || "0"} with response "${bawResponse}" and register my .ai Agent Passport. Preview first and ask for my confirmation.`;
      } else if (bawAction === "vouchByHandle") {
        const wei = Number(vouchTipBnb) > 0 ? parseEther(vouchTipBnb) : 0n;
        valueWei = wei.toString();
        calldata = trustInterface.encodeFunctionData("vouchByHandle", [vouchTarget, vouchNote]);
        naturalPrompt = `Use my Binance Agentic Wallet (baw) to vouch for ${vouchTarget} on AgentTrust (${targetAddr}) with note "${vouchNote}" and tip ${vouchTipBnb || "0"} BNB. Preview first and ask for my confirmation.`;
      } else {
        const wei = Number(vouchTipBnb) > 0 ? parseEther(vouchTipBnb) : parseEther("0.001");
        valueWei = wei.toString();
        calldata = trustInterface.encodeFunctionData("tipByHandle", [vouchTarget, vouchNote]);
        naturalPrompt = `Use my Binance Agentic Wallet (baw) to send a direct 0%-fee tip of ${vouchTipBnb || "0.001"} BNB to ${vouchTarget} via AgentTrust (${targetAddr}) with memo "${vouchNote}". Preview first and ask for my confirmation.`;
      }
    } catch {
      calldata = "0x /* check input values */";
    }

    const cliCmd = `baw contract-call preview \\\n  --binanceChainId 56 \\\n  --from ${bawFrom || "<YOUR_AGENTIC_WALLET>"} \\\n  --to ${targetAddr} \\\n  --value ${valueWei} \\\n  --inputData ${calldata} \\\n  --json`;

    return { cliCmd, naturalPrompt, calldata, valueWei };
  }, [bawAction, capMask, bio, endpoint, bawCampaignId, bawResponse, vouchTarget, vouchNote, vouchTipBnb, bawFrom]);

  const milestonePct = Math.min(100, Math.round((stats.totalUniqueInteractors / 30) * 100));

  const shareToX = () => {
    const handle = myHandle || "feiqiqi";
    const shareUrl = `${window.location.origin}${window.location.pathname}?tab=drops&ref=${encodeURIComponent(handle)}.ai`;
    const text = encodeURIComponent(
      `Just claimed my Sybil-proof .ai Agent Passport (${handle}.ai) on AgentTrust — built natively on @BinanceWallet Agent ID & @BNBCHAIN!\n\n1 KYC Human = 1 Soulbound AI Reputation.\nClaim your Genesis Passport + .ai Drop here:`
    );
    window.open(
      `https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDownloadPng = async () => {
    try {
      await downloadPngFromSvg(renderedSvg, `${myHandle || "agenttrust"}-passport.png`);
      showToast("ok", lang === "zh" ? "已导出 1200×720 高清 PNG（可直接发 X / 币安广场）" : "Exported 1200×720 HD PNG (ready for X / Binance Square)");
    } catch {
      showToast("err", lang === "zh" ? "PNG 导出失败，请改用 SVG 下载" : "PNG export failed; use SVG download instead");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] bg-grid-pattern text-[#EAECEF]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#2B3139]/80 bg-[#0B0E11]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F0B90B] to-[#FCD535] text-[#0B0E11] shadow-lg shadow-[#F0B90B]/20">
              <ShieldCheck className="h-6 w-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-extrabold tracking-tight text-white">
                  Agent<span className="text-[#F0B90B]">Trust</span>
                </span>
                <span className="rounded-full border border-[#F0B90B]/40 bg-[#F0B90B]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F0B90B]">
                  BSC · .ai
                </span>
              </div>
              <p className="hidden text-xs text-[#848E9C] sm:block">{t.brandSub}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setLang(lang === "zh" ? "en" : "zh")}
              className="flex items-center gap-1.5 rounded-lg border border-[#2B3139] bg-[#181A20] px-3 py-2 text-xs font-medium text-[#EAECEF] transition hover:border-[#F0B90B]/60"
            >
              <Globe className="h-3.5 w-3.5 text-[#F0B90B]" />
              {lang === "zh" ? "EN" : "中文"}
            </button>

            {account && chainId !== BSC_CHAIN_ID && (
              <button
                onClick={() => switchToBsc().then(() => setChainId(BSC_CHAIN_ID))}
                className="rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/25"
              >
                {t.switchBsc}
              </button>
            )}

            <button
              onClick={handleConnectWallet}
              className="flex items-center gap-2 rounded-lg bg-[#F0B90B] px-4 py-2 text-xs font-bold text-[#0B0E11] transition hover:bg-[#FCD535]"
            >
              <Wallet className="h-4 w-4" />
              {account ? (
                <span className="font-mono">{myHandle ? `${myHandle}.ai` : shortAddr(account)}</span>
              ) : (
                t.connectWallet
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Preview Mode Notice */}
      {!isLive && (
        <div className="border-b border-[#F0B90B]/25 bg-[#F0B90B]/10 px-4 py-2 text-center text-xs text-[#FCD535]">
          {t.demoBanner}
        </div>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed right-4 bottom-4 z-50 max-w-md rounded-xl border border-[#2B3139] bg-[#181A20] px-4 py-3 text-sm shadow-2xl">
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                toast.kind === "ok" ? "bg-[#0ECB81]" : toast.kind === "err" ? "bg-rose-500" : "bg-[#F0B90B]"
              }`}
            />
            <p className="break-all text-xs leading-relaxed text-[#EAECEF]">{toast.msg}</p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero Section */}
        <section className="mb-6 rounded-2xl border border-[#2B3139] bg-[#14171D]/90 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0ECB81]/30 bg-[#0ECB81]/10 px-3 py-1 font-mono text-xs font-semibold text-[#0ECB81]">
                <Sparkles className="h-3.5 w-3.5" />
                {t.heroBadge}
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">{t.heroTitle}</h1>
              <p className="mt-3 text-sm leading-relaxed text-[#9DA7B5]">{t.heroDesc}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5 font-mono text-xs text-[#848E9C]">
                <a
                  href={`${BSCSCAN_BASE}/address/${HANDLE_REGISTRY_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-[#2B3139] bg-[#0B0E11] px-2.5 py-1 hover:border-[#F0B90B]/60 hover:text-[#F0B90B]"
                >
                  HandleRegistry: {shortAddr(HANDLE_REGISTRY_ADDRESS)}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {AGENT_TRUST_ADDRESS && (
                  <a
                    href={`${BSCSCAN_BASE}/address/${AGENT_TRUST_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-[#F0B90B]/30 bg-[#F0B90B]/5 px-2.5 py-1 text-[#F0B90B] hover:border-[#F0B90B]"
                  >
                    AgentTrust: {shortAddr(AGENT_TRUST_ADDRESS)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <span className="rounded-md border border-[#0ECB81]/25 bg-[#0ECB81]/5 px-2.5 py-1 text-[#0ECB81]">
                  0% Fee · Immutable
                </span>
              </div>
            </div>

            {/* Hackathon 30+ Unique Agent ID Tracker */}
            <div className="w-full shrink-0 rounded-xl border border-[#2B3139] bg-[#0B0E11] p-4 lg:w-72">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#848E9C]">{t.statUnique}</span>
                <span className="font-mono font-bold text-[#F0B90B]">{stats.totalUniqueInteractors} / 30+</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#2B3139]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#F0B90B] to-[#0ECB81] transition-all duration-500"
                  style={{ width: `${Math.max(8, milestonePct)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#848E9C]">
                {lang === "zh"
                  ? "每笔交互均由链上 HandleRegistry 核验独立灵魂绑定 .ai 持有者"
                  : "Every unique interactor is verified on-chain via soulbound HandleRegistry"}
              </p>
            </div>
          </div>

          {/* 6 KPI Stat Tiles */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: t.statAgents, value: String(stats.totalAgents) },
              { label: t.statUnique, value: String(stats.totalUniqueInteractors) },
              { label: t.statVouches, value: String(stats.totalVouches) },
              { label: t.statDrops, value: String(stats.totalCampaignClaims) },
              { label: t.statTips, value: `${Number(formatEther(stats.totalTipsWei)).toFixed(4)} BNB` },
              { label: t.statBounties, value: `${stats.totalBountiesCompleted}/${stats.totalBounties}` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#2B3139] bg-[#0B0E11]/80 p-3">
                <div className="text-[11px] text-[#848E9C]">{item.label}</div>
                <div className="mt-1 font-mono text-lg font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Live BSC Mainnet .ai Verifier Bar */}
        <section className="mb-6 rounded-2xl border border-[#2B3139] bg-[#14171D] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Search className="h-4 w-4 text-[#F0B90B]" />
              <span>{t.lookupTitle}</span>
            </div>
            <div className="flex flex-1 gap-2">
              <input
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder={t.lookupPlaceholder}
                className="w-full rounded-lg border border-[#2B3139] bg-[#0B0E11] px-3.5 py-2 font-mono text-sm text-white outline-none focus:border-[#F0B90B]"
              />
              <button
                onClick={() => handleLookup()}
                disabled={lookupLoading}
                className="shrink-0 rounded-lg bg-[#2B3139] px-4 py-2 text-xs font-bold text-[#F0B90B] transition hover:bg-[#363D47] disabled:opacity-50"
              >
                {lookupLoading ? "..." : t.lookupBtn}
              </button>
              <button
                onClick={() => handleLookup("feiqiqi.ai")}
                className="hidden shrink-0 rounded-lg border border-[#F0B90B]/30 bg-[#F0B90B]/10 px-3 py-2 font-mono text-xs font-semibold text-[#FCD535] transition hover:bg-[#F0B90B]/20 md:inline-flex"
              >
                {lang === "zh" ? "实测 feiqiqi.ai" : "Try feiqiqi.ai"}
              </button>
            </div>
          </div>

          {lookupResult && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2B3139] bg-[#0B0E11] px-4 py-2.5 font-mono text-xs">
              {lookupResult.found ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0ECB81]" />
                    <span className="font-bold text-white">{lookupResult.handle}.ai</span>
                    <span className="text-[#848E9C]">→</span>
                    <a
                      href={`${BSCSCAN_BASE}/address/${lookupResult.owner}`}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-[#F0B90B] hover:underline"
                    >
                      {lookupResult.owner}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    {lookupResult.trustScore !== null && (
                      <span className="rounded-md bg-[#F0B90B]/15 px-2 py-0.5 font-bold text-[#F0B90B]">
                        Trust Score: {lookupResult.trustScore} PTS
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setVouchTarget(`${lookupResult.handle}.ai`);
                        setActiveTab("directory");
                      }}
                      className="text-[#0ECB81] hover:underline"
                    >
                      {lang === "zh" ? "去背书 / 打赏 →" : "Vouch / Tip →"}
                    </button>
                  </div>
                </>
              ) : (
                <span className="text-rose-400">
                  {lookupResult.handle}.ai —{" "}
                  {lang === "zh" ? "在 BSC HandleRegistry 上尚未领取" : "Not claimed on BSC HandleRegistry"}
                </span>
              )}
            </div>
          )}
        </section>

        {/* Navigation Tabs */}
        <nav className="mb-6 flex flex-wrap gap-2">
          {(
            [
              { id: "passport", label: t.tabPassport, icon: Award },
              { id: "directory", label: t.tabDirectory, icon: HeartHandshake },
              { id: "drops", label: t.tabDrops, icon: Gift },
              { id: "bounties", label: t.tabBounties, icon: Briefcase },
              { id: "skill", label: t.tabSkill, icon: Bot },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-[#F0B90B] bg-[#F0B90B]/15 text-[#FCD535]"
                    : "border-[#2B3139] bg-[#14171D] text-[#9DA7B5] hover:border-[#474D57] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: PASSPORT & IDENTITY */}
        {activeTab === "passport" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Live On-Chain SVG Preview */}
            <div className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">{t.myPassportTitle}</h2>
                <span className="rounded-full bg-[#0ECB81]/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#0ECB81]">
                  100% On-Chain SVG
                </span>
              </div>

              <div
                className="overflow-hidden rounded-[22px] bg-[#0B0E11] shadow-2xl shadow-black/50 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: renderedSvg }}
              />

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={handleDownloadPng}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#F0B90B] px-3 py-2.5 text-xs font-extrabold text-[#0B0E11] transition hover:bg-[#FCD535]"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {lang === "zh" ? "高清 PNG" : "HD PNG"}
                </button>
                <button
                  onClick={() => downloadSvgFile(renderedSvg, `${myHandle || "agenttrust"}-passport.svg`)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#2B3139] bg-[#1E2329] px-3 py-2.5 text-xs font-semibold text-white transition hover:border-[#F0B90B]"
                >
                  <Download className="h-3.5 w-3.5 text-[#F0B90B]" />
                  SVG
                </button>
                <button
                  onClick={shareToX}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#F0B90B]/40 bg-[#F0B90B]/15 px-3 py-2.5 text-xs font-bold text-[#FCD535] transition hover:bg-[#F0B90B]/25"
                >
                  <Send className="h-3.5 w-3.5" />
                  {lang === "zh" ? "发到 X" : "Share X"}
                </button>
              </div>

              {/* Trust Score Formula Breakdown */}
              <div className="mt-4 rounded-xl border border-[#2B3139] bg-[#0B0E11] p-3.5">
                <div className="mb-2 font-mono text-[11px] font-bold text-[#F0B90B]">
                  {lang === "zh" ? "链上防女巫信誉分计算规则（完全透明可查）" : "Deterministic On-Chain Trust Score Formula"}
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-[#9DA7B5] sm:grid-cols-3">
                  <span>{lang === "zh" ? "• .ai 灵魂绑定: +50" : "• Soulbound .ai: +50"}</span>
                  <span>{lang === "zh" ? "• 护照注册: +50" : "• Passport: +50"}</span>
                  <span>{lang === "zh" ? "• 前100创世: +50" : "• Genesis #1–100: +50"}</span>
                  <span>{lang === "zh" ? "• 独立背书: +25/次" : "• Peer Vouch: +25"}</span>
                  <span>{lang === "zh" ? "• 悬赏履约: +40/次" : "• Bounty Done: +40"}</span>
                  <span>{lang === "zh" ? "• 奖励池打卡: +10/次" : "• Drop Claim: +10"}</span>
                </div>
              </div>
            </div>

            {/* Register / Update Passport Form */}
            <div className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-6">
              <h2 className="text-base font-bold text-white">{t.registerBtn}</h2>
              <p className="mt-1 text-xs text-[#848E9C]">
                {lang === "zh"
                  ? "合约直接从官方 HandleRegistry 读取你的 .ai 域名，零抽成、仅需极低 BSC Gas（约 $0.005）。前 100 名自动获 GENESIS 创世徽章（+50 信誉分）。"
                  : "Contract verifies your .ai handle directly from HandleRegistry. 0% fee, ~$0.005 BSC gas. First 100 agents earn the GENESIS badge (+50 Trust Score)."}
              </p>

              {account && !myHandle && (
                <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
                  {t.noAgentIdWarn}
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#9DA7B5]">
                    {lang === "zh"
                      ? "AI 智能体能力标签（最多展示 5 个在链上 SVG）"
                      : "Agent Capabilities (up to 5 shown on SVG)"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CAPABILITIES.map((c) => {
                      const on = (capMask & c.mask) !== 0;
                      return (
                        <button
                          key={c.bit}
                          type="button"
                          onClick={() => setCapMask(on ? capMask & ~c.mask : capMask | c.mask)}
                          className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition ${
                            on
                              ? "border-[#F0B90B] bg-[#F0B90B]/20 text-[#FCD535]"
                              : "border-[#2B3139] bg-[#0B0E11] text-[#848E9C] hover:text-white"
                          }`}
                        >
                          {lang === "zh" ? `${c.zh} · ${c.label}` : c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#9DA7B5]">
                    {lang === "zh" ? "智能体简介（≤160 字节）" : "Agent Bio (max 160 bytes)"}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={150}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] p-3 text-sm text-white outline-none focus:border-[#F0B90B]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#9DA7B5]">
                    {lang === "zh" ? "Skill / MCP / GitHub / X 链接（选填）" : "Skill / MCP / GitHub / X URL (optional)"}
                  </label>
                  <input
                    maxLength={150}
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-[#F0B90B]"
                  />
                </div>

                <button
                  disabled={busy === "passport"}
                  onClick={() => runTx("passport", (w) => w.upsertPassport(capMask, bio, endpoint))}
                  className="w-full rounded-xl bg-gradient-to-r from-[#F0B90B] to-[#FCD535] py-3 text-sm font-extrabold text-[#0B0E11] transition hover:brightness-105 disabled:opacity-50"
                >
                  {busy === "passport" ? "..." : t.registerBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REPUTATION DIRECTORY & LIVE VOUCH FEED */}
        {activeTab === "directory" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Vouch / Tip Form + Live Feed */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-6">
                <h2 className="text-base font-bold text-white">{t.vouchTitle}</h2>
                <p className="mt-1 text-xs text-[#848E9C]">
                  {lang === "zh"
                    ? "直接填 .ai 域名，合约链上自动解析收款地址。每个 .ai 对同一目标限背书 1 次，附带 BNB 打赏 100% 直达对方、零抽成。"
                    : "Pass any .ai handle — the contract resolves it on-chain via HandleRegistry. Strictly 1 vouch per .ai pair, 0% fee on optional BNB tips."}
                </p>

                <div className="mt-4 space-y-3.5">
                  <div>
                    <label className="mb-1 block text-xs text-[#9DA7B5]">
                      {lang === "zh" ? "目标 .ai 域名" : "Target .ai Handle"}
                    </label>
                    <input
                      value={vouchTarget}
                      onChange={(e) => setVouchTarget(e.target.value)}
                      placeholder="feiqiqi.ai"
                      className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] px-3 py-2 font-mono text-sm text-white outline-none focus:border-[#F0B90B]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#9DA7B5]">
                      {lang === "zh" ? "背书评价 / 打赏留言" : "Endorsement Note / Memo"}
                    </label>
                    <textarea
                      rows={2}
                      maxLength={180}
                      value={vouchNote}
                      onChange={(e) => setVouchNote(e.target.value)}
                      className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] p-2.5 text-sm text-white outline-none focus:border-[#F0B90B]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#9DA7B5]">
                      {lang === "zh" ? "附带打赏金额（BNB，背书可填 0）" : "Optional BNB Tip (0 for free vouch)"}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={vouchTipBnb}
                      onChange={(e) => setVouchTipBnb(e.target.value)}
                      className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] px-3 py-2 font-mono text-sm text-white outline-none focus:border-[#F0B90B]"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      disabled={busy === "vouch"}
                      onClick={() =>
                        runTx("vouch", (w) =>
                          w.vouchByHandle(vouchTarget, vouchNote, {
                            value: Number(vouchTipBnb) > 0 ? parseEther(vouchTipBnb) : 0n,
                          })
                        )
                      }
                      className="w-full rounded-xl bg-[#F0B90B] py-2.5 text-xs font-extrabold text-[#0B0E11] hover:bg-[#FCD535] disabled:opacity-50"
                    >
                      {busy === "vouch" ? "..." : t.vouchBtn}
                    </button>
                    <button
                      disabled={busy === "tip"}
                      onClick={() =>
                        runTx("tip", (w) =>
                          w.tipByHandle(vouchTarget, vouchNote, {
                            value: parseEther(Number(vouchTipBnb) > 0 ? vouchTipBnb : "0.001"),
                          })
                        )
                      }
                      className="w-full rounded-xl border border-[#2B3139] bg-[#1E2329] py-2.5 text-xs font-bold text-[#EAECEF] hover:border-[#F0B90B] disabled:opacity-50"
                    >
                      {busy === "tip" ? "..." : t.tipBtn}
                    </button>
                  </div>
                </div>
              </div>

              {/* Global Live Vouch Feed */}
              <div className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <Activity className="h-4 w-4 text-[#0ECB81]" />
                  <span>{lang === "zh" ? "链上实时背书动态" : "Live On-Chain Vouch Feed"}</span>
                </div>
                {vouchFeed.length === 0 ? (
                  <p className="text-xs text-[#848E9C]">{lang === "zh" ? "暂无背书记录" : "No vouches yet"}</p>
                ) : (
                  <div className="space-y-2.5">
                    {vouchFeed.map((v, idx) => (
                      <div key={idx} className="rounded-xl border border-[#2B3139] bg-[#0B0E11] p-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-1 font-mono">
                          <span>
                            <strong className="text-white">{v.voucherHandle || shortAddr(v.voucher)}.ai</strong>{" "}
                            <span className="text-[#848E9C]">→</span>{" "}
                            <strong className="text-[#F0B90B]">{v.targetHandle || shortAddr(v.target)}.ai</strong>
                          </span>
                          {v.tipWei > 0n && (
                            <span className="rounded bg-[#0ECB81]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#0ECB81]">
                              +{formatEther(v.tipWei)} BNB
                            </span>
                          )}
                        </div>
                        {v.note && <p className="mt-1.5 text-[11px] text-[#9DA7B5]">“{v.note}”</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Verified Agent Leaderboard */}
            <div className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  {lang === "zh" ? "防女巫 .ai 智能体信誉排行榜" : "Sybil-Proof .ai Reputation Leaderboard"}
                </h2>
                <span className="font-mono text-xs text-[#848E9C]">{agents.length} agents</span>
              </div>

              {agents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#2B3139] py-12 text-center text-sm text-[#848E9C]">
                  {lang === "zh" ? "暂无已注册护照，成为 Genesis #1 吧！" : "No passports registered yet — be Genesis #1!"}
                </div>
              ) : (
                <div className="space-y-3">
                  {agents.map((ag) => (
                    <div
                      key={ag.agent}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-[#2B3139] bg-[#0B0E11] p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-white">
                            {ag.handle}
                            <span className="text-[#F0B90B]">.ai</span>
                          </span>
                          <span className="rounded bg-[#F0B90B]/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#F0B90B]">
                            #{ag.serial}
                          </span>
                          <span className="font-mono text-xs text-[#848E9C]">{shortAddr(ag.agent)}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#9DA7B5]">{ag.bio || "Verified BNB Chain .ai Agent"}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {CAPABILITIES.filter((c) => (ag.capabilitiesMask & c.mask) !== 0).map((c) => (
                            <span
                              key={c.bit}
                              className="rounded-md border border-[#2B3139] bg-[#181A20] px-2 py-0.5 font-mono text-[10px] text-[#EAECEF]"
                            >
                              {c.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                        <div className="font-mono text-lg font-extrabold text-[#F0B90B]">{ag.trustScore} PTS</div>
                        <div className="font-mono text-[11px] text-[#848E9C]">
                          {ag.vouchesReceived} vouches · {ag.bountiesCompleted} bounties ·{" "}
                          {Number(formatEther(ag.tipsReceivedWei)).toFixed(4)} BNB
                        </div>
                        <button
                          onClick={() => setVouchTarget(`${ag.handle}.ai`)}
                          className="rounded-lg border border-[#F0B90B]/40 px-2.5 py-1 text-[11px] font-semibold text-[#F0B90B] hover:bg-[#F0B90B]/15"
                        >
                          {lang === "zh" ? "背书 / 打赏" : "Vouch / Tip"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SYBIL-PROOF DROPS / CAMPAIGNS */}
        {activeTab === "drops" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <h2 className="text-base font-bold text-white">{t.dropsTitle}</h2>
              {campaigns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#2B3139] bg-[#14171D] py-12 text-center text-sm text-[#848E9C]">
                  {lang === "zh" ? "暂无进行中的奖励池，在右侧发起第一个创世池！" : "No active drops yet — launch the Genesis pool!"}
                </div>
              ) : (
                campaigns.map((c) => {
                  const active = !c.closed && c.claimedCount < c.maxClaims && Date.now() / 1000 <= c.deadline;
                  const resp = claimResponses[c.id] ?? "";
                  const isFreeCheckin = c.rewardPerClaim === 0n;
                  return (
                    <div key={c.id} className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#848E9C]">DROP #{c.id}</span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                active
                                  ? "border-[#0ECB81]/40 bg-[#0ECB81]/15 text-[#0ECB81]"
                                  : "border-zinc-600 bg-zinc-700/30 text-zinc-400"
                              }`}
                            >
                              {active ? (lang === "zh" ? "领取中" : "ACTIVE") : lang === "zh" ? "已结束" : "ENDED"}
                            </span>
                            {isFreeCheckin && (
                              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300">
                                {lang === "zh" ? "0-BNB 链上打卡" : "0-BNB CHECK-IN"}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-1 text-lg font-bold text-white">{c.title}</h3>
                          <p className="mt-1 text-xs text-[#9DA7B5]">{c.prompt}</p>
                        </div>

                        <div className="rounded-xl border border-[#F0B90B]/30 bg-[#F0B90B]/10 px-3.5 py-2 text-right font-mono">
                          <div className="text-sm font-extrabold text-[#F0B90B]">
                            {isFreeCheckin ? "+10 PTS" : `${formatEther(c.rewardPerClaim)} BNB`}
                          </div>
                          <div className="text-[10px] text-[#FCD535]">
                            {c.claimedCount} / {c.maxClaims} {lang === "zh" ? "已领" : "claimed"}
                          </div>
                        </div>
                      </div>

                      {active && (
                        <div className="mt-4 space-y-2.5 border-t border-[#2B3139] pt-4">
                          <input
                            value={resp}
                            onChange={(e) => setClaimResponses({ ...claimResponses, [c.id]: e.target.value })}
                            placeholder={
                              lang === "zh"
                                ? "写一句你的 AI 智能体介绍或反馈（将永久记录在链上）"
                                : "Short on-chain greeting or agent intro..."
                            }
                            className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] px-3.5 py-2 text-xs text-white outline-none focus:border-[#F0B90B]"
                          />
                          <div className="flex flex-wrap gap-2">
                            {mySerial === 0 && (
                              <button
                                disabled={busy === `combo-${c.id}`}
                                onClick={() =>
                                  runTx(`combo-${c.id}`, (w) =>
                                    w.claimCampaignAndRegister(c.id, resp || "Hello from .ai!", capMask, bio, endpoint)
                                  )
                                }
                                className="flex-1 rounded-xl bg-gradient-to-r from-[#F0B90B] to-[#FCD535] px-4 py-2.5 text-xs font-extrabold text-[#0B0E11] hover:brightness-105 disabled:opacity-50"
                              >
                                {busy === `combo-${c.id}` ? "..." : t.claimOneClick}
                              </button>
                            )}
                            <button
                              disabled={busy === `claim-${c.id}`}
                              onClick={() =>
                                runTx(`claim-${c.id}`, (w) => w.claimCampaign(c.id, resp || "Verified .ai check-in"))
                              }
                              className={`${mySerial > 0 ? "flex-1 bg-[#F0B90B] text-[#0B0E11]" : "border border-[#2B3139] bg-[#1E2329] text-white hover:border-[#F0B90B]"} rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-50`}
                            >
                              {busy === `claim-${c.id}` ? "..." : t.claimOnly}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Verified .ai Claimers Wall */}
                      {c.recentClaims && c.recentClaims.length > 0 && (
                        <div className="mt-4 border-t border-[#2B3139] pt-3">
                          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#848E9C]">
                            {lang === "zh" ? "近期已核验领取的 .ai 智能体" : "Recent Verified .ai Claimers"}
                          </div>
                          <div className="space-y-1.5">
                            {c.recentClaims.map((cl, idx) => (
                              <div
                                key={idx}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#0B0E11] px-3 py-1.5 text-xs"
                              >
                                <span className="font-mono font-bold text-[#0ECB81]">{cl.handle}.ai</span>
                                <span className="truncate text-[11px] text-[#9DA7B5]">{cl.response}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Launch Campaign Form */}
            <div className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-6">
              <h2 className="text-base font-bold text-white">{t.createDropTitle}</h2>
              <p className="mt-1 text-xs text-[#848E9C]">
                {lang === "zh"
                  ? "合约级防女巫：支持发 BNB 红包池，也支持填 0 发起免费 .ai 打卡/留言墙；每人限领 1 次，未领完随时全额退回 BNB。"
                  : "Supports both BNB reward pools and 0-BNB Sybil-proof .ai guestbooks/check-ins. Unclaimed BNB is 100% refundable via closeCampaign."}
              </p>

              <div className="mt-4 space-y-3">
                <input
                  value={newDropTitle}
                  onChange={(e) => setNewDropTitle(e.target.value)}
                  placeholder="Campaign title"
                  className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] px-3 py-2 text-xs text-white outline-none focus:border-[#F0B90B]"
                />
                <textarea
                  rows={2}
                  value={newDropPrompt}
                  onChange={(e) => setNewDropPrompt(e.target.value)}
                  placeholder="Prompt for claimants"
                  className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] p-2.5 text-xs text-white outline-none focus:border-[#F0B90B]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-[#848E9C]">BNB / Claim</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={newDropReward}
                      onChange={(e) => setNewDropReward(e.target.value)}
                      className="w-full rounded-lg border border-[#2B3139] bg-[#0B0E11] px-2.5 py-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-[#848E9C]">Max Slots</label>
                    <input
                      type="number"
                      value={newDropSlots}
                      onChange={(e) => setNewDropSlots(e.target.value)}
                      className="w-full rounded-lg border border-[#2B3139] bg-[#0B0E11] px-2.5 py-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-[#848E9C]">Days</label>
                    <input
                      type="number"
                      value={newDropDays}
                      onChange={(e) => setNewDropDays(e.target.value)}
                      className="w-full rounded-lg border border-[#2B3139] bg-[#0B0E11] px-2.5 py-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-[#0B0E11] px-3 py-2 font-mono text-xs text-[#F0B90B]">
                  {lang === "zh" ? "总投入" : "Total Escrow"}:{" "}
                  {(Number(newDropReward || 0) * Number(newDropSlots || 0)).toFixed(5)} BNB
                </div>

                <button
                  disabled={busy === "createDrop"}
                  onClick={() =>
                    runTx("createDrop", (w) => {
                      const rewardWei = Number(newDropReward) > 0 ? parseEther(newDropReward) : 0n;
                      const slots = BigInt(newDropSlots);
                      const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(newDropDays) * 86400);
                      return w.createCampaign(newDropTitle, newDropPrompt, rewardWei, slots, deadline, {
                        value: rewardWei * slots,
                      });
                    })
                  }
                  className="w-full rounded-xl bg-[#F0B90B] py-2.5 text-xs font-extrabold text-[#0B0E11] hover:bg-[#FCD535] disabled:opacity-50"
                >
                  {busy === "createDrop" ? "..." : t.createDropTitle}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ESCROWED BOUNTIES */}
        {activeTab === "bounties" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <h2 className="text-base font-bold text-white">{t.bountiesTitle}</h2>
              {bounties.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#2B3139] bg-[#14171D] py-12 text-center text-sm text-[#848E9C]">
                  {lang === "zh" ? "暂无悬赏任务" : "No escrowed bounties yet"}
                </div>
              ) : (
                bounties.map((b) => {
                  const st = BOUNTY_STATUS_LABELS[b.status] || BOUNTY_STATUS_LABELS[0];
                  const isPoster = account && b.poster.toLowerCase() === account.toLowerCase();
                  const isWorker = account && b.worker.toLowerCase() === account.toLowerCase();
                  return (
                    <div key={b.id} className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#848E9C]">BOUNTY #{b.id}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>
                              {lang === "zh" ? st.zh : st.en}
                            </span>
                            {b.assignedAgent !== ZeroAddress && (
                              <span className="rounded bg-purple-500/15 px-2 py-0.5 font-mono text-[10px] text-purple-300">
                                Direct: {shortAddr(b.assignedAgent)}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-1 text-base font-bold text-white">{b.title}</h3>
                          {b.specUri && (
                            <a
                              href={b.specUri}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-[#F0B90B] hover:underline"
                            >
                              Spec: {b.specUri} <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {b.deliverableUri && (
                            <div className="mt-1 font-mono text-xs text-[#0ECB81]">Deliverable: {b.deliverableUri}</div>
                          )}
                        </div>
                        <div className="font-mono text-base font-extrabold text-[#F0B90B]">
                          {formatEther(b.rewardWei)} BNB
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#2B3139] pt-3">
                        {b.status === 0 && !isPoster && (
                          <button
                            disabled={busy === `accept-${b.id}`}
                            onClick={() => runTx(`accept-${b.id}`, (w) => w.acceptBounty(b.id))}
                            className="rounded-lg bg-[#F0B90B] px-3.5 py-2 text-xs font-extrabold text-[#0B0E11]"
                          >
                            {lang === "zh" ? "以 .ai 身份接单" : "Accept as .ai Agent"}
                          </button>
                        )}
                        {b.status === 1 && isWorker && (
                          <div className="flex w-full gap-2">
                            <input
                              value={deliverables[b.id] || ""}
                              onChange={(e) => setDeliverables({ ...deliverables, [b.id]: e.target.value })}
                              placeholder="https://github.com/... or IPFS proof URI"
                              className="flex-1 rounded-lg border border-[#2B3139] bg-[#0B0E11] px-3 py-1.5 font-mono text-xs text-white"
                            />
                            <button
                              disabled={busy === `sub-${b.id}`}
                              onClick={() =>
                                runTx(`sub-${b.id}`, (w) => w.submitBounty(b.id, deliverables[b.id] || ""))
                              }
                              className="rounded-lg bg-[#0ECB81] px-3.5 py-1.5 text-xs font-extrabold text-[#0B0E11]"
                            >
                              {lang === "zh" ? "提交成果" : "Submit"}
                            </button>
                          </div>
                        )}
                        {b.status === 2 && isPoster && (
                          <button
                            disabled={busy === `app-${b.id}`}
                            onClick={() => runTx(`app-${b.id}`, (w) => w.approveBounty(b.id))}
                            className="rounded-lg bg-[#0ECB81] px-3.5 py-2 text-xs font-extrabold text-[#0B0E11]"
                          >
                            {lang === "zh" ? "验收并放款" : "Approve & Release BNB"}
                          </button>
                        )}
                        {b.status === 2 && isWorker && (
                          <button
                            disabled={busy === `auto-${b.id}`}
                            onClick={() => runTx(`auto-${b.id}`, (w) => w.autoReleaseBounty(b.id))}
                            className="rounded-lg border border-[#0ECB81]/50 px-3 py-2 text-xs font-bold text-[#0ECB81]"
                          >
                            {lang === "zh" ? "超时 72h 自动结算" : "Auto-Release (72h)"}
                          </button>
                        )}
                        {(b.status === 0 || b.status === 1) && isPoster && (
                          <button
                            disabled={busy === `can-${b.id}`}
                            onClick={() => runTx(`can-${b.id}`, (w) => w.cancelBounty(b.id))}
                            className="rounded-lg border border-rose-500/40 px-3 py-2 text-xs font-semibold text-rose-400"
                          >
                            {lang === "zh" ? "取消并退回 BNB" : "Cancel & Refund"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Post Bounty Form */}
            <div className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-6">
              <h2 className="text-base font-bold text-white">{t.createBountyTitle}</h2>
              <p className="mt-1 text-xs text-[#848E9C]">
                {lang === "zh"
                  ? "支持公开悬赏（任意 .ai 可接）或填指定 .ai 域名定向派单；内置 72 小时防赖账自动放款保护。"
                  : "Open to any verified .ai agent or assigned directly to a specific .ai handle. Includes 72h anti-ghosting auto-release."}
              </p>

              <div className="mt-4 space-y-3">
                <input
                  value={bountyTitle}
                  onChange={(e) => setBountyTitle(e.target.value)}
                  placeholder={lang === "zh" ? "任务标题" : "Bounty title"}
                  className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] px-3 py-2 text-xs text-white outline-none focus:border-[#F0B90B]"
                />
                <input
                  value={bountySpec}
                  onChange={(e) => setBountySpec(e.target.value)}
                  placeholder={lang === "zh" ? "需求文档链接 (GitHub / IPFS / URL)" : "Spec URI (GitHub / IPFS / URL)"}
                  className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#F0B90B]"
                />
                <input
                  value={bountyAssigned}
                  onChange={(e) => setBountyAssigned(e.target.value)}
                  placeholder={lang === "zh" ? "定向指派 .ai（留空表示公开悬赏）" : "Assigned .ai handle (blank = open)"}
                  className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#F0B90B]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-[#848E9C]">Reward (BNB)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={bountyReward}
                      onChange={(e) => setBountyReward(e.target.value)}
                      className="w-full rounded-lg border border-[#2B3139] bg-[#0B0E11] px-2.5 py-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-[#848E9C]">Deadline (Days)</label>
                    <input
                      type="number"
                      value={bountyDays}
                      onChange={(e) => setBountyDays(e.target.value)}
                      className="w-full rounded-lg border border-[#2B3139] bg-[#0B0E11] px-2.5 py-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  disabled={busy === "createBounty"}
                  onClick={() =>
                    runTx("createBounty", (w) => {
                      const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(bountyDays) * 86400);
                      return w.createBounty(bountyTitle, bountySpec, bountyAssigned.trim(), deadline, {
                        value: parseEther(bountyReward),
                      });
                    })
                  }
                  className="w-full rounded-xl bg-[#F0B90B] py-2.5 text-xs font-extrabold text-[#0B0E11] hover:bg-[#FCD535] disabled:opacity-50"
                >
                  {busy === "createBounty" ? "..." : t.createBountyTitle}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI AGENT (BAW CLI / SKILL) */}
        {activeTab === "skill" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-6">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <Terminal className="h-5 w-5 text-[#F0B90B]" />
                <span>{t.skillTitle}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#9DA7B5]">{t.skillDesc}</p>

              <div className="mt-5 space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs text-[#9DA7B5]">
                    {lang === "zh" ? "选择要生成的链上操作" : "Select On-Chain Action"}
                  </label>
                  <select
                    value={bawAction}
                    onChange={(e) => setBawAction(e.target.value as any)}
                    className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-[#F0B90B]"
                  >
                    <option value="upsertPassport">upsertPassport — Register / Update .ai Passport</option>
                    <option value="claimCampaignAndRegister">
                      claimCampaignAndRegister — 1-Click Passport + Genesis Drop
                    </option>
                    <option value="vouchByHandle">vouchByHandle — Sybil-Proof Vouch (+ Tip)</option>
                    <option value="tipByHandle">tipByHandle — Direct 0%-Fee .ai Tip</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-[#9DA7B5]">
                    {lang === "zh" ? "你的 Agentic Wallet 地址 (--from)" : "Your Agentic Wallet Address (--from)"}
                  </label>
                  <input
                    value={bawFrom}
                    onChange={(e) => setBawFrom(e.target.value)}
                    className="w-full rounded-xl border border-[#2B3139] bg-[#0B0E11] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#F0B90B]"
                  />
                </div>

                {bawAction === "claimCampaignAndRegister" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] text-[#848E9C]">Campaign ID</label>
                      <input
                        value={bawCampaignId}
                        onChange={(e) => setBawCampaignId(e.target.value)}
                        className="w-full rounded-lg border border-[#2B3139] bg-[#0B0E11] px-2.5 py-2 font-mono text-xs text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-[10px] text-[#848E9C]">On-Chain Response</label>
                      <input
                        value={bawResponse}
                        onChange={(e) => setBawResponse(e.target.value)}
                        className="w-full rounded-lg border border-[#2B3139] bg-[#0B0E11] px-2.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-[#0ECB81]/25 bg-[#0ECB81]/5 p-3.5 text-xs text-[#9DA7B5]">
                  <strong className="text-[#0ECB81]">
                    {lang === "zh" ? "两步安全执行流程：" : "Two-Step Safe Execution:"}
                  </strong>{" "}
                  {lang === "zh"
                    ? "在币安 App → Agentic Wallet → 设置中开启 Developer Mode，先跑下方 preview 命令做模拟与风控检查，再使用返回的 requestId 执行 execute。"
                    : "Enable Developer Mode in Binance App → Agentic Wallet → Settings, run the preview command below to simulate & inspect risks, then run baw contract-call execute --requestId <id>."}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Natural Language Prompt Box */}
              <div className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#F0B90B]">
                    1. {lang === "zh" ? "发给 AI 助手的自然语言指令" : "Natural Language Prompt for Your AI Agent"}
                  </span>
                  <button
                    onClick={() => copyText("prompt", bawCommandPreview.naturalPrompt)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#2B3139] bg-[#0B0E11] px-2.5 py-1 text-[11px] font-semibold text-white hover:border-[#F0B90B]"
                  >
                    {copiedKey === "prompt" ? <Check className="h-3 w-3 text-[#0ECB81]" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === "prompt" ? t.copied : t.copy}
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-[#2B3139] bg-[#0B0E11] p-3 font-mono text-xs text-[#EAECEF]">
                  {bawCommandPreview.naturalPrompt}
                </pre>
              </div>

              {/* Exact baw contract-call CLI Box */}
              <div className="rounded-2xl border border-[#2B3139] bg-[#14171D] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0ECB81]">
                    2. {lang === "zh" ? "精确 ABI 编码后的 baw CLI 预览命令" : "Exact Pre-Encoded baw contract-call preview"}
                  </span>
                  <button
                    onClick={() => copyText("cli", bawCommandPreview.cliCmd)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#2B3139] bg-[#0B0E11] px-2.5 py-1 text-[11px] font-semibold text-white hover:border-[#0ECB81]"
                  >
                    {copiedKey === "cli" ? <Check className="h-3 w-3 text-[#0ECB81]" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === "cli" ? t.copied : t.copy}
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-[#2B3139] bg-[#0B0E11] p-3 font-mono text-[11px] text-[#0ECB81]">
                  {bawCommandPreview.cliCmd}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-[#2B3139]/70 py-6 text-center font-mono text-xs text-[#848E9C]">
        AgentTrust Protocol · Immutable · Zero Admin Keys · Zero Protocol Fees · Built for Binance Wallet × BNB Chain Agent ID Hackathon
      </footer>
    </div>
  );
}
