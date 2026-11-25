// Auto-generated from Hardhat artifact — do not edit manually.
export const AGENT_TRUST_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_agentIdRegistry",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_passportRenderer",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadyClaimed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyVouched",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BountyNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CampaignInactive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CampaignNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CampaignSoldOut",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CannotTargetSelf",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyInput",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "HandleNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidBountyStatus",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidDeadline",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidParams",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAgentIdHolder",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NothingToWithdraw",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReviewWindowNotElapsed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "StringTooLong",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Unauthorized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "target",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "targetHandle",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "memo",
        "type": "string"
      }
    ],
    "name": "AgentTipped",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "vouchId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "voucher",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "target",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "voucherHandle",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "targetHandle",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tipWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "note",
        "type": "string"
      }
    ],
    "name": "AgentVouched",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "worker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "workerHandle",
        "type": "string"
      }
    ],
    "name": "BountyAccepted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "poster",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "refundedWei",
        "type": "uint256"
      }
    ],
    "name": "BountyCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "worker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "autoReleased",
        "type": "bool"
      }
    ],
    "name": "BountyCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "poster",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "assignedAgent",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "deadline",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      }
    ],
    "name": "BountyCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "worker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "deliverableUri",
        "type": "string"
      }
    ],
    "name": "BountySubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "claimer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "handle",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "response",
        "type": "string"
      }
    ],
    "name": "CampaignClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "refundedWei",
        "type": "uint256"
      }
    ],
    "name": "CampaignClosed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardPerClaim",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "maxClaims",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "deadline",
        "type": "uint64"
      }
    ],
    "name": "CampaignCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "handle",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "uint32",
        "name": "serial",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isNew",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "capabilitiesMask",
        "type": "uint16"
      }
    ],
    "name": "PassportUpserted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountWei",
        "type": "uint256"
      }
    ],
    "name": "WithdrawalClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountWei",
        "type": "uint256"
      }
    ],
    "name": "WithdrawalCredited",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "GENESIS_LIMIT",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_BIO_BYTES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_NOTE_BYTES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_TITLE_BYTES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_URI_BYTES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "REVIEW_WINDOW",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      }
    ],
    "name": "acceptBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "agentIdRegistry",
    "outputs": [
      {
        "internalType": "contract IHandleRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      }
    ],
    "name": "approveBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      }
    ],
    "name": "autoReleaseBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      }
    ],
    "name": "cancelBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "response",
        "type": "string"
      }
    ],
    "name": "claimCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "response",
        "type": "string"
      },
      {
        "internalType": "uint16",
        "name": "capabilitiesMask",
        "type": "uint16"
      },
      {
        "internalType": "string",
        "name": "bio",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "endpoint",
        "type": "string"
      }
    ],
    "name": "claimCampaignAndRegister",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      }
    ],
    "name": "closeCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "specUri",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "assignedHandle",
        "type": "string"
      },
      {
        "internalType": "uint64",
        "name": "deadline",
        "type": "uint64"
      }
    ],
    "name": "createBounty",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "prompt",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "rewardPerClaim",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "maxClaims",
        "type": "uint32"
      },
      {
        "internalType": "uint64",
        "name": "deadline",
        "type": "uint64"
      }
    ],
    "name": "createCampaign",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "getAgentProfile",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint32",
            "name": "serial",
            "type": "uint32"
          },
          {
            "internalType": "uint64",
            "name": "registeredAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "updatedAt",
            "type": "uint64"
          },
          {
            "internalType": "uint32",
            "name": "vouchesReceived",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "vouchesGiven",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "bountiesCompleted",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "campaignsClaimed",
            "type": "uint32"
          },
          {
            "internalType": "uint128",
            "name": "tipsReceivedWei",
            "type": "uint128"
          },
          {
            "internalType": "uint16",
            "name": "capabilitiesMask",
            "type": "uint16"
          },
          {
            "internalType": "string",
            "name": "bio",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "endpoint",
            "type": "string"
          }
        ],
        "internalType": "struct AgentTrust.AgentProfile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "targetHandle",
        "type": "string"
      }
    ],
    "name": "getAgentSummaryByHandle",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "agent",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "handle",
            "type": "string"
          },
          {
            "internalType": "uint32",
            "name": "serial",
            "type": "uint32"
          },
          {
            "internalType": "uint256",
            "name": "trustScore",
            "type": "uint256"
          },
          {
            "internalType": "uint32",
            "name": "vouchesReceived",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "bountiesCompleted",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "campaignsClaimed",
            "type": "uint32"
          },
          {
            "internalType": "uint128",
            "name": "tipsReceivedWei",
            "type": "uint128"
          },
          {
            "internalType": "uint16",
            "name": "capabilitiesMask",
            "type": "uint16"
          },
          {
            "internalType": "string",
            "name": "bio",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "endpoint",
            "type": "string"
          }
        ],
        "internalType": "struct AgentTrust.AgentSummary",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getAgentsPage",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "agent",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "handle",
            "type": "string"
          },
          {
            "internalType": "uint32",
            "name": "serial",
            "type": "uint32"
          },
          {
            "internalType": "uint256",
            "name": "trustScore",
            "type": "uint256"
          },
          {
            "internalType": "uint32",
            "name": "vouchesReceived",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "bountiesCompleted",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "campaignsClaimed",
            "type": "uint32"
          },
          {
            "internalType": "uint128",
            "name": "tipsReceivedWei",
            "type": "uint128"
          },
          {
            "internalType": "uint16",
            "name": "capabilitiesMask",
            "type": "uint16"
          },
          {
            "internalType": "string",
            "name": "bio",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "endpoint",
            "type": "string"
          }
        ],
        "internalType": "struct AgentTrust.AgentSummary[]",
        "name": "items",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getBountiesPage",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "poster",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "assignedAgent",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "worker",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "rewardWei",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "deadline",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "submittedAt",
            "type": "uint64"
          },
          {
            "internalType": "enum AgentTrust.BountyStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "specUri",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "deliverableUri",
            "type": "string"
          }
        ],
        "internalType": "struct AgentTrust.Bounty[]",
        "name": "items",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      }
    ],
    "name": "getBounty",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "poster",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "assignedAgent",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "worker",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "rewardWei",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "deadline",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "submittedAt",
            "type": "uint64"
          },
          {
            "internalType": "enum AgentTrust.BountyStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "specUri",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "deliverableUri",
            "type": "string"
          }
        ],
        "internalType": "struct AgentTrust.Bounty",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      }
    ],
    "name": "getCampaign",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "rewardPerClaim",
            "type": "uint256"
          },
          {
            "internalType": "uint32",
            "name": "maxClaims",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "claimedCount",
            "type": "uint32"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "deadline",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "closed",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "prompt",
            "type": "string"
          }
        ],
        "internalType": "struct AgentTrust.Campaign",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getCampaignClaims",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "claimer",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "handle",
            "type": "string"
          },
          {
            "internalType": "uint64",
            "name": "timestamp",
            "type": "uint64"
          },
          {
            "internalType": "string",
            "name": "response",
            "type": "string"
          }
        ],
        "internalType": "struct AgentTrust.ClaimRecord[]",
        "name": "items",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getCampaignsPage",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "rewardPerClaim",
            "type": "uint256"
          },
          {
            "internalType": "uint32",
            "name": "maxClaims",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "claimedCount",
            "type": "uint32"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "deadline",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "closed",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "prompt",
            "type": "string"
          }
        ],
        "internalType": "struct AgentTrust.Campaign[]",
        "name": "items",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProtocolStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalAgents",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalUniqueInteractors",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalVouches",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalTipsWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalCampaigns",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalCampaignClaims",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalBounties",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalBountiesCompleted",
            "type": "uint256"
          }
        ],
        "internalType": "struct AgentTrust.ProtocolStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getRecentVouches",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "voucher",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "voucherHandle",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "target",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "targetHandle",
            "type": "string"
          },
          {
            "internalType": "uint64",
            "name": "timestamp",
            "type": "uint64"
          },
          {
            "internalType": "uint128",
            "name": "tipWei",
            "type": "uint128"
          },
          {
            "internalType": "string",
            "name": "note",
            "type": "string"
          }
        ],
        "internalType": "struct AgentTrust.VouchFeedItem[]",
        "name": "items",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "getTrustScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "target",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getVouchesFor",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "voucher",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "target",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "timestamp",
            "type": "uint64"
          },
          {
            "internalType": "uint128",
            "name": "tipWei",
            "type": "uint128"
          },
          {
            "internalType": "string",
            "name": "note",
            "type": "string"
          }
        ],
        "internalType": "struct AgentTrust.VouchRecord[]",
        "name": "records",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasClaimedCampaign",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasInteracted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasVouched",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "passportRenderer",
    "outputs": [
      {
        "internalType": "contract IPassportRenderer",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "pendingWithdrawals",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "renderPassportSVG",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "input",
        "type": "string"
      }
    ],
    "name": "resolveAgentHandle",
    "outputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "normalized",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bountyId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "deliverableUri",
        "type": "string"
      }
    ],
    "name": "submitBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "targetHandle",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "memo",
        "type": "string"
      }
    ],
    "name": "tipByHandle",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalBountiesCompleted",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCampaignClaims",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalTipsWei",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalUniqueInteractors",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "capabilitiesMask",
        "type": "uint16"
      },
      {
        "internalType": "string",
        "name": "bio",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "endpoint",
        "type": "string"
      }
    ],
    "name": "upsertPassport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "targetHandle",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "note",
        "type": "string"
      }
    ],
    "name": "vouchByHandle",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawPending",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
