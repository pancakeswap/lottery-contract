//SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@chainlink/contracts/src/v0.6/tests/VRFCoordinatorMock.sol";
import "./ILottery.sol";

contract Mock_VRFCoordinator is VRFCoordinatorMock {
    
    bytes32 internal keyHash;
    uint256 internal fee;
    address internal requester;
    uint256 public randomResult;
    uint256 public currentLotteryId;
    
    constructor(
        address _linkToken,
        bytes32 _keyHash,
        uint256 _fee
    ) 
        VRFCoordinatorMock( 
            _linkToken  
        ) public
    {
        keyHash = _keyHash;
        fee = _fee; 
    }
}