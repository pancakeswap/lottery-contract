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
    
    /**
     * Constructor inherits VRFConsumerBase
     * 
     * Network: Kovan
     * Chainlink VRF Coordinator address: 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9
     * LINK token address:                0xa36085F69e2889c224210F603D836748e7dC0088
     * Key Hash: 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4
     */
    constructor(
        address _vrfCoordinator,
        address _linkToken,
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
    }
    
    /** 
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(
        uint256 lotteryId,
        uint256 userProvidedSeed
    ) 
        public 
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