// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVRFConsumer {
    function rawFulfillRandomness(bytes32 requestId, uint256 randomness) external;
}

contract MockVRFCoordinatorSimple {
    uint256 private nonce;

    function requestRandomness(bytes32, uint256)
        external
        returns (bytes32 requestId)
    {
        nonce++;

        requestId = keccak256(
            abi.encodePacked(msg.sender, nonce, block.timestamp)
        );
    }

    function fulfill(address consumer, bytes32 requestId) external {
        uint256 randomness = uint256(
            keccak256(abi.encodePacked(requestId, block.prevrandao))
        );

        IVRFConsumer(consumer).rawFulfillRandomness(requestId, randomness);
    }
}