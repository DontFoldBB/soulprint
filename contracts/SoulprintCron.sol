// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// Vendored from @somnia-chain/reactivity-contracts (MIT, Somnia Foundation) to avoid an
// npm peer-dependency conflict with hardhat-toolbox; see contracts/somnia-reactivity/.
import {SomniaEventHandler} from "./somnia-reactivity/SomniaEventHandler.sol";
import {SomniaExtensions} from "./somnia-reactivity/interfaces/SomniaExtensions.sol";

interface ISoulprint {
    function evolveBatch(uint256 count) external;
}

/// @title SoulprintCron — autonomous self-evolution scheduler.
/// @notice A thin Somnia Reactivity handler. On each scheduled tick it calls
/// `Soulprint.evolveBatch()` and reschedules the next tick — so dossiers evolve
/// with NO human transaction and NO off-chain keeper (the Autonomous-Performance
/// criterion). Kept separate from `Soulprint` so the core contract stays free of
/// the reactivity dependency and fully unit-testable; this glue is verified live.
/// @dev Must hold >= 32 STT to create a subscription (enforced by SomniaExtensions).
contract SoulprintCron is SomniaEventHandler {
    ISoulprint public immutable soulprint;
    address public immutable owner;

    uint64 public intervalSeconds; // gap between ticks (>= ~12s per the precompile)
    uint256 public batchSize;      // wallets re-evolved per tick
    uint256 public subscriptionId; // current scheduled subscription (0 = stopped)
    uint256 public ticks;          // ticks executed so far (proof of autonomy)

    event Started(uint256 subscriptionId);
    event Ticked(uint256 indexed tick, uint256 batchSize);
    event Stopped();

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address soulprint_, uint64 intervalSeconds_, uint256 batchSize_) payable {
        require(soulprint_ != address(0), "zero soulprint");
        require(intervalSeconds_ >= 2, "interval too short");
        require(batchSize_ > 0, "zero batch");
        soulprint = ISoulprint(soulprint_);
        owner = msg.sender;
        intervalSeconds = intervalSeconds_;
        batchSize = batchSize_;
    }

    /// @notice Owner starts the recurring schedule (one-shot subscription that
    /// self-reschedules inside `_onEvent`). Requires >= 32 STT on this contract.
    function start() external onlyOwner {
        require(subscriptionId == 0, "already started"); // stop()/forceReset() first to re-arm
        _scheduleNext();
        emit Started(subscriptionId);
    }

    /// @notice Owner cancels the active subscription.
    function stop() external onlyOwner {
        if (subscriptionId != 0) {
            SomniaExtensions.unsubscribe(subscriptionId);
            subscriptionId = 0;
            emit Stopped();
        }
    }

    /// @notice Owner escape hatch: forget the current subscription handle WITHOUT calling the
    /// precompile. Use to re-arm after a stalled tick (whose in-handler `_scheduleNext` reverted,
    /// e.g. on low balance) left a dead non-zero `subscriptionId` behind — then call `start()`.
    /// Unlike `stop()`, this can't revert on an already-dead subscription.
    function forceReset() external onlyOwner {
        subscriptionId = 0;
    }

    /// @notice Owner tunes the cadence / batch size for subsequent ticks.
    function setParams(uint64 intervalSeconds_, uint256 batchSize_) external onlyOwner {
        require(intervalSeconds_ >= 2, "interval too short");
        require(batchSize_ > 0, "zero batch");
        intervalSeconds = intervalSeconds_;
        batchSize = batchSize_;
    }

    /// @notice Owner can recover the contract's STT (e.g. before redeploy).
    function withdraw(uint256 amount) external onlyOwner {
        (bool ok, ) = payable(owner).call{value: amount}("");
        require(ok, "withdraw failed");
    }

    function _scheduleNext() internal {
        // maxFeePerGas MUST exceed the protocol base fee (>= 6 gwei) or the scheduled
        // callback tx is never includable. (A previous build set 0 and ticks never fired.)
        SomniaExtensions.SubscriptionOptions memory opts = SomniaExtensions.SubscriptionOptions({
            priorityFeePerGas: 1 gwei,
            maxFeePerGas: 50 gwei,
            gasLimit: 12_000_000
        });
        subscriptionId = SomniaExtensions.scheduleSubscriptionAtTimestamp(
            address(this),
            (block.timestamp + intervalSeconds) * 1000, // absolute ms, must be >= ~now+1s
            opts
        );
    }

    /// @dev Invoked by the reactivity precompile (gated in SomniaEventHandler.onEvent).
    function _onEvent(address, bytes32[] calldata, bytes calldata) internal override {
        ticks += 1;
        emit Ticked(ticks, batchSize);
        soulprint.evolveBatch(batchSize); // funded by Soulprint's own reserve
        _scheduleNext();                  // chain the next tick (recurrence)
    }

    receive() external payable {}
}
