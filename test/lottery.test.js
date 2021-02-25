const { expect } = require("chai");
const { 
    lotto,
    lottoNFT
} = require("./settings.js");

describe("Lottery contract", function() {
    // Creating the instance and contract info for the lottery contract
    let lotteryInstance, lotteryContract;
    // Creating the instance and contract info for the lottery NFT contract
    let lotteryNftInstance, lotteryNftContract;
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
        // Deploying the instances
        lotteryInstance = await lotteryContract.deploy();
        lotteryNftInstance = await lotteryNftContract.deploy(
            lottoNFT.newLottoNft.uri,
            lotteryInstance.address
        );
    });

    describe("Creating a new lottery tests", function() {
        it("Nominal case", async function() {
            // Getting the current block timestamp
            let currentTimeStamp = await lotteryInstance.getTime();
            // Creating a new lottery
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.noOfNo,
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    currentTimeStamp.toString(),
                    currentTimeStamp.add(1000).toString(),
                    currentTimeStamp.add(2000).toString()
                )
            ).to.emit(lotteryInstance, lotto.events.new)
            // Checking that emitted event contains correct information
            .withArgs(
                1,
                0,
                lotto.newLotto.noOfNo,
                lotto.newLotto.distribution,
                lotto.newLotto.prize,
                currentTimeStamp.toString(),
                currentTimeStamp.add(1000).toString(),
                currentTimeStamp.add(2000).toString(),
                owner.address
            );
        });
    });
});