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
        it("Nominal case", async function() {
            // Getting the current block timestamp
            let currentTimeStamp = await lotteryInstance.getTime();
            // Creating a new lottery
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    currentTimeStamp.toString(),
                    currentTimeStamp.add(1000).toString(),
                    currentTimeStamp.add(2000).toString()
                )
            ).to.emit(lotteryInstance, lotto.events.new)
            // Checking that emitted event contains correct information
            .withArgs(
                1,
                0,
                lotto.newLotto.distribution,
                lotto.newLotto.prize,
                lotto.newLotto.cost,
                currentTimeStamp.toString(),
                currentTimeStamp.add(1000).toString(),
                currentTimeStamp.add(2000).toString(),
                owner.address
            );
        });

        it("Non-admin attempt", async function() {
            // await assert.revertWith(
            //     curveInstance.from(user).mint(
            //         test_settings.bzz.buyAmount,
            //         buyCost
            //     ),
            //     test_settings.errors.max_spend
            // );
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
            
            let timeStamp = new BigNumber(currentTimeStamp.timestamp);

            // Creating a new lottery
            await lotteryInstance.connect(owner).createNewLotto(
                lotto.newLotto.distribution,
                lotto.newLotto.prize,
                lotto.newLotto.cost,
                timeStamp.toString(),
                timeStamp.plus(1000).toString(),
                timeStamp.plus(2000).toString()
            );
        });

        it("Cost per ticket", async function() {
            let price = await lotteryInstance.costToBuyTickets(
                1,
                5
            );

            console.log(price.toString())
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
    });

    describe("View function tests", function() {
        it("Get Lotto Info", async function() {
            // Getting the current block timestamp
            let currentTimeStamp = await lotteryInstance.getTime();
            // Creating a new lottery
            await lotteryInstance.connect(owner).createNewLotto(
                lotto.newLotto.distribution,
                lotto.newLotto.prize,
                lotto.newLotto.cost,
                currentTimeStamp.toString(),
                currentTimeStamp.add(1000).toString(),
                currentTimeStamp.add(2000).toString()
            );

            let lottoInfo = await lotteryInstance.getBasicLottoInfo(1);
            console.log(lottoInfo.prizePoolInCake.toString())
        });
    });
});
