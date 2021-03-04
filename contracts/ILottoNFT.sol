//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

interface ILottoNFT {

    function batchMint(
        address _to,
        uint256 _lottoID,
        uint32 _numberOfTickets,
        uint32[] memory _numbers
    )
        external
        returns(uint256[] memory);
}