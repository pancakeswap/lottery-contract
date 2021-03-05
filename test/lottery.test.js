const { expect, assert } = require("chai");
const { providers } = require("ethers");
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
    // Creating the users
    let owner, buyer;
    // Setting the provider to enable getting timestamps 
    let provider = new ethers.providers.JsonRpcProvider();

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
        // Deploying the instances
        cakeInstance = await cakeContract.deploy(
            lotto.buy.cake,
        );
        lotteryInstance = await lotteryContract.deploy(
            cakeInstance.address,
            lotto.setup.sizeOfLottery,
            lotto.setup.maxValidRange,
        );
        lotteryNftInstance = await lotteryNftContract.deploy(
            lottoNFT.newLottoNft.uri,
            lotteryInstance.address
        );
        await lotteryInstance.init(
            lotteryNftInstance.address
        );
    });

    describe("Creating a new lottery tests", function() {
        /**
         * Tests that in the nominal case nothing goes wrong
         */
        it("Nominal case", async function() {
            // Getting the current block timestamp
            let currentTimeStamp = await provider.getBlock("latest");
            // Converting it to a format contracts can understand
            let timeStamp = new BigNumber(currentTimeStamp.timestamp);
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
            let currentTimeStamp = await provider.getBlock("latest");
            // Converting it to a format contracts can understand
            let timeStamp = new BigNumber(currentTimeStamp.timestamp);
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
        it("Invalid price distribution", async function() {
            // Getting the current block timestamp
            let currentTimeStamp = await provider.getBlock("latest");
            // Converting it to a format contracts can understand
            let timeStamp = new BigNumber(currentTimeStamp.timestamp);
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.errorData.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                    timeStamp.plus(lotto.newLotto.endIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_distribution);
        });
        /**
         * Testing that an invalid prize and cost will fail
         */
        it("Invalid price distribution", async function() {
            // Getting the current block timestamp
            let currentTimeStamp = await provider.getBlock("latest");
            // Converting it to a format contracts can understand
            let timeStamp = new BigNumber(currentTimeStamp.timestamp);
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
            let currentTimeStamp = await provider.getBlock("latest");
            // Converting it to a format contracts can understand
            let timeStamp = new BigNumber(currentTimeStamp.timestamp);
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
            let currentTimeStamp = await provider.getBlock("latest");
            // Converting it to a format contracts can understand
            let timeStamp = new BigNumber(currentTimeStamp.timestamp);
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
        it("Batch buying 100 tickets", async function() {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                100
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 100, 
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
                100,
                ticketNumbers
            );
            // Testing results
            // TODO get user balances
            assert.equal(
                price.toString(),
                lotto.buy.one_hundred.cost,
                "Incorrect cost for batch buy of 100"
            );
        }); 
        /**
         * Tests the batch buying of one thousand token
         */
        it("Batch buying max (110) tickets", async function() {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                110
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 110, 
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
                110,
                ticketNumbers
            );
            // Testing results
            // TODO get user balances
            assert.equal(
                price.toString(),
                lotto.buy.max.cost,
                "Incorrect cost for max batch buy of 110"
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
            // Getting time for next block to make buy invalid
            let currentTimeStamp = await provider.getBlock("latest");
            // Converting it to a format contracts can understand
            let timeStamp = new BigNumber(currentTimeStamp.timestamp);
            // Making timestamp too far in the future
            let futureTimestamp = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease])
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

    describe("View function tests", function() {
        it("Get Lotto Info", async function() {
            // Getting the current block timestamp
            let currentTimeStamp = await provider.getBlock("latest");
            // Converting it to a format contracts can understand
            let timeStamp = new BigNumber(currentTimeStamp.timestamp);
            // Creating a new lottery
            await lotteryInstance.connect(owner).createNewLotto(
                lotto.newLotto.distribution,
                lotto.newLotto.prize,
                lotto.newLotto.cost,
                timeStamp.toString(),
                timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                timeStamp.plus(lotto.newLotto.endIncrease).toString()
            );

            let lottoInfo = await lotteryInstance.getBasicLottoInfo(1);
            // console.log(lottoInfo.prizePoolInCake.toString())
            // TODO
        });
    });
});
