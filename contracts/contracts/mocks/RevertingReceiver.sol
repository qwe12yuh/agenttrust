// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AgentTrust} from "../AgentTrust.sol";

/// @notice Test helper contract that rejects plain BNB transfers to verify pull-payment fallback.
contract RevertingReceiver {
    bool public acceptEth;

    receive() external payable {
        if (!acceptEth) revert("REJECT_BNB");
    }

    function setAccept(bool v) external {
        acceptEth = v;
    }

    function claimFallback(AgentTrust trust) external {
        trust.withdrawPending();
    }
}
