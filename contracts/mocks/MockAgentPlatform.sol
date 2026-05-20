// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAgentRequester, Response, Request, ResponseStatus} from "../interfaces/ISomniaAgents.sol";

/// @notice Synchronous stand-in for the Somnia Agents platform, for unit tests.
/// Records each request, then `deliver(...)` invokes the requester callback
/// exactly as the real platform would.
contract MockAgentPlatform is IAgentRequester {
    uint256 public nextId = 1;

    struct Pending {
        address callbackAddress;
        bytes4 callbackSelector;
        uint256 agentId;
        bytes payload;
        bool exists;
    }

    mapping(uint256 => Pending) public pending;

    function getRequestDeposit() external pure returns (uint256) {
        return 0.03 ether;
    }

    function createRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId) {
        requestId = nextId++;
        pending[requestId] = Pending(callbackAddress, callbackSelector, agentId, payload, true);
    }

    /// @notice Test helper: deliver a result to the requester's callback.
    function deliver(uint256 requestId, bytes memory result, ResponseStatus status) external {
        Pending memory p = pending[requestId];
        require(p.exists, "no request");

        Response[] memory responses = new Response[](1);
        responses[0] = Response(address(this), result, status, 0, block.timestamp, 0);

        Request memory req;
        req.id = requestId;
        req.status = status;

        (bool ok, ) = p.callbackAddress.call(
            abi.encodeWithSelector(p.callbackSelector, requestId, responses, status, req)
        );
        require(ok, "callback reverted");
    }
}
