//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LottoNFT is ERC1155, Ownable {
    // Libraries 
    // Counter to create unique token IDs
    using Counters for Counters.Counter;
    Counters.Counter private tokenIDsCount_;

    // State variables 
    address internal lottoContract_;
    // Storage of the lotto numbers for each token
    mapping(uint256 => uint8[]) internal lottoNumbers_;
    // Storage for ticket information
    struct Tickets {
        uint256[] ticketIDs;
        uint8[][] ticketNumbers;
        bool[] claimed;
        uint256 numberOfTickets;
    }
    struct AllUserTickets {
        Tickets[] ticketBatches;
        uint8 totalBuys;
    }
    // User => lottery ID => Tickets 
    mapping(address => mapping(uint256 => AllUserTickets)) internal tickets_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event infoBatchMint(
        address indexed receiving, 
        uint256 amountOfTokens, 
        uint256[] tokenIDs
    );

    function getUserTicketsForLotteryBatchBuy(
        address _user, 
        uint256 _lotteryID,
        uint8 _batchNo
    ) 
        public 
        view 
        returns(Tickets memory) 
    {
        // Storage for the tickets at the batch
        Tickets memory batchTickets = tickets_[_user][_lotteryID].ticketBatches[_batchNo];
        // Returns the ticket Batch
        return batchTickets;
    }

    function getUserBatchAmountForLottery(
        address _user, 
        uint256 _lotteryID
    ) 
        public 
        view 
        returns(uint8) 
    {
        return tickets_[_user][_lotteryID].totalBuys;
    }

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
        address _lotto
    ) 
    ERC1155(
        _uri
    ) 
    {
        // Only Lotto contract will be able to mint new tokens
        lottoContract_ = _lotto;
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------


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
        uint8 _numberOfTickets,
        uint8[][] memory _numbers
    )
        public
        onlyLotto()
        returns(uint256[] memory)
    {
        // Storage for the amount of tokens to mint (always 1)
        uint256[] memory amounts = new uint256[](_numberOfTickets);
        // Storage for the token IDs
        uint256[] memory tokenIDs = new uint256[](_numberOfTickets);
        for (uint256 i = 0; i < _numberOfTickets; i += 1) {
            tokenIDsCount_.increment();
            tokenIDs[i] = tokenIDsCount_.current();
            amounts[i] = 1;
        }
        // Making an array for the claimed status (default to 0/false)
        bool[] memory claimed = new bool[](_numberOfTickets);
        // Making an instance of the ticket information
        Tickets memory newBatch = Tickets(
            tokenIDs,
            _numbers,
            claimed,
            _numberOfTickets
        );
        // Adding the ticket information to the storage mapping
        tickets_[msg.sender][_lottoID].ticketBatches.push(newBatch);
        // Incrementing the batch buy counter
        tickets_[msg.sender][_lottoID].totalBuys += 1;
        // Minting the batch of tokens
        _mintBatch(
            _to,
            tokenIDs,
            amounts,
            msg.data
        );
        // TODO might want to hardcode bytes passed in (msg.data) to be blank
        // Emitting relevant info
        emit infoBatchMint(
            _to, 
            _numberOfTickets, 
            tokenIDs
        ); 

        return tokenIDs;
    }

    function batchMintInternal(
        address _to, 
        uint256[] memory _tokenIDs, 
        uint256[] memory _amounts
    ) 
        public 
    {
        _mintBatch(
            _to,
            _tokenIDs,
            _amounts,
            msg.data
        );
    }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS 
    //-------------------------------------------------------------------------


}

