//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./ILottoNFT.sol";
// TODO remove
import "hardhat/console.sol";

// TODO rename to Lottery when done
contract Lotto is Ownable {
    // Libraries 
    // Counter for lottery IDs
    using Counters for Counters.Counter;
    Counters.Counter private lotteryIDCounter_;
    // Safe math
    using SafeMath for uint256;

    // State variables 
    // Instance of Cake token (collateral currency for lotto)
    IERC20 internal cake_;
    // Storing of the NFT
    ILottoNFT internal nft_;

    // Lottery size
    uint8 public sizeOfLottery_;
    // Max range for numbers (starting at 0)
    uint8 public maxValidRange_;

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
        uint256 prizePoolInCake;    // The amount of cake for prize money
        uint256 costPerTicket;      // Cost per ticket in $cake
        uint8[] prizeDistribution;  // The distribution for prize money
        uint256 startingBlock;      // Block timestamp for star of lotto
        uint256 closingBlock;       // Block timestamp for end of entries
        uint256 endBlock;           // Block timestamp for claiming winnings
        uint8[] winningNumbers;     // The winning numbers
    }
    // Lottery ID's to info
    mapping(uint256 => LottoInfo) internal allLotteries_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event NewLotteryCreated(
        uint256 indexed lottoID,
        Status lotteryStatus,
        uint8[] prizeDistribution,
        uint256 prizePoolInCake,
        uint256 costPerTicket,
        uint256 startingBlock,
        uint256 closingBlock,
        uint256 endBlock,
        address indexed creator
    );

    event NewBatchMint(
        address indexed minter,
        uint256[] ticketIDs,
        uint32[] numbers,
        uint256 totalCost,
        uint256 discount,
        uint256 pricePaid
    );

    //-------------------------------------------------------------------------
    // MODIFIERS
    //-------------------------------------------------------------------------



    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    constructor(
        address _cake, 
        uint8 _sizeOfLotteryNumbers,
        uint8 _maxValidNumberRange    
    ) {
        cake_ = IERC20(_cake);
        sizeOfLottery_ = _sizeOfLotteryNumbers;
        maxValidRange_ = _maxValidNumberRange;
    }

    function init(address _lotteryNFT) public onlyOwner() {
        nft_ = ILottoNFT(_lotteryNFT);
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function costToBuyTickets(
        uint256 _lotteryID,
        uint256 _numberOfTickets
    ) 
        public 
        view 
        returns(uint256 totalCost) 
    {
        uint256 pricePer = allLotteries_[_lotteryID].costPerTicket;
        totalCost = pricePer.mul(_numberOfTickets);
        // TODO use internal bonding curve 
    }

    function getBasicLottoInfo(uint256 _lotteryID) public view returns(
        LottoInfo memory
    )
    {
        return(
            allLotteries_[_lotteryID]
        ); 
    }

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS 
    //-------------------------------------------------------------------------

    //-------------------------------------------------------------------------
    // Restricted Access Functions

    function updateSizeOfLottery(uint8 _newSize) external onlyOwner() {
        require(
            sizeOfLottery_ != _newSize,
            "Cannot set to current size"
        );
        sizeOfLottery_ = _newSize;
    }

    function updateMaxRange(uint8 _newMaxRange) external onlyOwner() {
        require(
            maxValidRange_ != _newMaxRange,
            "Cannot set to current size"
        );
        maxValidRange_ = _newMaxRange;
    }


    function drawWinningNumbers(uint256 _lottoID) external onlyOwner() {
        // Creating space for winning numbers
        uint8[] memory winningNumbers;
        // TODO will call ChainLink VRF
        for (uint8 i = 0; i < sizeOfLottery_; i++) {
            winningNumbers[i] = i;
        }
        allLotteries_[_lottoID].winningNumbers = winningNumbers;
    }

    /**
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
        uint8[] calldata _prizeDistribution,
        uint256 _prizePoolInCake,
        uint256 _costPerTicket,
        uint256 _startingBlock,
        uint256 _closingBlock,
        uint256 _endBlock
    )
        external
        onlyOwner()
        returns(uint256 lottoID)
    {
        uint256 prizeDistributionTotal = 0;
        for (uint256 j = 0; j < _prizeDistribution.length; j += 1) {
            prizeDistributionTotal += uint256(_prizeDistribution[j]);
        }
        // Ensuring that prize distribution total is 100%
        require(
            prizeDistributionTotal == 100,
            "Prize distribution is not 100%"
        );
        require(
            _prizePoolInCake != 0 && _costPerTicket != 0,
            "Prize or cost cannot be 0"
        );
        require(
            _startingBlock != 0 &&
            _startingBlock < _closingBlock &&
            _closingBlock < _endBlock,
            "Timestamps for lottery invalid"
        );
        // Incrementing lottery ID 
        lotteryIDCounter_.increment();
        // Saving data in struct
        allLotteries_[lotteryIDCounter_.current()].lotteryID = lotteryIDCounter_.current();
        allLotteries_[lotteryIDCounter_.current()].lotteryStatus = Status.NotStarted;
        allLotteries_[lotteryIDCounter_.current()].prizePoolInCake = _prizePoolInCake;
        allLotteries_[lotteryIDCounter_.current()].costPerTicket = _costPerTicket;
        allLotteries_[lotteryIDCounter_.current()].prizeDistribution = _prizeDistribution;
        allLotteries_[lotteryIDCounter_.current()].startingBlock = _startingBlock;
        allLotteries_[lotteryIDCounter_.current()].closingBlock = _closingBlock;
        allLotteries_[lotteryIDCounter_.current()].endBlock = _endBlock;
        // Emitting important information around new lottery.
        emit NewLotteryCreated(
            lotteryIDCounter_.current(),
            Status.NotStarted,
            _prizeDistribution,
            _prizePoolInCake,
            _costPerTicket,
            _startingBlock,
            _closingBlock,
            _endBlock,
            msg.sender
        );
    }

    function batchBuyLottoTicket(
        uint256 _lotteryID,
        uint32 _numberOfTickets,
        uint32[] memory _chosenNumbersForEachTicket
    )
        external
        returns(uint256[] memory ticketIds)
    {
        require(
            block.timestamp >= allLotteries_[_lotteryID].startingBlock &&
            block.timestamp < allLotteries_[_lotteryID].closingBlock,
            "Invalid time for mint"
        );
        uint256 numberCheck = _numberOfTickets*sizeOfLottery_;
        require(
            _chosenNumbersForEachTicket.length == numberCheck,
            "Invalid chosen numbers"
        );
        // Gets the cost per ticket
        uint256 costPerTicket = allLotteries_[_lotteryID].costPerTicket;
        // TODO make this a function including the discount 
        // Gets the total cost for the buy
        uint256 totalCost = costPerTicket*_numberOfTickets;
        // Transfers the required cake to this contract
        require(
            cake_.transferFrom(
                msg.sender, 
                address(this), 
                totalCost
            ),
            "Transfer of cake failed"
        );
        // Batch mints the user their tickets
        ticketIds = nft_.batchMint(
            msg.sender,
            _lotteryID,
            _numberOfTickets,
            _chosenNumbersForEachTicket
        );
        emit NewBatchMint(
            msg.sender,
            ticketIds,
            _chosenNumbersForEachTicket,
            totalCost,
            0, // TODO
            totalCost
        );
    }


    function claimReward(uint256 _lottoID, uint256 _tokenID) external {
        // TODO
        

    }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS 
    //-------------------------------------------------------------------------

    function discount(uint256 _lottoID, uint32 _numberOfTokens) internal returns(uint256 cost, uint256 discount) {
        cost = allLotteries_[_lottoID].costPerTicket*_numberOfTokens;
        discount = (_numberOfTokens*2)/1000;
    }
}
