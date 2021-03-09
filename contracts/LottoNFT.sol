//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./ILottery.sol";
import "./Testable.sol";

contract LottoNFT is ERC1155, Ownable, Testable {
    // Libraries 
    // Safe math
    using SafeMath for uint256;
    using SafeMath for uint32;
    using SafeMath for uint8;

    // Counter for token IDs
    uint256 internal tokenIdsCount_ = 0;
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
    mapping(address => uint256[]) internal userTickets_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event InfoBatchMint(
        address indexed receiving, 
        uint256 amountOfTokens, 
        uint256[] tokenIds
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

    function getUserTickets(address _user) public view returns(uint256[] memory) {
        return userTickets_[_user];
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
        uint256[] memory tokenIds = new uint256[](_numberOfTickets);
        for (uint32 i = 0; i < _numberOfTickets; i += 1) {
            // Incrementing the tokenId counter
            tokenIdsCount_ += 1;
            tokenIds[i] = tokenIdsCount_;
            amounts[i] = 1;
            // Getting the start and end position of numbers for this ticket
            uint32 start = i*sizeOfLottery;
            uint32 end = (i+1)*sizeOfLottery;
            // Splitting out the chosen numbers
            uint32[] calldata numbers = _numbers[start:end];
            // Storing the ticket information 
            ticketInfo_[tokenIdsCount_] = TicketInfo(
                _to,
                numbers,
                false
            );
            userTickets_[_to].push(tokenIdsCount_);
        }
        // Minting the batch of tokens
        _mintBatch(
            _to,
            tokenIds,
            amounts,
            msg.data
        );
        // Emitting relevant info
        emit InfoBatchMint(
            _to, 
            _numberOfTickets, 
            tokenIds
        ); 
        // Returns the token IDs of minted tokens
        return tokenIds;
    }

    function claimTicket(uint256 _ticketID) public onlyLotto() returns(bool) {
        uint256 maxRange = ILottery(lottoContract_).getMaxRange();
        for (uint256 i = 0; i < ticketInfo_[_ticketID].numbers.length; i++) {
            if(ticketInfo_[_ticketID].numbers[i] > maxRange) {
                return false;
            }
        }

        ticketInfo_[_ticketID].claimed = true;
        return true;
    }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS 
    //-------------------------------------------------------------------------


}

