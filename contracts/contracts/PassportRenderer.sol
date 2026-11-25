// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title IPassportRenderer
/// @notice Interface for the standalone pure on-chain SVG Passport Renderer.
interface IPassportRenderer {
    struct RenderData {
        string handle;
        uint32 serial;
        uint256 trustScore;
        uint32 vouchesReceived;
        uint32 bountiesCompleted;
        uint32 campaignsClaimed;
        uint16 capabilitiesMask;
    }

    function renderSVG(RenderData calldata d) external pure returns (string memory);
}

/// @title PassportRenderer
/// @notice Pure, stateless, 100% on-chain SVG renderer for verified Binance Agent ID (.ai) Passports.
/// @dev Separated from AgentTrust core escrow logic for clean modularity and gas-efficient deployment.
contract PassportRenderer is IPassportRenderer {
    using Strings for uint256;

    uint256 public constant GENESIS_LIMIT = 100;

    function renderSVG(RenderData calldata d) external pure override returns (string memory) {
        bool isGenesis = d.serial > 0 && d.serial <= GENESIS_LIMIT;
        string memory tierColor = isGenesis ? "#F0B90B" : "#0ECB81";

        return string.concat(
            _svgHead(tierColor),
            _svgIdentity(d, isGenesis, tierColor),
            _svgStats(d),
            _renderCapabilities(d.capabilitiesMask),
            '<line x1="30" y1="322" x2="570" y2="322" stroke="#2B3139"/>',
            '<text x="30" y="344" fill="#848E9C" class="m" font-size="11">VERIFIED BY BINANCE AGENT ID (0x60b9...022f)</text>',
            '<text x="570" y="344" text-anchor="end" fill="#0ECB81" class="m" font-size="11">1 HUMAN = 1 AGENT</text></svg>'
        );
    }

    function _svgHead(string memory tierColor) private pure returns (string memory) {
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" width="600" height="360">',
            "<defs><style>",
            ".m{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}",
            ".s{font-family:system-ui,-apple-system,sans-serif}",
            ".k{fill:#848E9C;font-size:10px;letter-spacing:1px}",
            ".v{fill:#EAECEF;font-size:20px;font-weight:700}",
            ".c{fill:#EAECEF;font-size:11px;text-anchor:middle}",
            "</style>",
            '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
            '<stop offset="0%" stop-color="#0B0E11"/><stop offset="55%" stop-color="#141923"/><stop offset="100%" stop-color="#1E2329"/>',
            "</linearGradient>",
            '<linearGradient id="g" x1="0" y1="0" x2="1" y2="0">',
            '<stop offset="0%" stop-color="#F0B90B"/><stop offset="100%" stop-color="#FCD535"/></linearGradient></defs>',
            '<rect width="600" height="360" rx="22" fill="url(#bg)"/>',
            '<rect x="1.5" y="1.5" width="597" height="357" rx="21" fill="none" stroke="',
            tierColor,
            '" stroke-opacity=".5" stroke-width="2"/>'
        );
    }

    function _svgIdentity(RenderData calldata d, bool isGenesis, string memory tierColor) private pure returns (string memory) {
        string memory tierLabel = isGenesis ? "GENESIS AGENT" : "VERIFIED AGENT";
        string memory serialStr = d.serial > 0 ? string.concat("#", uint256(d.serial).toString()) : "#---";
        uint256 fillWidth = d.trustScore >= 500 ? 540 : (d.trustScore * 540) / 500;
        if (fillWidth < 36) fillWidth = 36;

        return string.concat(
            '<rect x="28" y="26" width="152" height="28" rx="14" fill="',
            tierColor,
            '" fill-opacity=".16" stroke="',
            tierColor,
            '" stroke-opacity=".6"/>',
            '<text x="104" y="45" text-anchor="middle" fill="',
            tierColor,
            '" class="m" font-size="12" font-weight="700" letter-spacing="1">',
            tierLabel,
            "</text>",
            '<text x="572" y="45" text-anchor="end" fill="#848E9C" class="m" font-size="14" font-weight="700">AGENTTRUST ',
            serialStr,
            "</text>",
            '<text x="30" y="106" fill="#EAECEF" class="m" font-size="34" font-weight="800">',
            d.handle,
            '<tspan fill="#F0B90B">.ai</tspan></text>',
            '<text x="30" y="132" fill="#848E9C" class="s" font-size="13">Soulbound KYC-Backed Agent Identity on BNB Smart Chain</text>',
            '<text x="30" y="175" class="m k">SYBIL-PROOF TRUST SCORE</text>',
            '<text x="570" y="175" text-anchor="end" fill="#F0B90B" class="m" font-size="22" font-weight="800">',
            d.trustScore.toString(),
            " PTS</text>",
            '<rect x="30" y="187" width="540" height="10" rx="5" fill="#2B3139"/>',
            '<rect x="30" y="187" width="',
            fillWidth.toString(),
            '" height="10" rx="5" fill="url(#g)"/>'
        );
    }

    function _svgStats(RenderData calldata d) private pure returns (string memory) {
        return string.concat(
            _statBox(30, "PEER VOUCHES", uint256(d.vouchesReceived).toString()),
            _statBox(215, "BOUNTIES DONE", uint256(d.bountiesCompleted).toString()),
            _statBox(400, "DROPS CLAIMED", uint256(d.campaignsClaimed).toString())
        );
    }

    function _statBox(uint256 x, string memory label, string memory value) private pure returns (string memory) {
        return string.concat(
            '<rect x="',
            x.toString(),
            '" y="214" width="170" height="58" rx="10" fill="#181D26" stroke="#2B3139"/>',
            '<text x="',
            (x + 14).toString(),
            '" y="236" class="m k">',
            label,
            '</text><text x="',
            (x + 14).toString(),
            '" y="260" class="m v">',
            value,
            "</text>"
        );
    }

    function _renderCapabilities(uint16 mask) private pure returns (string memory) {
        string[8] memory labels = ["DeFi", "Trading", "Research", "Coding", "Security", "Social", "Predict", "Data"];
        string memory out = "";
        uint256 x = 30;
        uint256 shown = 0;

        for (uint256 i = 0; i < 8 && shown < 5; ++i) {
            if ((uint256(mask) & (uint256(1) << i)) != 0) {
                out = string.concat(
                    out,
                    '<rect x="',
                    x.toString(),
                    '" y="286" width="96" height="22" rx="11" fill="#2B3139"/>',
                    '<text x="',
                    (x + 48).toString(),
                    '" y="301" class="m c">',
                    labels[i],
                    "</text>"
                );
                x += 106;
                ++shown;
            }
        }

        if (shown == 0) {
            return '<text x="30" y="301" fill="#5E6673" class="m" font-size="11">GENERAL AUTONOMOUS AGENT</text>';
        }
        return out;
    }
}
