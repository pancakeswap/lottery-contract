//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

interface ILottoNFT {
    function batchMint(
        address _to,
        uint8 _amount
    )
        external
        returns(uint256[] memory tokenIDs);
}