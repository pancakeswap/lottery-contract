//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./ILottoNFT.sol";

// TODO rename to Lottery when done
contract Lotto is Ownable {
    // Libraries 
    // Counter for lottery IDs
    using Counters for Counters.Counter;
    Counters.Counter private lotteryIDCounter_;
    // Safe math
    using SafeMath for uint256;

    uint8 internal constant MAX_BATCH_MINT = 120;

    // State variables 
    // Instance of Cake token (collateral currency for lotto)
    IERC20 internal cake_;
    // Storing of the NFT
    ILottoNFT internal nft_;

    // Lottery size
    uint8 internal sizeOfLottery_;
    // Max range for numbers (starting at 0)
    uint8 internal maxValidRange_;

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
    // All the needed info around a lottery ticket
    struct TicketBatchInfo {
        uint256[] ticketIds;
        uint8 numberOfTickets;
        uint8[MAX_BATCH_MINT][] numbers;
        bool[] claimed;
    }
    struct AllTickets {
        uint8 totalBuys;
        TicketBatchInfo[] batchBuys;
    }
    // The user => lottery ID => Tickets bought
    mapping(address => mapping(uint256 => AllTickets)) internal allUserTicketPurchases_;

    // mapping(address => Tickets[]) internal tickets_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event newLotteryCreated(
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

    event newBatchMint(
        address indexed minter,
        uint256[] ticketIDs,
        uint256[][] numbers
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

    /**
      * @return Gets the current time
      */
    function getTime() public view returns(uint256) {
        return block.timestamp;
    }

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

    function updateSizeOfLottery(uint8 _newSize) public onlyOwner() {
        require(
            sizeOfLottery_ != _newSize,
            "Cannot set to current size"
        );
        sizeOfLottery_ = _newSize;
    }

    function updateMaxRange(uint8 _newMaxRange) public onlyOwner() {
        require(
            maxValidRange_ != _newMaxRange,
            "Cannot set to current size"
        );
        maxValidRange_ = _newMaxRange;
    }


    function drawWinningNumbers(uint256 _lottoID) public onlyOwner() {
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
        public
        onlyOwner()
        returns(uint256 lottoID)
    {
        lotteryIDCounter_.increment();

        allLotteries_[lotteryIDCounter_.current()].lotteryID = lotteryIDCounter_.current();
        allLotteries_[lotteryIDCounter_.current()].lotteryStatus = Status.NotStarted;
        allLotteries_[lotteryIDCounter_.current()].prizePoolInCake = _prizePoolInCake;
        allLotteries_[lotteryIDCounter_.current()].costPerTicket = _costPerTicket;
        allLotteries_[lotteryIDCounter_.current()].prizeDistribution = _prizeDistribution;
        allLotteries_[lotteryIDCounter_.current()].startingBlock = _startingBlock;
        allLotteries_[lotteryIDCounter_.current()].closingBlock = _closingBlock;
        allLotteries_[lotteryIDCounter_.current()].endBlock = _endBlock;
        // Emitting important information around new lottery.
        emit newLotteryCreated(
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
        uint8 _numberOfTickets,
        uint8[][] memory _chosenNumbersForEachTicket
    )
        public
        returns(uint256[] memory ticketIds)
    {
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
        // emit TODO
    }


    function claimReward(uint256 _lottoID, uint256 _tokenID) external {
        // TODO
        AllTickets memory checkingTickets = allUserTicketPurchases_[msg.sender][_lottoID];
        bool isTicketFound = false;
        while(isTicketFound) {
            
        }

    }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS 
    //-------------------------------------------------------------------------

}
