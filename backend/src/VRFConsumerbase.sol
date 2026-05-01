// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVRFCoordinator {
    function requestRandomness(bytes32 keyHash, uint256 fee) external returns (bytes32);
}

abstract contract VRFConsumerBase {

    address public vrfCoordinator;

    constructor(address _vrfCoordinator) {
        vrfCoordinator = _vrfCoordinator;
    }

    function requestRandomness(bytes32 keyHash, uint256 fee)
        internal
        returns (bytes32 requestId)
    {
        return IVRFCoordinator(vrfCoordinator).requestRandomness(keyHash, fee);
    }

    function rawFulfillRandomness(bytes32 requestId, uint256 randomness) external {
        require(msg.sender == vrfCoordinator, "Only coordinator");
        fulfillRandomness(requestId, randomness);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal virtual;
}