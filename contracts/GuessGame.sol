// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";

error VoidFund();
error InvalidPlayerCount();
error InvalidGuessNumber();
error PlayerAlreadyGuessed();
error NumberAlreadyGuessed();
error InvalidETHAmount();
error NumberOfPalyersLimitReached();

contract GuessGame {
    bytes32 public immutable nonceHash;
    bytes32 public immutable nonceNumHash;
    uint8 public immutable numOfPlayers;
    uint256 public immutable entranceFee;

    bool public isOpen = true;
    uint16[] public guessNumbers;
    mapping(address => bool) playersExist;
    mapping(uint16 => address) numberToAddress;

    constructor(
        bytes32 _nonceHash,
        bytes32 _nonceNumHash,
        uint8 _numOfPlayers
    ) payable {
        if (msg.value == 0) revert VoidFund();
        if (_numOfPlayers < 2) revert InvalidPlayerCount();
        entranceFee = msg.value;
        nonceHash = _nonceHash;
        nonceNumHash = _nonceNumHash;
        numOfPlayers = _numOfPlayers;
    }

    function guess(uint16 number) external payable {
        if (msg.value != entranceFee) revert InvalidETHAmount();
        if (number >= 1000) revert InvalidGuessNumber();
        if (playersExist[msg.sender]) revert PlayerAlreadyGuessed();
        if (numberToAddress[number] != address(0)) revert NumberAlreadyGuessed();
        if (guessNumbers.length == numOfPlayers) revert NumberOfPalyersLimitReached();

        playersExist[msg.sender] = true;
        numberToAddress[number] = msg.sender;
        guessNumbers.push(number);
    }

    function reveal(bytes32 nonce, uint16 number) external {}
}
