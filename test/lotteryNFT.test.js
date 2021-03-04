const { expect, assert } = require("chai");
const { 
    lotto,
    lottoNFT,
    createAndFillTwoDArray
} = require("./settings.js");


describe("Lottery NFT contract", function() {
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
            lotto.newLotto.prize
        );
        lotteryNftInstance = await lotteryNftContract.deploy(
            lottoNFT.newLottoNft.uri,
            owner.address
        );
    });

    describe("Minting tickets", function() {
        it("Minting 1 ticket", async function() {
            let ticketNumbers = createAndFillTwoDArray({rows: 11, columns: 4});

            let ticketIds = await lotteryNftInstance.connect(owner).batchMint(
                owner.address,
                1,
                11,
                ticketNumbers
            );

            let batchAmount = await lotteryNftInstance.getUserBatchAmountForLottery(
                owner.address,
                1
            );

            let batch = await lotteryNftInstance.getUserTicketsForLotteryBatchBuy(
                owner.address,
                1,
                0
            )

            // console.log(batchAmount)
            // console.log(batch.ticketIDs)

            // let userBalance = await lotteryNftInstance.balanceOf(owner.address, 1);
            // console.log(userBalance.toString())
            //  userBalance = await lotteryNftInstance.balanceOf(owner.address, 2);
            // console.log(userBalance.toString())
            //  userBalance = await lotteryNftInstance.balanceOf(owner.address, 3);
            // console.log(userBalance.toString())
        }); 
    });

    describe("View functionality", function() {
        it("Getting user batch mint (1) info", async function() {
            let ticketNumbers = createAndFillTwoDArray({rows: 11, columns: 4});
            // Batch minting 
            await lotteryNftInstance.connect(owner).batchMint(
                owner.address,
                1,
                11,
                ticketNumbers
            );
            // Getting how many batches the user has bought 
            let batchAmount = await lotteryNftInstance.getUserBatchAmountForLottery(
                owner.address,
                1
            );
            // Getting the users tickets at a batch
            let batch = await lotteryNftInstance.getUserTicketsForLotteryBatchBuy(
                owner.address,
                1,
                0
            );
            // Testing results 
            assert.equal(
                batchAmount,
                1,
                "Incorrect number of batches"
            );
            assert.equal(
                batch.ticketIDs[0].toString(),
                1,
                "Token ID incorrect"
            );
            assert.equal(
                batch.ticketIDs[5].toString(),
                6,
                "Token ID incorrect"
            );
        }); 

        it("Getting user batch mint (3) info", async function() {
            let ticketNumbers = createAndFillTwoDArray({rows: 10, columns: 4});
            // Batch minting 
            await lotteryNftInstance.connect(owner).batchMint(
                owner.address,
                1,
                10,
                ticketNumbers
            );
            ticketNumbers = createAndFillTwoDArray({rows: 30, columns: 4});
            // Batch minting 
            await lotteryNftInstance.connect(owner).batchMint(
                owner.address,
                1,
                30,
                ticketNumbers
            );
            ticketNumbers = createAndFillTwoDArray({rows: 20, columns: 4});
            // Batch minting 
            await lotteryNftInstance.connect(owner).batchMint(
                owner.address,
                1,
                20,
                ticketNumbers
            );
            // Getting how many batches the user has bought 
            let batchAmount = await lotteryNftInstance.getUserBatchAmountForLottery(
                owner.address,
                1
            );
            console.log(batchAmount)
            // Getting the users tickets at a batch
            let batchOne = await lotteryNftInstance.getUserTicketsForLotteryBatchBuy(
                owner.address,
                1,
                0
            );
            let batchTwo = await lotteryNftInstance.getUserTicketsForLotteryBatchBuy(
                owner.address,
                1,
                1
            );
            let batchThree = await lotteryNftInstance.getUserTicketsForLotteryBatchBuy(
                owner.address,
                1,
                2
            );
            // Testing results 
            assert.equal(
                batchAmount,
                3,
                "Incorrect number of batches"
            );
            assert.equal(
                batchOne.ticketIDs[9].toString(),
                10,
                "Max Token ID incorrect on batch one"
            );
            assert.equal(
                batchOne.numberOfTickets.toString(),
                10,
                "Number of tickets incorrect on batch one"
            );
            assert.equal(
                batchTwo.ticketIDs[29].toString(),
                40,
                "MaxToken ID incorrect on batch two"
            );
            assert.equal(
                batchTwo.numberOfTickets.toString(),
                30,
                "Number of tickets incorrect on batch two"
            );
            assert.equal(
                batchThree.ticketIDs[19].toString(),
                60,
                "MaxToken ID incorrect on batch three"
            );
            assert.equal(
                batchThree.numberOfTickets.toString(),
                20,
                "Number of tickets incorrect on batch three"
            );
        }); 
    });
});