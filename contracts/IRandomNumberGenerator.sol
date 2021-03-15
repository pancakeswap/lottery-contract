//SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IRandomNumberGenerator {

    /** 
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(
        uint256 lotteryId,
        uint256 userProvidedSeed
    ) 
        external 
        returns (bytes32 requestId);
}