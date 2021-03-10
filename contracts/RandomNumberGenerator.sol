//SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import "./ILottery.sol";

contract RandomNumberGenerator is VRFConsumerBase {
    
    bytes32 internal keyHash;
    uint256 internal fee;
    address internal requester;
    uint256 public randomResult;
    uint256 public currentLotteryId;

    address public lottery;
    
    modifier onlyLottery() {
        require(
            msg.sender == lottery,
            "Only Lottery can call function"
        );
        _;
    }

    constructor(
        address _vrfCoordinator,
        address _linkToken,
        address _lottery,
        bytes32 _keyHash,
        uint256 _fee
    ) 
        VRFConsumerBase(
            _vrfCoordinator, 
            _linkToken  
        ) public
    {
        keyHash = _keyHash;
        fee = _fee; 
        lottery = _lottery;
    }
    
    /** 
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(
        uint256 lotteryId,
        uint256 userProvidedSeed
    ) 
        public 
        onlyLottery()
        returns (bytes32 requestId) 
    {
        require(keyHash != bytes32(0), "Must have valid key hash");
        require(
            LINK.balanceOf(address(this)) >= fee, 
            "Not enough LINK - fill contract with faucet"
        );
        requester = msg.sender;
        currentLotteryId = lotteryId;
        return requestRandomness(keyHash, fee, userProvidedSeed);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        ILottery(requester).numbersDrawn(
            currentLotteryId,
            requestId,
            randomness
        );
        randomResult = randomness;
    }
}