//SPDX-License-Identifier: MIT
pragma solidity >0.6.0;
pragma experimental ABIEncoderV2;
// Imported OZ helper contracts
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
// Inherited allowing for ownership of contract
import "@openzeppelin/contracts/access/Ownable.sol";
// Allows for intergration with ChainLink VRF
import "./IRandomNumberGenerator.sol";
// Interface for Lottery NFT to mint tokens
import "./ILotteryNFT.sol";
// Allows for time manipulation. Set to 0x address on test/mainnet deploy
import "./Testable.sol";
// Safe math 
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SafeMath16.sol";
import "./SafeMath8.sol";

// TODO rename to Lottery when done
contract Lottery is Ownable, Initializable, Testable {
    // Libraries 
    // Safe math
    using SafeMath for uint256;
    using SafeMath16 for uint16;
    using SafeMath8 for uint8;
    // Safe ERC20
    using SafeERC20 for IERC20;
    // Address functionality 
    using Address for address;

    // State variables 
    // Instance of Cake token (collateral currency for lotto)
    IERC20 internal cake_;
    // Storing of the NFT
    ILotteryNFT internal nft_;
    // Storing of the randomness generator 
    IRandomNumberGenerator internal randomGenerator_;
    // Request ID for random number
    bytes32 internal requestId_;
    // Counter for lottery IDs 
    uint256 private lotteryIdCounter_;

    // Lottery size
    uint8 public sizeOfLottery_;
    // Max range for numbers (starting at 0)
    uint16 public maxValidRange_;
    // Buckets for discounts (i.e bucketOneMax_ = 20, less than 20 tickets gets
    // discount)
    uint8 public bucketOneMax_;
    uint8 public bucketTwoMax_;
    // Bucket discount amounts scaled by 100 (i.e 20% = 20)
    uint8 public discountForBucketOne_;
    uint8 public discountForBucketTwo_;
    uint8 public discountForBucketThree_;

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
        uint256 startingTimestamp;      // Block timestamp for star of lotto
        uint256 closingTimestamp;       // Block timestamp for end of entries
        uint16[] winningNumbers;     // The winning numbers
    }
    // Lottery ID's to info
    mapping(uint256 => LottoInfo) internal allLotteries_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event NewBatchMint(
        address indexed minter,
        uint256[] ticketIDs,
        uint16[] numbers,
        uint256 totalCost,
        uint256 discount,
        uint256 pricePaid
    );

    event RequestNumbers(uint256 lotteryId, bytes32 requestId);

    event UpdatedSizeOfLottery(
        address admin, 
        uint8 newLotterySize
    );

    event UpdatedMaxRange(
        address admin, 
        uint16 newMaxRange
    );

    event UpdatedBuckets(
        address admin, 
        uint8 bucketOneMax,
        uint8 bucketTwoMax,
        uint8 discountForBucketOne,
        uint8 discountForBucketTwo,
        uint8 discountForBucketThree
    );

    event LotteryOpen(uint256 lotteryId, uint256 ticketSupply);

    event LotteryClose(uint256 lotteryId, uint256 ticketSupply);

    //-------------------------------------------------------------------------
    // MODIFIERS
    //-------------------------------------------------------------------------

    modifier onlyRandomGenerator() {
        require(
            msg.sender == address(randomGenerator_),
            "Only random generator"
        );
        _;
    }

     modifier notContract() {
        require(!address(msg.sender).isContract(), "contract not allowed");
        require(msg.sender == tx.origin, "proxy contract not allowed");
       _;
    }

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    constructor(
        address _cake, 
        address _timer,
        uint8 _sizeOfLotteryNumbers,
        uint16 _maxValidNumberRange,
        uint8 _bucketOneMaxNumber,
        uint8 _bucketTwoMaxNumber,
        uint8 _discountForBucketOne,
        uint8 _discountForBucketTwo,
        uint8 _discountForBucketThree
    ) 
        Testable(_timer)
        public
    {
        require(
            _bucketOneMaxNumber != 0 &&
            _bucketTwoMaxNumber != 0,
            "Bucket range cannot be 0"
        );
        require(
            _bucketOneMaxNumber < _bucketTwoMaxNumber,
            "Bucket one must be smaller"
        );
        require(
            _discountForBucketOne < _discountForBucketTwo &&
            _discountForBucketTwo < _discountForBucketThree,
            "Discounts must increase"
        );
        require(
            _cake != address(0),
            "Contracts cannot be 0 address"
        );
        require(
            _sizeOfLotteryNumbers != 0 &&
            _maxValidNumberRange != 0,
            "Lottery setup cannot be 0"
        );
        cake_ = IERC20(_cake);
        sizeOfLottery_ = _sizeOfLotteryNumbers;
        maxValidRange_ = _maxValidNumberRange;
        
        bucketOneMax_ = _bucketOneMaxNumber;
        bucketTwoMax_ = _bucketTwoMaxNumber;
        discountForBucketOne_ = _discountForBucketOne;
        discountForBucketTwo_ = _discountForBucketTwo;
        discountForBucketThree_ = _discountForBucketThree;
    }

    function initialize(
        address _lotteryNFT,
        address _IRandomNumberGenerator
    ) 
        external 
        initializer
        onlyOwner() 
    {
        require(
            _lotteryNFT != address(0) &&
            _IRandomNumberGenerator != address(0),
            "Contracts cannot be 0 address"
        );
        nft_ = ILotteryNFT(_lotteryNFT);
        randomGenerator_ = IRandomNumberGenerator(_IRandomNumberGenerator);
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function costToBuyTickets(
        uint256 _lotteryId,
        uint256 _numberOfTickets
    ) 
        external 
        view 
        returns(uint256 totalCost) 
    {
        uint256 pricePer = allLotteries_[_lotteryId].costPerTicket;
        totalCost = pricePer.mul(_numberOfTickets);
    }

    function costToBuyTicketsWithDiscount(
        uint256 _lotteryId,
        uint256 _numberOfTickets
    ) 
        external 
        view 
        returns(
            uint256 cost, 
            uint256 discount, 
            uint256 costWithDiscount
        ) 
    {
        discount = _discount(_lotteryId, _numberOfTickets);
        cost = this.costToBuyTickets(_lotteryId, _numberOfTickets);
        costWithDiscount = cost.sub(discount);
    }

    function getBasicLottoInfo(uint256 _lotteryId) external view returns(
        LottoInfo memory
    )
    {
        return(
            allLotteries_[_lotteryId]
        ); 
    }

    function getMaxRange() external view returns(uint16) {
        return maxValidRange_;
    }

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS 
    //-------------------------------------------------------------------------

    //-------------------------------------------------------------------------
    // Restricted Access Functions (onlyOwner)

    function updateSizeOfLottery(uint8 _newSize) external onlyOwner() {
        require(
            sizeOfLottery_ != _newSize,
            "Cannot set to current size"
        );
        require(
            sizeOfLottery_ != 0,
            "Lottery size cannot be 0"
        );
        sizeOfLottery_ = _newSize;

        emit UpdatedSizeOfLottery(
            msg.sender, 
            _newSize
        );
    }

    function updateMaxRange(uint16 _newMaxRange) external onlyOwner() {
        require(
            maxValidRange_ != _newMaxRange,
            "Cannot set to current size"
        );
        require(
            maxValidRange_ != 0,
            "Max range cannot be 0"
        );
        maxValidRange_ = _newMaxRange;

        emit UpdatedMaxRange(
            msg.sender, 
            _newMaxRange
        );
    }

    function updateBuckets(
        uint8 _bucketOneMax,
        uint8 _bucketTwoMax,
        uint8 _discountForBucketOne,
        uint8 _discountForBucketTwo,
        uint8 _discountForBucketThree
    )
        external
        onlyOwner() 
    {
        require(
            _bucketOneMax != 0 &&
            _bucketTwoMax != 0,
            "Bucket range cannot be 0"
        );
        require(
            _bucketOneMax < _bucketTwoMax,
            "Bucket one must be smaller"
        );
        require(
            _discountForBucketOne < _discountForBucketTwo &&
            _discountForBucketTwo < _discountForBucketThree,
            "Discounts must increase"
        );
        bucketOneMax_ = _bucketOneMax;
        bucketTwoMax_ = _bucketTwoMax;
        discountForBucketOne_ = _discountForBucketOne;
        discountForBucketTwo_ = _discountForBucketTwo;
        discountForBucketThree_ = _discountForBucketThree;

        emit UpdatedBuckets(
            msg.sender,
            _bucketOneMax,
            _bucketTwoMax,
            _discountForBucketOne,
            _discountForBucketTwo,
            _discountForBucketThree
        );
    }

    function drawWinningNumbers(
        uint256 _lotteryId, 
        uint256 _seed
    ) 
        external 
        onlyOwner() 
    {
        // Checks that the lottery is past the closing block
        require(
            allLotteries_[_lotteryId].closingTimestamp <= getCurrentTime(),
            "Cannot set winning numbers during lottery"
        );
        // Checks lottery numbers have not already been drawn
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Open,
            "Lottery State incorrect for draw"
        );
        // Sets lottery status to closed
        allLotteries_[_lotteryId].lotteryStatus = Status.Closed;
        // Requests a random number from the generator
        requestId_ = randomGenerator_.getRandomNumber(_lotteryId, _seed);
        // Emits that random number has been requested
        emit RequestNumbers(_lotteryId, requestId_);
    }

    function numbersDrawn(
        uint256 _lotteryId,
        bytes32 _requestId, 
        uint256 _randomNumber
    ) 
        external
        onlyRandomGenerator()
    {
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Closed,
            "Draw numbers first"
        );
        if(requestId_ == _requestId) {
            allLotteries_[_lotteryId].lotteryStatus = Status.Completed;
            allLotteries_[_lotteryId].winningNumbers = _split(_randomNumber);
        }

        emit LotteryClose(_lotteryId, nft_.getTotalSupply());
    }

    /**
     * @param   _prizeDistribution An array defining the distribution of the 
     *          prize pool. I.e if a lotto has 5 numbers, the distribution could
     *          be [5, 10, 15, 20, 30] = 100%. This means if you get one number
     *          right you get 5% of the pool, 2 matching would be 10% and so on.
     * @param   _prizePoolInCake The amount of Cake available to win in this 
     *          lottery.
     * @param   _startingTimestamp The block timestamp for the beginning of the 
     *          lottery. 
     * @param   _closingTimestamp The block timestamp after which no more tickets
     *          will be sold for the lottery. Note that this timestamp MUST
     *          be after the starting block timestamp. 
     */
    function createNewLotto(
        uint8[] calldata _prizeDistribution,
        uint256 _prizePoolInCake,
        uint256 _costPerTicket,
        uint256 _startingTimestamp,
        uint256 _closingTimestamp
    )
        external
        onlyOwner()
        returns(uint256 lotteryId)
    {
        require(
            _prizeDistribution.length == sizeOfLottery_,
            "Invalid distribution"
        );
        uint256 prizeDistributionTotal = 0;
        for (uint256 j = 0; j < _prizeDistribution.length; j++) {
            prizeDistributionTotal = prizeDistributionTotal.add(
                uint256(_prizeDistribution[j])
            );
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
            _startingTimestamp != 0 &&
            _startingTimestamp < _closingTimestamp,
            "Timestamps for lottery invalid"
        );
        // Incrementing lottery ID 
        lotteryIdCounter_ = lotteryIdCounter_.add(1);
        lotteryId = lotteryIdCounter_;
        uint16[] memory winningNumbers = new uint16[](sizeOfLottery_);
        Status lotteryStatus;
        if(_startingTimestamp >= getCurrentTime()) {
            lotteryStatus = Status.Open;
        } else {
            lotteryStatus = Status.NotStarted;
        }
        // Saving data in struct
        LottoInfo memory newLottery = LottoInfo(
            lotteryId,
            lotteryStatus,
            _prizePoolInCake,
            _costPerTicket,
            _prizeDistribution,
            _startingTimestamp,
            _closingTimestamp,
            winningNumbers
        );
        allLotteries_[lotteryId] = newLottery;

        // Emitting important information around new lottery.
        emit LotteryOpen(
            lotteryId, 
            nft_.getTotalSupply()
        );
    }

    function withdrawCake(uint256 _amount) external onlyOwner() {
        cake_.transfer(
            msg.sender, 
            _amount
        );
    }

    //-------------------------------------------------------------------------
    // General Access Functions

    function batchBuyLottoTicket(
        uint256 _lotteryId,
        uint8 _numberOfTickets,
        uint16[] calldata _chosenNumbersForEachTicket
    )
        external
        notContract()
    {
        // Ensuring the lottery is within a valid time
        require(
            getCurrentTime() >= allLotteries_[_lotteryId].startingTimestamp,
            "Invalid time for mint:start"
        );
        require(
            getCurrentTime() < allLotteries_[_lotteryId].closingTimestamp,
            "Invalid time for mint:end"
        );
        if(allLotteries_[_lotteryId].lotteryStatus == Status.NotStarted) {
            if(allLotteries_[_lotteryId].startingTimestamp >= getCurrentTime()) {
                allLotteries_[_lotteryId].lotteryStatus = Status.Open;
            }
        }
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Open,
            "Lottery not in state for mint"
        );
        require(
            _numberOfTickets <= 50,
            "Batch mint too large"
        );
        // Temporary storage for the check of the chosen numbers array
        uint256 numberCheck = _numberOfTickets.mul(sizeOfLottery_);
        // Ensuring that there are the right amount of chosen numbers
        require(
            _chosenNumbersForEachTicket.length == numberCheck,
            "Invalid chosen numbers"
        );
        // Getting the cost and discount for the token purchase
        (
            uint256 totalCost, 
            uint256 discount, 
            uint256 costWithDiscount
        ) = this.costToBuyTicketsWithDiscount(_lotteryId, _numberOfTickets);
        // Transfers the required cake to this contract
        cake_.transferFrom(
            msg.sender, 
            address(this), 
            costWithDiscount
        );
        // Batch mints the user their tickets
        uint256[] memory ticketIds = nft_.batchMint(
            msg.sender,
            _lotteryId,
            _numberOfTickets,
            _chosenNumbersForEachTicket,
            sizeOfLottery_
        );
        // Emitting event with all information
        emit NewBatchMint(
            msg.sender,
            ticketIds,
            _chosenNumbersForEachTicket,
            totalCost,
            discount,
            costWithDiscount
        );
    }


    function claimReward(uint256 _lotteryId, uint256 _tokenId) external notContract() {
        // Checking the lottery is in a valid time for claiming
        require(
            allLotteries_[_lotteryId].closingTimestamp <= getCurrentTime(),
            "Wait till end to claim"
        );
        // Checks the lottery winning numbers are available 
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Completed,
            "Winning Numbers not chosen yet"
        );
        require(
            nft_.getOwnerOfTicket(_tokenId) == msg.sender,
            "Only the owner can claim"
        );
        // Sets the claim of the ticket to true (if claimed, will revert)
        require(
            nft_.claimTicket(_tokenId, _lotteryId),
            "Numbers for ticket invalid"
        );
        // Getting the number of matching tickets
        uint8 matchingNumbers = _getNumberOfMatching(
            nft_.getTicketNumbers(_tokenId),
            allLotteries_[_lotteryId].winningNumbers
        );
        // Getting the prize amount for those matching tickets
        uint256 prizeAmount = _prizeForMatching(
            matchingNumbers,
            _lotteryId
        );
        // Removing the prize amount from the pool
        allLotteries_[_lotteryId].prizePoolInCake = allLotteries_[_lotteryId].prizePoolInCake.sub(prizeAmount);
        // Transfering the user their winnings
        cake_.safeTransfer(address(msg.sender), prizeAmount);
    }

    function batchClaimRewards(
        uint256 _lotteryId, 
        uint256[] calldata _tokeIds
    ) 
        external 
        notContract()
    {
        require(
            _tokeIds.length <= 50,
            "Batch claim too large"
        );
        // Checking the lottery is in a valid time for claiming
        require(
            allLotteries_[_lotteryId].closingTimestamp <= getCurrentTime(),
            "Wait till end to claim"
        );
        // Checks the lottery winning numbers are available 
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Completed,
            "Winning Numbers not chosen yet"
        );
        // Creates a storage for all winnings
        uint256 totalPrize = 0;
        // Loops through each submitted token
        for (uint256 i = 0; i < _tokeIds.length; i++) {
            // Checks user is owner (will revert entire call if not)
            require(
                nft_.getOwnerOfTicket(_tokeIds[i]) == msg.sender,
                "Only the owner can claim"
            );
            // If token has already been claimed, skip token
            if(
                nft_.getTicketClaimStatus(_tokeIds[i])
            ) {
                continue;
            }
            // Claims the ticket (will only revert if numbers invalid)
            require(
                nft_.claimTicket(_tokeIds[i], _lotteryId),
                "Numbers for ticket invalid"
            );
            // Getting the number of matching tickets
            uint8 matchingNumbers = _getNumberOfMatching(
                nft_.getTicketNumbers(_tokeIds[i]),
                allLotteries_[_lotteryId].winningNumbers
            );
            // Getting the prize amount for those matching tickets
            uint256 prizeAmount = _prizeForMatching(
                matchingNumbers,
                _lotteryId
            );
            // Removing the prize amount from the pool
            allLotteries_[_lotteryId].prizePoolInCake = allLotteries_[_lotteryId].prizePoolInCake.sub(prizeAmount);
            totalPrize = totalPrize.add(prizeAmount);
        }
        // Transferring the user their winnings
        cake_.safeTransfer(address(msg.sender), totalPrize);
    }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS 
    //-------------------------------------------------------------------------

    function _discount(
        uint256 lotteryId, 
        uint256 _numberOfTickets
    )
        internal 
        view
        returns(uint256 discountAmount)
    {
        // Gets the raw cost for the tickets
        uint256 cost = this.costToBuyTickets(lotteryId, _numberOfTickets);
        // Checks if the amount of tickets falls into the first bucket
        if(_numberOfTickets < bucketOneMax_) {
            discountAmount = cost.mul(discountForBucketOne_).div(100);
        } else if(
            _numberOfTickets < bucketTwoMax_
        ) {
            // Checks if the amount of tickets falls into the seccond bucket
            discountAmount = cost.mul(discountForBucketTwo_).div(100);
        } else {
            // Checks if the amount of tickets falls into the last bucket
            discountAmount = cost.mul(discountForBucketThree_).div(100);
        }
    }

    function _getNumberOfMatching(
        uint16[] memory _usersNumbers, 
        uint16[] memory _winningNumbers
    )
        internal
        pure
        returns(uint8 noOfMatching)
    {
        // Loops through all wimming numbers
        for (uint256 i = 0; i < _winningNumbers.length; i++) {
            // If the winning numbers and user numbers match
            if(_usersNumbers[i] == _winningNumbers[i]) {
                // The number of matching numbers incrases
                noOfMatching += 1;
            }
        }
    }

    /**
     * @param   _noOfMatching: The number of matching numbers the user has
     * @param   _lotteryId: The ID of the lottery the user is claiming on
     * @return  uint256: The prize amount in cake the user is entitled to 
     */
    function _prizeForMatching(
        uint8 _noOfMatching,
        uint256 _lotteryId
    ) 
        internal  
        view
        returns(uint256) 
    {
        uint256 prize = 0;
        // If user has no matching numbers their prize is 0
        if(_noOfMatching == 0) {
            return 0;
        } 
        // Getting the percentage of the pool the user has won
        uint256 perOfPool = allLotteries_[_lotteryId].prizeDistribution[_noOfMatching-1];
        // Timesing the percentage one by the pool
        prize = allLotteries_[_lotteryId].prizePoolInCake.mul(perOfPool);
        // Returning the prize divided by 100 (as the prize distribution is scaled)
        return prize.div(100);
    }

    function _split(
        uint256 _randomNumber
    ) 
        internal
        view 
        returns(uint16[] memory) 
    {
        // Temparary storage for winning numbers
        uint16[] memory winningNumbers = new uint16[](sizeOfLottery_);
        // Loops the size of the number of tickets in the lottery
        for(uint i = 0; i < sizeOfLottery_; i++){
            // Encodes the random number with its position in loop
            bytes32 hashOfRandom = keccak256(abi.encodePacked(_randomNumber, i));
            // Casts random number hash into uint256
            uint256 numberRepresentation = uint256(hashOfRandom);
            // Sets the winning number position to a uint16 of random hash number
            winningNumbers[i] = uint16(numberRepresentation.mod(maxValidRange_));
        }
    return winningNumbers;
    }
}
