// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IHandleRegistry
/// @notice Minimal interface for the verified SPACE ID Agent ID (HandleRegistry) contract on BNB Chain
///         Mainnet address: 0x60b9262456de011f7d15a54cdd8c48baaa8b022f
interface IHandleRegistry {
    /// @notice Returns the soulbound handle (without `.ai` suffix) owned by `owner`, or "" if none.
    function handleOf(address owner) external view returns (string memory);

    /// @notice Resolves a handle (without `.ai` suffix) to its owner address, or address(0) if unclaimed.
    function ownerOfHandle(string calldata handle) external view returns (address);

    /// @notice Returns 1 if `owner` holds a soulbound Agent ID, 0 otherwise.
    function balanceOf(address owner) external view returns (uint256);

    /// @notice Checks whether a handle matches the registry's character and length rules.
    function isValidHandle(string calldata handle) external view returns (bool);
}
