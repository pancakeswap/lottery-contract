const { expect, assert } = require("chai");
const { network } = require("hardhat");
const { 
    lotto,
    lottoNFT,
    BigNumber,
    generateLottoNumbers
} = require("./settings.js");

describe("Lottery contract", function() {
    // Creating the instance and contract info for the lottery contract
    let lotteryInstance, lotteryContract;
    // Creating the instance and contract info for the lottery NFT contract
    let lotteryNftInstance, lotteryNftContract;
    // Creating the instance and contract info for the cake token contract
    let cakeInstance, cakeContract;
    // Creating the instance and contract info for the timer contract
    let timerInstance, timerContract;
    // Creating the users
    let owner, buyer;

    beforeEach(async () => {
        // Getting the signers provided by ethers
        const signers = await ethers.getSigners();
        // Creating the active wallets for use
        owner = signers[0];
        buyer = signers[1];
        // Getting the lottery code (abi, bytecode, name)
        lotteryContract = await ethers.getContractFactory("Lotto");
        // Getting the lotteryNFT code (abi, bytecode, name)
        lotteryNftContract = await ethers.getContractFactory("LottoNFT");
        // Getting the lotteryNFT code (abi, bytecode, name)
        cakeContract = await ethers.getContractFactory("Mock_erc20");
        // Getting the timer code (abi, bytecode, name)
        timerContract = await ethers.getContractFactory("Timer");
        // Deploying the instances
        timerInstance = await timerContract.deploy();
        cakeInstance = await cakeContract.deploy(
            lotto.buy.cake,
        );
        lotteryInstance = await lotteryContract.deploy(
            cakeInstance.address,
            timerInstance.address,
            lotto.setup.sizeOfLottery,
            lotto.setup.maxValidRange
        );
        lotteryNftInstance = await lotteryNftContract.deploy(
            lottoNFT.newLottoNft.uri,
            lotteryInstance.address,
            timerInstance.address
        );
        await lotteryInstance.init(
            lotteryNftInstance.address
        );
        // Making sure the lottery has some cake
        await cakeInstance.mint(
            lotteryInstance.address,
            lotto.newLotto.prize
        );
    });

    describe("Creating a new lottery tests", function() {
        /**
         * Tests that in the nominal case nothing goes wrong
         */
        it("Nominal case", async function() {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new lottery
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                    timeStamp.plus(lotto.newLotto.endIncrease).toString()
                )
            ).to.emit(lotteryInstance, lotto.events.new)
            // Checking that emitted event contains correct information
            .withArgs(
                1,
                0,
                lotto.newLotto.distribution,
                lotto.newLotto.prize,
                lotto.newLotto.cost,
                timeStamp.toString(),
                timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                timeStamp.plus(lotto.newLotto.endIncrease).toString(),
                owner.address
            );
        });
        /**
         * Testing that non-admins cannot create a lotto
         */
        it("Invalid admin", async function() {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(buyer).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                    timeStamp.plus(lotto.newLotto.endIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_admin);
        });
        /**
         * Testing that an invalid distribution will fail
         */
        it("Invalid price distribution length", async function() {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.errorData.distribution_length,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                    timeStamp.plus(lotto.newLotto.endIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_distribution_length);
        });
        /**
         * Testing that an invalid distribution will fail
         */
        it("Invalid price distribution total", async function() {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.errorData.distribution_total,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                    timeStamp.plus(lotto.newLotto.endIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_distribution_total);
        });
        /**
         * Testing that an invalid prize and cost will fail
         */
        it("Invalid price distribution", async function() {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.errorData.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                    timeStamp.plus(lotto.newLotto.endIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_price_or_cost);
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.errorData.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                    timeStamp.plus(lotto.newLotto.endIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_price_or_cost);
        });
        /**
         * Testing that an invalid prize and cost will fail
         */
        it("Invalid timestamps", async function() {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    lotto.errorData.startTime,
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                    timeStamp.plus(lotto.newLotto.endIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_timestamp);
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.endIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_timestamp);
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                    timeStamp.toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_timestamp);
        });
    });

    describe("Buying tickets tests", function() {
        /**
         * Creating a lotto for all buying tests to use. Will be a new instance
         * for each lotto. 
         */
        beforeEach( async () => {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new lottery
            await lotteryInstance.connect(owner).createNewLotto(
                lotto.newLotto.distribution,
                lotto.newLotto.prize,
                lotto.newLotto.cost,
                timeStamp.toString(),
                timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                timeStamp.plus(lotto.newLotto.endIncrease).toString()
            );
        });
        /**
         * Tests cost per ticket is as expected
         */
        it("Cost per ticket", async function() {
            let totalPrice = await lotteryInstance.costToBuyTickets(
                1,
                10
            );
            // Works back from totalPrice to one token cost
            let check = BigNumber(totalPrice.toString());
            let noOfTickets = new BigNumber(10);
            let oneCost = check.div(noOfTickets);
            // Checks price is correct
            assert.equal(
                totalPrice.toString(),
                lotto.buy.ten.cost,
                "Incorrect cost for batch buy of 10"
            );
            assert.equal(
                oneCost.toString(),
                lotto.newLotto.cost.toString(),
                "Incorrect cost for batch buy of 10"
            );
        });
        /**
         * Tests the batch buying of one token
         */
        it("Batch buying 1 tickets", async function() {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                1
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 1, 
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cakeInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tokens
            await lotteryInstance.connect(owner).batchBuyLottoTicket(
                1,
                1,
                ticketNumbers
            );
            // Testing results
            // TODO get user balances
            assert.equal(
                price.toString(),
                lotto.buy.one.cost,
                "Incorrect cost for batch buy of 1"
            );
        });
        /**
         * Tests the batch buying of ten token
         */
        it("Batch buying 10 tickets", async function() {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10, 
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cakeInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tokens
            await lotteryInstance.connect(owner).batchBuyLottoTicket(
                1,
                10,
                ticketNumbers
            );
            // Testing results
            // TODO get user balances
            assert.equal(
                price.toString(),
                lotto.buy.ten.cost,
                "Incorrect cost for batch buy of 10"
            );
        });
        /**
         * Tests the batch buying of one hundred token
         */
        it("Batch buying 50 tickets", async function() {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                50
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 50, 
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cakeInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tokens
            await lotteryInstance.connect(owner).batchBuyLottoTicket(
                1,
                50,
                ticketNumbers
            );
            // Testing results
            assert.equal(
                price.toString(),
                lotto.buy.fifty.cost,
                "Incorrect cost for batch buy of 50"
            );
        }); 
        /**
         * Tests the batch buying of one thousand token
         */
        it("Batch buying max (62) tickets", async function() {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                62
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 62, 
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cakeInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tokens
            await lotteryInstance.connect(owner).batchBuyLottoTicket(
                1,
                62,
                ticketNumbers
            );
            // Testing results
            // TODO get user balances
            assert.equal(
                price.toString(),
                lotto.buy.sixty_two.cost,
                "Incorrect cost for max batch buy of 75"
            );
        }); 
        /**
         * Tests the batch buying with invalid ticket numbers
         */
        it("Invalid chosen numbers", async function() {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 9, 
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cakeInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tokens
            await expect(
                lotteryInstance.connect(owner).batchBuyLottoTicket(
                    1,
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_mint_numbers);
        });
        /**
         * Tests the batch buying with invalid approve
         */
        it("Invalid cake transfer", async function() {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10, 
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Batch buying tokens
            await expect(
                lotteryInstance.connect(owner).batchBuyLottoTicket(
                    1,
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_mint_approve);
        });
        /**
         * Tests the batch buying after the valid time period fails
         */
        it("Invalid buying time", async function() {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10, 
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cakeInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Batch buying tokens
            await expect(
                lotteryInstance.connect(owner).batchBuyLottoTicket(
                    1,
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_mint_timestamp);
        });
    });

    describe("Drawing numbers tests", function() {
        beforeEach( async () => {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new lottery
            await lotteryInstance.connect(owner).createNewLotto(
                lotto.newLotto.distribution,
                lotto.newLotto.prize,
                lotto.newLotto.cost,
                timeStamp.toString(),
                timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                timeStamp.plus(lotto.newLotto.endIncrease).toString()
            );
        });

        it("Setting winning numbers", async function() {
            let lotteryInfoBefore = await lotteryInstance.getBasicLottoInfo(1);
            // Setting the time so that we can set winning numbers
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                [1,2,3,4]
            );
            let lotteryInfoAfter = await lotteryInstance.getBasicLottoInfo(1);

            assert.equal(
                lotteryInfoBefore.winningNumbers.toString(),
                lotto.newLotto.win.blankWinningNumbers,
                "Winning numbers set before call"
            );
            assert.equal(
                lotteryInfoAfter.winningNumbers.toString(),
                lotto.newLotto.win.simpleWinningNumbers,
                "Winning numbers incorrect after"
            );
        });

        it("Invalid winning numbers (owner)", async function() {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Drawing the numbers
            await expect(
                lotteryInstance.connect(buyer).drawWinningNumbers(
                    1,
                    [1,2,3,4]
                )
            ).to.be.revertedWith(lotto.errors.invalid_admin);
        });

        it("Invalid winning numbers (already chosen)", async function() {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                [1,2,3,4]
            );
            // Drawing the numbers again
            await expect(
                lotteryInstance.connect(owner).drawWinningNumbers(
                    1,
                    [1,2,3,4]
                )
            ).to.be.revertedWith(lotto.errors.invalid_draw_repeat);
        });

        it("Invalid winning numbers (time)", async function() {
            await expect(
                lotteryInstance.connect(owner).drawWinningNumbers(
                    1,
                    [1,2,3,4]
                )
            ).to.be.revertedWith(lotto.errors.invalid_draw_time);
        });
    });

    describe("Claiming tickets tests ", function() {
        beforeEach( async () => {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new lottery
            await lotteryInstance.connect(owner).createNewLotto(
                lotto.newLotto.distribution,
                lotto.newLotto.prize,
                lotto.newLotto.cost,
                timeStamp.toString(),
                timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                timeStamp.plus(lotto.newLotto.endIncrease).toString()
            );
            // Buying tickets
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(owner).transfer(
                buyer.address,
                price
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                price
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 50, 
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Batch buying tokens
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                50,
                ticketNumbers
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
        });

        it("Claiming winning numbers (all match)", async function() {
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(buyer.address);
            // Getting a valid tickets number
            let winningNumbers = await lotteryNftInstance.getTicketNumbers(
                userTicketIds[25].toString()
            );
            // Drawing numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                winningNumbers
            );
            let buyerCakeBalanceBefore = await cakeInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.endIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[25].toString()
            );
            let buyerCakeBalanceAfter = await cakeInstance.balanceOf(buyer.address);
            // Tests
            assert.equal(
                buyerCakeBalanceBefore.toString(),
                0,
                "Buyer has cake balance before claiming"
            );
            assert.equal(
                buyerCakeBalanceAfter.toString(),
                lotto.newLotto.win.match_all.toString(),
                "User won incorrect amount"
            );
        });

        it.only("Claiming winning numbers (3 match)", async function() {
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(buyer.address);
            // Getting a valid tickets number
            let userNumbers = await lotteryNftInstance.getTicketNumbers(
                userTicketIds[25].toString()
            );
            // Changing it so one number is different
            let winningNumbers = [];
            for (let i = 0; i < lotto.setup.sizeOfLottery; i++) {
                if(i = 2) {
                    winningNumbers[i] = 22;
                } else {
                    winningNumbers[i] = userNumbers[i];
                }
            }
            console.log(winningNumbers)
            console.log(userNumbers)
            // Drawing numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                winningNumbers
            );
            let buyerCakeBalanceBefore = await cakeInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.endIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[25].toString()
            );
            let buyerCakeBalanceAfter = await cakeInstance.balanceOf(buyer.address);
            // Tests
            assert.equal(
                buyerCakeBalanceBefore.toString(),
                0,
                "Buyer has cake balance before claiming"
            );
            assert.equal(
                buyerCakeBalanceAfter.toString(),
                lotto.newLotto.win.match_three.toString(),
                "User won incorrect amount"
            );
        });
    });

    describe("View function tests", function() {
        it("Get Lotto Info", async function() {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new lottery
            await lotteryInstance.connect(owner).createNewLotto(
                lotto.newLotto.distribution,
                lotto.newLotto.prize,
                lotto.newLotto.cost,
                timeStamp.toString(),
                timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                timeStamp.plus(lotto.newLotto.endIncrease).toString()
            );
            // Getting the basic info around this lottery
            let lottoInfo = await lotteryInstance.getBasicLottoInfo(1);
            // Testing they are correct
            assert.equal(
                lottoInfo.prizeDistribution.toString(),
                lotto.newLotto.distribution.toString(),
                "Invalid distribution"
            );
            assert.equal(
                lottoInfo.prizePoolInCake.toString(),
                lotto.newLotto.prize.toString(),
                "Invalid prize pool"
            );
            assert.equal(
                lottoInfo.costPerTicket.toString(),
                lotto.newLotto.cost,
                "Invalid cost per token"
            );
            assert.equal(
                lottoInfo.startingBlock.toString(),
                timeStamp.toString(),
                "Invalid starting time"
            );
            assert.equal(
                lottoInfo.closingBlock.toString(),
                timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                "Invalid starting time"
            );
            assert.equal(
                lottoInfo.endBlock.toString(),
                timeStamp.plus(lotto.newLotto.endIncrease).toString(),
                "Invalid starting time"
            );
        });
    });
});
