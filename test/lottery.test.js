const { expect } = require("chai");
const { 
    lotto,
    lottoNFT,
    createAndFillTwoDArray
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
        });

        it("Cost per ticket", async function() {
            let price = await lotteryInstance.costToBuyTickets(
                1,
                5
            );

            console.log(price.toString())
        });

        it("Batch buying 1 tickets", async function() {
            let price = await lotteryInstance.costToBuyTickets(
                1,
                1
            );

            console.log(price.toString())

            let ticketNumbers = createAndFillTwoDArray({rows: 4, columns: 1});
            
            await cakeInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );

            let tokenIds = Array(1);
            tokenIds[0] = 1;

            await expect(
                lotteryInstance.connect(owner).batchBuyLottoTicket(
                    1,
                    1,
                    ticketNumbers
                )
            ).to.emit(lotteryInstance, lotto.events.mint)
            .withArgs(
                owner.address,
                tokenIds,
                ticketNumbers,
                price,
                0,
                price
            );
        });

        it("Batch buying 100 tickets", async function() {
            // Getting the price to buy all tickets
            let price = await lotteryInstance.costToBuyTickets(
                1,
                150
            );

            console.log(price.toString())

            let ticketNumbers = createAndFillTwoDArray({rows: 4, columns: 120});
            
            await cakeInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );

            // await lotteryInstance.connect(owner).batchBuyLottoTicket(
            //     1,
            //     120,
            //     ticketNumbers
            // );

            let tokenIds = Array(120);
            for (let index = 0; index < 120; index++) {
                tokenIds[0] = index + 1;
            }

            await expect(
                lotteryInstance.connect(owner).batchBuyLottoTicket(
                    1,
                    120,
                    ticketNumbers
                )
            ).to.emit(lotteryInstance, lotto.events.mint)
            .withArgs(
                owner.address,
                tokenIds,
                ticketNumbers,
                price,
                0,
                price
            );
        });

        it("Batch buying 10 000 tickets", async function() {

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
