// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

error VoidFund();
error InvalidPlayerCount();
error InvalidGuessNumber();
error PlayerAlreadyGuessed();
error NumberAlreadyGuessed();
error InvalidETHAmount();
error NumberOfPalyersLimitReached();
error InvalidNonce();
error NotEnoughPlayers();
error GameClosed();

contract GuessGame {
    bytes32 public immutable nonceHash;
    bytes32 public immutable nonceNumHash;
    uint8 public immutable numOfPlayers;
    uint256 public immutable entranceFee;

    bool public isOpen = true;
    uint16[] public guessNumbers;
    address payable[] players;
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
        if (!isOpen) revert GameClosed();
        if (msg.value != entranceFee) revert InvalidETHAmount();
        if (number >= 1000) revert InvalidGuessNumber();
        if (playersExist[msg.sender]) revert PlayerAlreadyGuessed();
        if (numberToAddress[number] != address(0)) revert NumberAlreadyGuessed();
        if (guessNumbers.length == numOfPlayers) revert NumberOfPalyersLimitReached();

        playersExist[msg.sender] = true;
        numberToAddress[number] = msg.sender;
        guessNumbers.push(number);
        players.push(payable(msg.sender));
    }

    function reveal(bytes32 nonce, uint16 number) external {
        if (!isOpen) revert GameClosed();
        bytes memory nonceBytes = getNonceBytes(nonce);
        bytes memory numberBytes = getNumberStringBytes(number);
        if (keccak256(nonceBytes) != nonceHash) revert InvalidNonce();
        if (keccak256(bytes.concat(nonceBytes, numberBytes)) != nonceNumHash) revert InvalidGuessNumber();
        if (players.length != numOfPlayers) revert NotEnoughPlayers();

        isOpen = false;
        if (number >= 1000) {
            uint256 rewardAmount = address(this).balance / numOfPlayers;
            for (uint256 i = 0; i < numOfPlayers; i++) {
                players[i].transfer(rewardAmount);
            }
        } else {
            uint16 winNumber1 = guessNumbers[0];
            uint16 winNumber2;
            bool hasTwoWinners;

            uint16 delta = abs(winNumber1, number);

            for (uint256 i = 1; i < numOfPlayers; i++) {
                if (abs(guessNumbers[i], number) < delta) {
                    hasTwoWinners = false;
                    winNumber1 = guessNumbers[i];
                } else if (abs(guessNumbers[i], number) == delta) {
                    hasTwoWinners = true;
                    winNumber2 = guessNumbers[i];
                }
            }

            if (hasTwoWinners) {
                uint256 rewardAmount = address(this).balance / 2;
                payable(numberToAddress[winNumber1]).transfer(rewardAmount);
                payable(numberToAddress[winNumber2]).transfer(rewardAmount);
            } else {
                payable(numberToAddress[winNumber1]).transfer(address(this).balance);
            }
        }
    }

    function abs(uint16 a, uint16 b) private pure returns (uint16) {
        return a > b ? a - b : b - a;
    }

    function getNonceBytes(bytes32 nonce) private pure returns (bytes memory) {
        uint256 len = 0;
        while (len < 32 && nonce[len] != 0) {
            ++len;
        }
        bytes memory result = new bytes(len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = nonce[i];
        }
        return result;
    }

    function getNumberStringBytes(uint16 number) private pure returns (bytes memory) {
        bytes memory result;
        if (number < 10) {
            result = new bytes(1);
            result[0] = bytes1(uint8(number + 48));
            return result;
        }

        uint256 len = 0;
        uint16 temp;
        for (temp = number; temp != 0; temp = temp / 10) {
            len++;
        }

        result = new bytes(len);

        temp = number;
        for (uint256 i = len; i > 0; i--) {
            result[i - 1] = bytes1(uint8((temp % 10) + 48));
            temp = temp / 10;
        }
        return result;
    }
}
