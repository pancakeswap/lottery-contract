//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Testable.sol";

contract LottoNFT is ERC1155, Ownable, Testable {
    // Counter for token IDs
    uint256 internal tokenIDsCount_ = 0;
    // State variables 
    address internal lottoContract_;
    // Storage for ticket information
    struct TicketInfo {
        address owner;
        uint32[] numbers;
        bool claimed;
    }
    // Token ID => Token information 
    mapping(uint256 => TicketInfo) internal ticketInfo_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event InfoBatchMint(
        address indexed receiving, 
        uint256 amountOfTokens, 
        uint256[] tokenIDs
    );

    //-------------------------------------------------------------------------
    // MODIFIERS
    //-------------------------------------------------------------------------

    /**
     * @notice  Restricts minting of new tokens to only the lotto contract.
     */
    modifier onlyLotto() {
        require(
            msg.sender == lottoContract_,
            "Only Lotto can mint"
        );
        _;
    }

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    /**
     * @param   _uri A dynamic URI that enables individuals to view information
     *          around their NFT token. To see the information replace the 
     *          `\{id\}` substring with the actual token type ID. For more info
     *          visit:
     *          https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     * @param   _lotto The address of the lotto contract. The lotto contract has
     *          elevated permissions on this contract. 
     */
    constructor(
        string memory _uri,
        address _lotto,
        address _timer
    ) 
    ERC1155(_uri)
    Testable(_timer)
    {
        // Only Lotto contract will be able to mint new tokens
        lottoContract_ = _lotto;
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    /**
     * @param   _ticketID: The unique ID of the ticket
     * @return  uint32[]: The chosen numbers for that ticket
     */
    function getTicketNumbers(
        uint256 _ticketID
    ) 
        public 
        view 
        returns(uint32[] memory) 
    {
        return ticketInfo_[_ticketID].numbers;
    }

    /**
     * @param   _ticketID: The unique ID of the ticket
     * @return  address: Owner of ticket
     */
    function getOwnerOfTicket(
        uint256 _ticketID
    ) 
        public 
        view 
        returns(address) 
    {
        return ticketInfo_[_ticketID].owner;
    }

    function getTicketClaimStatus(
        uint256 _ticketID
    ) 
        public 
        view
        returns(bool) 
    {
        return ticketInfo_[_ticketID].claimed;
    }

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS 
    //-------------------------------------------------------------------------

    /**
     * @param   _to The address being minted to
     * @param   _numberOfTickets The number of NFT's to mint
     * @notice  Only the lotto contract is able to mint tokens. 
        // uint8[][] calldata _lottoNumbers
     */
    function batchMint(
        address _to,
        uint256 _lottoID,
        uint32 _numberOfTickets,
        uint32[] calldata _numbers,
        uint8 sizeOfLottery
    )
        external
        onlyLotto()
        returns(uint256[] memory)
    {
        // Storage for the amount of tokens to mint (always 1)
        uint256[] memory amounts = new uint256[](_numberOfTickets);
        // Storage for the token IDs
        uint256[] memory tokenIDs = new uint256[](_numberOfTickets);
        for (uint32 i = 0; i < _numberOfTickets; i += 1) {
            // Incrementing the tokenID counter
            tokenIDsCount_ += 1;
            tokenIDs[i] = tokenIDsCount_;
            amounts[i] = 1;
            // Getting the start and end position of numbers for this ticket
            uint32 start = i*sizeOfLottery;
            uint32 end = (i+1)*sizeOfLottery;
            // Splitting out the chosen numbers
            uint32[] calldata numbers = _numbers[start:end];
            // Storing the ticket information 
            ticketInfo_[tokenIDsCount_] = TicketInfo(
                _to,
                numbers,
                false
            );
        }
        // Minting the batch of tokens
        _mintBatch(
            _to,
            tokenIDs,
            amounts,
            msg.data
        );
        // Emitting relevant info
        emit InfoBatchMint(
            _to, 
            _numberOfTickets, 
            tokenIDs
        ); 
        // Returns the token IDs of minted tokens
        return tokenIDs;
    }

    function claimTicket(uint256 _ticketID) public onlyLotto() returns(bool) {
        ticketInfo_[_ticketID].claimed = true;
        return true;
    }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS 
    //-------------------------------------------------------------------------


}

