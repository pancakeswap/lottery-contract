//SPDX-License-Identifier: MIT
pragma solidity >= 0.6.0 < 0.8.0;
pragma experimental ABIEncoderV2;

interface ILottoNFT {

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function getTicketNumbers(
        uint256 _ticketID
    ) 
        external 
        view 
        returns(uint32[] memory);

    function getOwnerOfTicket(
        uint256 _ticketID
    ) 
        external 
        view 
        returns(address);

    function getTicketClaimStatus(
        uint256 _ticketID
    ) 
        external 
        view
        returns(bool);

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS 
    //-------------------------------------------------------------------------

    function batchMint(
        address _to,
        uint256 _lottoID,
        uint32 _numberOfTickets,
        uint32[] calldata _numbers,
        uint8 sizeOfLottery
    )
        external
        returns(uint256[] memory);

    function claimTicket(uint256 _ticketID) external returns(bool);
}