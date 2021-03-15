const { expect, assert } = require("chai");
const { network } = require("hardhat");
const { 
    lotto,
    lottoNFT,
    BigNumber,
    generateLottoNumbers
} = require("./settings.js");

describe("Lottery contract", function() {
    let mock_erc20Contract;
    // Creating the instance and contract info for the lottery contract
    let lotteryInstance, lotteryContract;
    // Creating the instance and contract info for the lottery NFT contract
    let lotteryNftInstance, lotteryNftContract;
    // Creating the instance and contract info for the cake token contract
    let cakeInstance;
    // Creating the instance and contract info for the timer contract
    let timerInstance, timerContract;
    // Creating the instance and contract info for the mock rand gen
    let randGenInstance, randGenContract;
    // Creating the instance and contract of all the contracts needed to mock
    // the ChainLink contract ecosystem. 
    let linkInstance;
    let mock_vrfCoordInstance, mock_vrfCoordContract;
    
    // Creating the users
    let owner, buyer;

    beforeEach(async () => {
        // Getting the signers provided by ethers
        const signers = await ethers.getSigners();
        // Creating the active wallets for use
        owner = signers[0];
        buyer = signers[1];

        // Getting the lottery code (abi, bytecode, name)
        lotteryContract = await ethers.getContractFactory("Lottery");
        // Getting the lotteryNFT code (abi, bytecode, name)
        lotteryNftContract = await ethers.getContractFactory("LotteryNFT");
        // Getting the lotteryNFT code (abi, bytecode, name)
        mock_erc20Contract = await ethers.getContractFactory("Mock_erc20");
        // Getting the timer code (abi, bytecode, name)
        timerContract = await ethers.getContractFactory("Timer");
        // Getting the ChainLink contracts code (abi, bytecode, name)
        randGenContract = await ethers.getContractFactory("RandomNumberGenerator");
        mock_vrfCoordContract = await ethers.getContractFactory("Mock_VRFCoordinator");

        // Deploying the instances
        timerInstance = await timerContract.deploy();
        cakeInstance = await mock_erc20Contract.deploy(
            lotto.buy.cake,
        );
        linkInstance = await mock_erc20Contract.deploy(
            lotto.buy.cake,
        );
        mock_vrfCoordInstance = await mock_vrfCoordContract.deploy(
            linkInstance.address,
            lotto.chainLink.keyHash,
            lotto.chainLink.fee
        );
        lotteryInstance = await lotteryContract.deploy(
            cakeInstance.address,
            timerInstance.address,
            lotto.setup.sizeOfLottery,
            lotto.setup.maxValidRange,
            lotto.setup.bucket.one,
            lotto.setup.bucket.two,
            lotto.setup.bucketDiscount.one,
            lotto.setup.bucketDiscount.two,
            lotto.setup.bucketDiscount.three
        );
        randGenInstance = await randGenContract.deploy(
            mock_vrfCoordInstance.address,
            linkInstance.address,
            lotteryInstance.address,
            lotto.chainLink.keyHash,
            lotto.chainLink.fee
        );
        lotteryNftInstance = await lotteryNftContract.deploy(
            lottoNFT.newLottoNft.uri,
            lotteryInstance.address,
            timerInstance.address
        );
        await lotteryInstance.initialize(
            lotteryNftInstance.address,
            randGenInstance.address
        );
        // Making sure the lottery has some cake
        await cakeInstance.mint(
            lotteryInstance.address,
            lotto.newLotto.prize
        );
        // Sending link to lottery
        await linkInstance.transfer(
            randGenInstance.address,
            lotto.buy.cake
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
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
                )
            ).to.emit(lotteryInstance, lotto.events.new)
            // Checking that emitted event contains correct information
            .withArgs(
                1,
                0
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
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
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
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
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
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
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
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_price_or_cost);
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.errorData.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
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
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_timestamp);
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
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
                timeStamp.plus(lotto.newLotto.closeIncrease).toString()
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
            await lotteryInstance.batchBuyLottoTicket(
                1,
                1,
                ticketNumbers
            );
            // Testing results
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
         * Tests the batch buying of fifty token
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
                timeStamp.plus(lotto.newLotto.closeIncrease).toString()
            );
        });
        /**
         * Testing that the winning numbers can be set in the nominal case
         */
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
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            // Getting info after call
            let lotteryInfoAfter = await lotteryInstance.getBasicLottoInfo(1);
            // Testing
            assert.equal(
                lotteryInfoBefore.winningNumbers.toString(),
                lotto.newLotto.win.blankWinningNumbers,
                "Winning numbers set before call"
            );
            assert.equal(
                lotteryInfoAfter.winningNumbers.toString(),
                lotto.newLotto.win.winningNumbers,
                "Winning numbers incorrect after"
            );
        });
        /**
         * Testing that a non owner cannot set the winning numbers
         */
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
                    1234
                )
            ).to.be.revertedWith(lotto.errors.invalid_admin);
        });
        /**
         * Testing that numbers cannot be updated once chosen
         */
        it("Invalid winning numbers (already chosen)", async function() {
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
                1234
            );
            // Drawing the numbers again
            await expect(
                lotteryInstance.connect(owner).drawWinningNumbers(
                    1,
                    1234
                )
            ).to.be.revertedWith(lotto.errors.invalid_draw_repeat);
        });
        /**
         * Testing that winning numbers cannot be set while lottery still in 
         * progress
         */
        it("Invalid winning numbers (time)", async function() {
            await expect(
                lotteryInstance.connect(owner).drawWinningNumbers(
                    1,
                    1234
                )
            ).to.be.revertedWith(lotto.errors.invalid_draw_time);
        });
    });

    describe("Claiming tickets tests", function() {
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
                timeStamp.plus(lotto.newLotto.closeIncrease).toString()
            );
            // Buying tickets
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
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
        });
        /**
         * Testing that claiming numbers (4 match) changes the users balance
         * correctly. 
         */
        it("Claiming winning numbers (4 (all) match)", async function() {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                lotto.newLotto.win.winningNumbersArr
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            let buyerCakeBalanceBefore = await cakeInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[50].toString()
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
        /**
         * Testing that claiming numbers (3 match) changes the users balance
         * correctly. 
         */
        it("Claiming winning numbers (3 match)", async function() {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            let altered = lotto.newLotto.win.winningNumbersArr;
            altered[0] = 0;
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                altered
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            let buyerCakeBalanceBefore = await cakeInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[50].toString()
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
        /**
         * Testing that claiming numbers (2 match) changes the users balance
         * correctly. 
         */
        it("Claiming winning numbers (2 match)", async function() {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            let altered = lotto.newLotto.win.winningNumbersArr;
            altered[0] = 0;
            altered[1] = 0;
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                altered
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            let buyerCakeBalanceBefore = await cakeInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[50].toString()
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
                lotto.newLotto.win.match_two.toString(),
                "User won incorrect amount"
            );
        });
        /**
         * Testing that claiming numbers (1 match) changes the users balance
         * correctly. 
         */
        it("Claiming winning numbers (1 match)", async function() {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            let altered = lotto.newLotto.win.winningNumbersArr;
            altered[0] = 0;
            altered[1] = 0;
            altered[2] = 0;
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                altered
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            let buyerCakeBalanceBefore = await cakeInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[50].toString()
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
                lotto.newLotto.win.match_one.toString(),
                "User won incorrect amount"
            );
        });
        /**
         * Testing that claiming numbers (0 match) changes the users balance
         * correctly. 
         */
        it("Claiming winning numbers (0 (none) match)", async function() {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            let altered = lotto.newLotto.win.winningNumbersArr;
            altered[0] = 0;
            altered[1] = 0;
            altered[2] = 0;
            altered[3] = 0;
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                altered
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            let buyerCakeBalanceBefore = await cakeInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[50].toString()
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
                0,
                "User won incorrect amount"
            );
        });
        /**
         * Testing that a claim cannot happen while the lottery is still active
         */
        it("Invalid claim (incorrect time)", async function() {
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            await lotteryInstance.setCurrentTime(currentTime.toString());
            // Claiming winnings 
            await expect(
                lotteryInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[25].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_time);
        });
        /**
         * Testing that a claim cannot happen until the winning numbers are
         * chosen. 
         */
        it("Invalid claim (winning numbers not chosen)", async function() {
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await expect(
                lotteryInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[25].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_draw);
        });
        /**
         * Testing that only the owner of a token can claim winnings
         */
        it("Invalid claim (not owner)", async function() {
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await expect(
                lotteryInstance.connect(owner).claimReward(
                    1,
                    userTicketIds[25].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_owner);
        });
        /**
         * Testing that a ticket cannot be claimed twice
         */
        it("Invalid claim (already claimed)", async function() {
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[25].toString()
            );
            // Claiming winnings again
            await expect(
                lotteryInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[25].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_duplicate);
        });
        /**
         * Tests that numbers outside of range are rejected on claim
         */
        it("Invalid claim (numbers out of range)", async function() {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                lotto.errorData.ticketNumbers
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings with invalid numbers
            await expect(
                lotteryInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[50].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_numbers_range);
        });

        it("Invalid claim (ticket for different lottery)", async function() {
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
                timeStamp.plus(lotto.newLotto.closeIncrease).toString()
            );
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                2,
                1
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                2,
                1,
                lotto.newLotto.win.winningNumbersArr
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
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(2, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings with invalid numbers
            await expect(
                lotteryInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[0].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_lottery);
        });
    });

    describe("Batch claiming tickets tests", function() {
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
                timeStamp.plus(lotto.newLotto.closeIncrease).toString()
            );
            // Buying tickets
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                49
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 49, 
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Batch buying tokens
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                49,
                ticketNumbers
            );
            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                lotto.newLotto.win.winningNumbersArr
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

        it("Batch claiming winning numbers (multiple match)", async function() {
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting the request ID out of events
            let requestId = tx.events[0].args.requestId.toString();
            // Mocking the VRF Coordinator contract for random request fulfilment 
            await mock_vrfCoordInstance.connect(owner).callBackWithRandomness(
                requestId,
                lotto.draw.random,
                randGenInstance.address
            );
            let buyerCakeBalanceBefore = await cakeInstance.balanceOf(buyer.address);
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).batchClaimRewards(
                1,
                userTicketIds
            );
            let buyerCakeBalanceAfter = await cakeInstance.balanceOf(buyer.address);
            // Tests
            assert.equal(
                buyerCakeBalanceBefore.toString(),
                0,
                "Buyer has cake balance before claiming"
            );
            assert.notEqual(
                buyerCakeBalanceAfter.toString(),
                buyerCakeBalanceBefore.toString(),
                "User balance has not changed"
            );
            assert.notEqual(
                buyerCakeBalanceAfter.toString(),
                lotto.newLotto.win.match_all.toString(),
                "User won incorrect amount"
            );
        });
    });

    describe("Upgrade functionality tests", function() {
        /**
         * Tests that an admin can update the size of a lottery
         */
        it("Update size of lottery", async function() {
            // Getting the size of the lottery
            let sizeOfLottery = await lotteryInstance.sizeOfLottery_();
            // Updating the size of the lottery
            await lotteryInstance.updateSizeOfLottery(lotto.update.sizeOfLottery);
            // Getting the size of the lottery after the update
            let sizeOfLotteryAfter = await lotteryInstance.sizeOfLottery_();
            // Testing
            assert.equal(
                sizeOfLottery.toString(),
                lotto.setup.sizeOfLottery,
                "Start size incorrect"
            );
            assert.equal(
                sizeOfLotteryAfter.toString(),
                lotto.update.sizeOfLottery,
                "Start incorrect after update"
            );
        });
        /**
         * Tests that size cannot be updated to current size
         */
        it("Invalid update size of lottery (same as current)", async function() {
            // Getting the size of the lottery
            let sizeOfLottery = await lotteryInstance.sizeOfLottery_();
            // Updating the size of the lottery
            await expect(
                lotteryInstance.updateSizeOfLottery(sizeOfLottery.toString())
            ).to.be.revertedWith(lotto.errors.invalid_size_update_duplicate);
        });
        /**
         * Tests that a non owner cannot change the size of a lottery
         */
        it("Invalid update size of lottery (non-owner)", async function() {
            // Updating the size of the lottery
            await expect(
                lotteryInstance.connect(buyer).updateSizeOfLottery(
                    lotto.update.sizeOfLottery
                )
            ).to.be.revertedWith(lotto.errors.invalid_admin);
        });
        /**
         * Tests that an admin can update the max range of numbers
         */
        it("Update range of numbers", async function() {
            // Getting the range
            let maxRange = await lotteryInstance.maxValidRange_();
            // Updating range
            await lotteryInstance.connect(owner).updateMaxRange(
                lotto.update.maxValidRange
            );
            // Getting the range after
            let maxRangeAfter = await lotteryInstance.maxValidRange_();
            // Testing
            assert.equal(
                maxRange.toString(),
                lotto.setup.maxValidRange,
                "Max range incorrect before update"
            );
            assert.equal(
                maxRangeAfter.toString(),
                lotto.update.maxValidRange,
                "Max range incorrect after update"
            );
        });
        /**
         * Tests that max range cannot be updated to current range
         */
        it("Invalid update size of lottery (same as current)", async function() {
            // Updating range
            await expect(
                lotteryInstance.connect(owner).updateMaxRange(
                    lotto.setup.maxValidRange
                )
            ).to.be.revertedWith(lotto.errors.invalid_size_update_duplicate);
        });
        /**
         * Tests that a non owner cannot change the max range
         */
        it("Invalid update size of lottery (non-owner)", async function() {
            // Updating the size of the lottery
            await expect(
                lotteryInstance.connect(buyer).updateMaxRange(
                    lotto.setup.maxValidRange
                )
            ).to.be.revertedWith(lotto.errors.invalid_admin);
        });

        it("Update buckets", async function() {
            // Getting the size of the lottery
            let bucketOne = await lotteryInstance.bucketOneMax_();
            let bucketTwo = await lotteryInstance.bucketTwoMax_();
            let disBucketOne = await lotteryInstance.discountForBucketOne_();
            let disBucketTwo = await lotteryInstance.discountForBucketTwo_();
            let disBucketThree = await lotteryInstance.discountForBucketThree_();
            // Updating the size of the lottery
            await lotteryInstance.connect(owner).updateBuckets(
                lotto.update.bucket.one,
                lotto.update.bucket.two,
                lotto.update.bucketDiscount.one,
                lotto.update.bucketDiscount.two,
                lotto.update.bucketDiscount.three
            );
            // Getting the size of the lottery after the update
            let bucketOneAfter = await lotteryInstance.bucketOneMax_();
            let bucketTwoAfter = await lotteryInstance.bucketTwoMax_();
            let disBucketOneAfter = await lotteryInstance.discountForBucketOne_();
            let disBucketTwoAfter = await lotteryInstance.discountForBucketTwo_();
            let disBucketThreeAfter = await lotteryInstance.discountForBucketThree_();
            // Testing
            assert.equal(
                bucketOne.toString(),
                lotto.setup.bucket.one,
                "Bucket one incorrect"
            );
            assert.equal(
                bucketOneAfter.toString(),
                lotto.update.bucket.one,
                "Bucket one incorrect"
            );
            assert.equal(
                bucketTwo.toString(),
                lotto.setup.bucket.two,
                "Bucket two incorrect"
            );
            assert.equal(
                bucketTwoAfter.toString(),
                lotto.update.bucket.two,
                "Bucket two incorrect"
            );
            assert.equal(
                disBucketOne.toString(),
                lotto.setup.bucketDiscount.one,
                "Bucket one discount incorrect"
            );
            assert.equal(
                disBucketOneAfter.toString(),
                lotto.update.bucketDiscount.one,
                "Bucket one discount incorrect"
            );
            assert.equal(
                disBucketTwo.toString(),
                lotto.setup.bucketDiscount.two,
                "Bucket two discount incorrect"
            );
            assert.equal(
                disBucketTwoAfter.toString(),
                lotto.update.bucketDiscount.two,
                "Bucket two discount incorrect"
            );
            assert.equal(
                disBucketThree.toString(),
                lotto.setup.bucketDiscount.three,
                "Bucket three discount incorrect"
            );
            assert.equal(
                disBucketThreeAfter.toString(),
                lotto.update.bucketDiscount.three,
                "Bucket three discount incorrect"
            );
        });

        it("Invalid bucket update (non owner)", async function() {
            await expect(
                lotteryInstance.connect(buyer).updateBuckets(
                    lotto.update.bucket.one,
                    lotto.update.bucket.two,
                    lotto.update.bucketDiscount.one,
                    lotto.update.bucketDiscount.two,
                    lotto.update.bucketDiscount.three
                )
            ).to.be.revertedWith(lotto.errors.invalid_admin);
        });

        it("Invalid bucket update (max 0)", async function() {
            await expect(
                lotteryInstance.connect(owner).updateBuckets(
                    lotto.errorData.bucket,
                    lotto.update.bucket.two,
                    lotto.update.bucketDiscount.one,
                    lotto.update.bucketDiscount.two,
                    lotto.update.bucketDiscount.three
                )
            ).to.be.revertedWith(lotto.errors.invalid_bucket_range);
            await expect(
                lotteryInstance.connect(owner).updateBuckets(
                    lotto.update.bucket.one,
                    lotto.errorData.bucket,
                    lotto.update.bucketDiscount.one,
                    lotto.update.bucketDiscount.two,
                    lotto.update.bucketDiscount.three
                )
            ).to.be.revertedWith(lotto.errors.invalid_bucket_range);
        });

        it("Invalid bucket update (discount increase)", async function() {
            await expect(
                lotteryInstance.connect(owner).updateBuckets(
                    lotto.update.bucket.one,
                    lotto.update.bucket.two,
                    lotto.update.bucketDiscount.two,
                    lotto.update.bucketDiscount.one,
                    lotto.update.bucketDiscount.three
                )
            ).to.be.revertedWith(lotto.errors.invalid_bucket_discount);
            await expect(
                lotteryInstance.connect(owner).updateBuckets(
                    lotto.update.bucket.one,
                    lotto.update.bucket.two,
                    lotto.update.bucketDiscount.one,
                    lotto.update.bucketDiscount.three,
                    lotto.update.bucketDiscount.two,
                )
            ).to.be.revertedWith(lotto.errors.invalid_bucket_discount);
        });

        it("Withdraw excess cake", async function() {
            let ownerCakeBalance = await cakeInstance.balanceOf(owner.address);
            let lotteryCakeBalance = await cakeInstance.balanceOf(lotteryInstance.address);
            await lotteryInstance.connect(owner).withdrawCake(lotteryCakeBalance);
            let ownerCakeBalanceAfter = await cakeInstance.balanceOf(owner.address);
            let lotteryCakeBalanceAfter = await cakeInstance.balanceOf(lotteryInstance.address);
            // Tests
            assert.notEqual(
                ownerCakeBalance.toString(),
                ownerCakeBalanceAfter.toString(),
                "Owner cake balance did not change"
            );
            assert.notEqual(
                lotteryCakeBalance.toString(),
                lotteryCakeBalanceAfter.toString(),
                "Lottery balance did not change"
            );
            assert.equal(
                lotteryCakeBalanceAfter.toString(),
                0,
                "Lottery has not been drained"
            );
        });

        it("Invalid withdraw excess cake (non owner)", async function() {
            let lotteryCakeBalance = await cakeInstance.balanceOf(lotteryInstance.address);
            await expect(
                lotteryInstance.connect(buyer).withdrawCake(lotteryCakeBalance)
            ).to.be.revertedWith(lotto.errors.invalid_admin);
        });
    });

    describe("View function tests", function() {
        it("Get Lotto discount", async function() {
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
                timeStamp.plus(lotto.newLotto.closeIncrease).toString()
            );

            let pricesBucketOne = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                10
            );
            let pricesBucketTwo = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                35
            );
            let pricesBucketThree = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                51
            );
            assert.equal(
                pricesBucketOne[0].toString(),
                lotto.discount.ten.cost,
                "Cost for buy of 10 incorrect"
            );
            assert.equal(
                pricesBucketOne[1].toString(),
                lotto.discount.ten.discount,
                "Discount for buy of 10 incorrect"
            );
            assert.equal(
                pricesBucketOne[2].toString(),
                lotto.discount.ten.discountCost,
                "Discount cost for buy of 10 incorrect"
            );
            assert.equal(
                pricesBucketTwo[0].toString(),
                lotto.discount.thirty_five.cost,
                "Cost for buy of 35 incorrect"
            );
            assert.equal(
                pricesBucketTwo[1].toString(),
                lotto.discount.thirty_five.discount,
                "Discount for buy of 35 incorrect"
            );
            assert.equal(
                pricesBucketTwo[2].toString(),
                lotto.discount.thirty_five.discountCost,
                "Discount cost for buy of 35 incorrect"
            );
            assert.equal(
                pricesBucketThree[0].toString(),
                lotto.discount.fifty_one.cost,
                "Cost for buy of 55 incorrect"
            );
            assert.equal(
                pricesBucketThree[1].toString(),
                lotto.discount.fifty_one.discount,
                "Discount for buy of 55 incorrect"
            );
            assert.equal(
                pricesBucketThree[2].toString(),
                lotto.discount.fifty_one.discountCost,
                "Discount cost for buy of 55 incorrect"
            );
        });

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
                timeStamp.plus(lotto.newLotto.closeIncrease).toString()
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
                lottoInfo.startingTimestamp.toString(),
                timeStamp.toString(),
                "Invalid starting time"
            );
            assert.equal(
                lottoInfo.closingTimestamp.toString(),
                timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                "Invalid starting time"
            );
        });

        it("Get User Tickets", async function() {
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
                timeStamp.plus(lotto.newLotto.closeIncrease).toString()
            );
            // Buying tickets
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
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

            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            ticketNumbers = generateLottoNumbers({
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


            let tickets = await lotteryNftInstance.getUserTicketsPagination(
                buyer.address,
                1,
                0,
                50
            );
            let ticketsTwo = await lotteryNftInstance.getUserTicketsPagination(
                buyer.address,
                1,
                50,
                50
            );
            let userTickets = await lotteryNftInstance.getUserTickets(
                1,
                buyer.address
            );
            let allTickets = [...tickets[0],...ticketsTwo[0]];

            assert.equal(
                userTickets[99].toString(),
                allTickets[99].toString(),
                "Tickets are not equal from both view functions"
            );
        });

        it("Get User Tickets", async function() {
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
                timeStamp.plus(lotto.newLotto.closeIncrease).toString()
            );
            // Buying tickets
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
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

            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            ticketNumbers = generateLottoNumbers({
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

            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            ticketNumbers = generateLottoNumbers({
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

            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            ticketNumbers = generateLottoNumbers({
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

            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            ticketNumbers = generateLottoNumbers({
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

            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            ticketNumbers = generateLottoNumbers({
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

            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            ticketNumbers = generateLottoNumbers({
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

            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            ticketNumbers = generateLottoNumbers({
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

            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            ticketNumbers = generateLottoNumbers({
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

            // Getting the price to buy
            prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cake
            await cakeInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cakeInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            ticketNumbers = generateLottoNumbers({
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

            let userInfo = await lotteryNftInstance.getUserTickets(
                1,
                buyer.address
            );
        });
    });
});
