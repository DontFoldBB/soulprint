// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISoulprint {
    function traitsOf(address wallet)
        external
        view
        returns (uint256 tokenId, string memory archetype, uint256 activity, uint256 generation);
}

/// @title ExampleGate — "NFT as access" demo.
/// @notice Minimal example of a third-party contract composing on Soulprint: it admits a
/// caller only if their wallet holds a Soulprint with an on-chain activity score >= a
/// threshold. Because Soulprint is soulbound, access can't be bought — it reflects the
/// caller's real on-chain history. Any DAO/airdrop/community can gate the same way.
contract ExampleGate {
    ISoulprint public immutable soulprint;
    uint256 public immutable minActivity;

    mapping(address => bool) public entered;

    event Entered(address indexed wallet, string archetype, uint256 activity);

    constructor(address soulprint_, uint256 minActivity_) {
        require(soulprint_ != address(0), "zero soulprint");
        soulprint = ISoulprint(soulprint_);
        minActivity = minActivity_;
    }

    /// @notice Pass the gate if the caller's Soulprint meets the activity bar.
    function enter() external {
        (uint256 tokenId, string memory archetype, uint256 activity, ) =
            soulprint.traitsOf(msg.sender);
        require(tokenId != 0, "no soulprint");
        require(activity >= minActivity, "activity too low");
        entered[msg.sender] = true;
        emit Entered(msg.sender, archetype, activity);
    }
}
