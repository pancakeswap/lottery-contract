//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// TODO rename to Lottery when done
contract Lotto is Ownable {
    // Libraries 
    // Counter for lottery IDs
    using Counters for Counters.Counter;
    Counters.Counter private lotteryIDCounter_;

    // State variables 
    // Represents the status of the lottery
    enum Status { 
        NotStarted,     // The lottery has not started yet
        Open,           // The lottery is open for ticket purchases 
        Closed,         // The lottery is no longer open for ticket purchases
        Completed       // The lottery has been closed and the numbers drawn
    }
    // All the needed info around a lottery
    struct LottoInfo {
        uint256 lotteryID;          // ID for lotto
        Status lotteryStatus;       // Status for lotto
        uint8 numberOfNumbers;      // The number of numbers in this lotto
        uint256 prizePoolInCake;    // The amount of cake for prize money
        uint8[] prizeDistribution; // The distribution for prize money
        uint256 startingBlock;      // Block timestamp for star of lotto
        uint256 closingBlock;       // Block timestamp for end of entries
        uint256 endBlock;           // Block timestamp for claiming winnings
        uint8[] winningNumbers;     // The winning numbers
        uint256[] tickets;          // Tickets bought for this lotto
    }
    // Lottery ID's to info
    mapping(uint256 => LottoInfo) internal allLotteries_;
    // All the needed info around a lottery ticket
    struct TicketInfo {
        uint256 lotteryID;
        uint256 ticketID;
        bool claimed;
        address owner;
    }
    // Ticket ID's to their information
    mapping(uint256 => TicketInfo) internal allTickets_;

    // mapping(address => Tickets[]) internal tickets_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event newLotteryCreated(
        uint256 indexed lottoID,
        Status lotteryStatus,
        uint8 numberOfNumbers,
        uint8[] prizeDistribution,
        uint256 prizePoolInCake,
        uint256 startingBlock,
        uint256 closingBlock,
        uint256 endBlock,
        address indexed creator
    );

    //-------------------------------------------------------------------------
    // MODIFIERS
    //-------------------------------------------------------------------------



    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    constructor() {

    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    /**
      * @return Gets the current time
      */
    function getTime() public view returns(uint256) {
        return block.timestamp;
    }

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS 
    //-------------------------------------------------------------------------

    /**
     * @param   _numberOfWinningNumbers The number of numbers that this lotto 
     *          will have. I.e 10 numbers.
     * @param   _prizeDistribution An array defining the distribution of the 
     *          prize pool. I.e if a lotto has 5 numbers, the distribution could
     *          be [5, 10, 15, 20, 30] = 100%. This means if you get one number
     *          right you get 5% of the pool, 2 matching would be 10% and so on.
     * @param   _prizePoolInCake The amount of Cake available to win in this 
     *          lottery.
     * @param   _startingBlock The block timestamp for the beginning of the 
     *          lottery. 
     * @param   _closingBlock The block timestamp after which no more tickets
     *          will be sold for the lottery. Note that this timestamp MUST
     *          be after the starting block timestamp. 
     * @param   _endBlock The block timestamp for the end of the lottery. After
     *          this time users can withdraw any winnings. Note that between
     *          the closing block and this end block the winning numbers must
     *          be added by the admin. If they are not this end block timestamp
     *          will be pushed back until winning numbers are added. 
     */
    function createNewLotto(
        uint8 _numberOfWinningNumbers,
        uint8[] calldata _prizeDistribution,
        uint256 _prizePoolInCake,
        uint256 _startingBlock,
        uint256 _closingBlock,
        uint256 _endBlock
    )
        public
        onlyOwner()
        returns(uint256 lottoID)
    {
        lotteryIDCounter_.increment();

        allLotteries_[lotteryIDCounter_.current()].lotteryID = lotteryIDCounter_.current();
        allLotteries_[lotteryIDCounter_.current()].lotteryStatus = Status.NotStarted;
        allLotteries_[lotteryIDCounter_.current()].numberOfNumbers = _numberOfWinningNumbers;
        allLotteries_[lotteryIDCounter_.current()].prizePoolInCake = _prizePoolInCake;
        allLotteries_[lotteryIDCounter_.current()].prizeDistribution = _prizeDistribution;
        allLotteries_[lotteryIDCounter_.current()].startingBlock = _startingBlock;
        allLotteries_[lotteryIDCounter_.current()].closingBlock = _closingBlock;
        allLotteries_[lotteryIDCounter_.current()].endBlock = _endBlock;
        // Emitting important information around new lottery.
        emit newLotteryCreated(
            lotteryIDCounter_.current(),
            Status.NotStarted,
            _numberOfWinningNumbers,
            _prizeDistribution,
            _prizePoolInCake,
            _startingBlock,
            _closingBlock,
            _endBlock,
            msg.sender
        );
    }


    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS 
    //-------------------------------------------------------------------------

}