// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHandleRegistry} from "../interfaces/IHandleRegistry.sol";

/// @title MockHandleRegistry
/// @notice Testnet / local mirror of SPACE ID Agent ID (HandleRegistry) for deterministic unit testing.
contract MockHandleRegistry is IHandleRegistry {
    mapping(address => string) public override handleOf;
    mapping(bytes32 => address) private _owners;

    error AlreadyRegistered();
    error HandleTaken();
    error InvalidHandle();

    function mockMint(address to, string calldata handle) external {
        if (!isValidHandle(handle)) revert InvalidHandle();
        if (bytes(handleOf[to]).length != 0) revert AlreadyRegistered();
        bytes32 label = keccak256(bytes(handle));
        if (_owners[label] != address(0)) revert HandleTaken();

        handleOf[to] = handle;
        _owners[label] = to;
    }

    function ownerOfHandle(string calldata handle) external view override returns (address) {
        return _owners[keccak256(bytes(handle))];
    }

    function balanceOf(address owner) external view override returns (uint256) {
        return bytes(handleOf[owner]).length > 0 ? 1 : 0;
    }

    function isValidHandle(string calldata handle) public pure override returns (bool) {
        bytes calldata b = bytes(handle);
        if (b.length < 3 || b.length > 64) return false;
        for (uint256 i = 0; i < b.length; ++i) {
            uint8 c = uint8(b[i]);
            if (!((c >= 0x61 && c <= 0x7a) || (c >= 0x30 && c <= 0x39))) return false;
        }
        return true;
    }
}
