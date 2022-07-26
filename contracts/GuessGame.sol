// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";

error VoidFund();
error InvalidPlayerCount();
error InvalidGuessNumber();

contract GuessGame {
    bytes32 public immutable nonceHash;
    bytes32 public immutable nonceNumHash;
    uint8 public immutable playersCount;
    bool public isOpen = true;

    constructor(
        bytes32 _nonceHash,
        bytes32 _nonceNumHash,
        uint8 _playersCount
    ) payable {
        if (msg.value == 0) revert VoidFund();
        if (_playersCount < 2) revert InvalidPlayerCount();
        nonceHash = _nonceHash;
        nonceNumHash = _nonceNumHash;
        playersCount = _playersCount;
    }

    function guess(uint16 number) external payable {
        if (number >= 1000) revert InvalidGuessNumber();
    }

    function reveal(bytes32 nonce, uint16 number) external {}
}
