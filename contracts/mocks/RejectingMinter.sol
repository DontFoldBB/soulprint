// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISoulprintRead {
    function read(address wallet) external payable;
}

/// @notice Test helper: a contract that profiles ITSELF (a self-mint, so the fee is escrowed
/// for a refund) but has no payable `receive` — so the refund transfer fails. Used to prove a
/// rejecting recipient can't revert the whole mint.
contract RejectingMinter {
    function mintSelf(address soulprint) external payable {
        ISoulprintRead(soulprint).read{value: msg.value}(address(this));
    }
    // intentionally NO receive()/fallback — the refund call will fail
}
