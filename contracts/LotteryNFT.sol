//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ILottery.sol";
import "./Testable.sol";
// Safe math 
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SafeMath16.sol";
import "./SafeMath8.sol";

contract LotteryNFT is ERC1155, Ownable, Testable {
    // Libraries 
    // Safe math
    using SafeMath for uint256;
    using SafeMath16 for uint16;
    using SafeMath8 for uint8;

    // State variables 
    address internal lotteryContract_;

    uint256 internal totalSupply_;
    // Storage for ticket information
    struct TicketInfo {
        address owner;
        uint16[] numbers;
        bool claimed;
        uint256 lotteryId;
    }
    // Token ID => Token information 
    mapping(uint256 => TicketInfo) internal ticketInfo_;
    // User address => Lottery ID => Ticket IDs
    mapping(address => mapping(uint256 => uint256[])) internal userTickets_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event InfoBatchMint(
        address indexed receiving, 
        uint256 lotteryId,
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
            msg.sender == lotteryContract_,
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
        lotteryContract_ = _lotto;
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function getTotalSupply() external view returns(uint256) {
        return totalSupply_;
    }

    /**
     * @param   _ticketID: The unique ID of the ticket
     * @return  uint32[]: The chosen numbers for that ticket
     */
    function getTicketNumbers(
        uint256 _ticketID
    ) 
        external 
        view 
        returns(uint16[] memory) 
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
        external 
        view 
        returns(address) 
    {
        return ticketInfo_[_ticketID].owner;
    }

    function getTicketClaimStatus(
        uint256 _ticketID
    ) 
        external 
        view
        returns(bool) 
    {
        return ticketInfo_[_ticketID].claimed;
    }

    function getUserTickets(
        uint256 _lotteryId,
        address _user
    ) 
        external 
        view 
        returns(uint256[] memory) 
    {
        return userTickets_[_user][_lotteryId];
    }

    function getUserTicketsPagination(
        address _user, 
        uint256 _lotteryId,
        uint256 cursor, 
        uint256 size
    ) 
        external 
        view 
        returns (uint256[] memory, uint256) 
    {
        uint256 length = size;
        if (length > userTickets_[_user][_lotteryId].length - cursor) {
            length = userTickets_[_user][_lotteryId].length - cursor;
        }
        uint256[] memory values = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            values[i] = userTickets_[_user][_lotteryId][cursor + i];
        }
        return (values, cursor + length);
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
        uint256 _lotteryId,
        uint8 _numberOfTickets,
        uint16[] calldata _numbers,
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
        for (uint8 i = 0; i < _numberOfTickets; i++) {
            // Incrementing the tokenId counter
            totalSupply_ = totalSupply_.add(1);
            tokenIds[i] = totalSupply_;
            amounts[i] = 1;
            // Getting the start and end position of numbers for this ticket
            uint16 start = uint16(i.mul(sizeOfLottery));
            uint16 end = uint16((i.add(1)).mul(sizeOfLottery));
            // Splitting out the chosen numbers
            uint16[] calldata numbers = _numbers[start:end];
            // Storing the ticket information 
            ticketInfo_[totalSupply_] = TicketInfo(
                _to,
                numbers,
                false,
                _lotteryId
            );
            userTickets_[_to][_lotteryId].push(totalSupply_);
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
            _lotteryId,
            _numberOfTickets, 
            tokenIds
        ); 
        // Returns the token IDs of minted tokens
        return tokenIds;
    }

    function claimTicket(uint256 _ticketID, uint256 _lotteryId) external onlyLotto() returns(bool) {
        require(
            ticketInfo_[_ticketID].claimed == false,
            "Ticket already claimed"
        );
        require(
            ticketInfo_[_ticketID].lotteryId == _lotteryId,
            "Ticket not for this lottery"
        );
        uint256 maxRange = ILottery(lotteryContract_).getMaxRange();
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

