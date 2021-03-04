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
            lotto.newLotto.prize
        );
        lotteryNftInstance = await lotteryNftContract.deploy(
            lottoNFT.newLottoNft.uri,
            owner.address
        );
    });

    describe("Minting tickets", function() {
        it("Minting 1 ticket", async function() {
            // let ticketNumbers = createAndFillTwoDArray({rows: 100, columns: 4});
            
            // await lotteryNftInstance.connect(owner).batchMint(
            //     owner.address,
            //     4,
            //     [[1,2,3,4], [4,3,2,1], [4,3,2,1], [4,3,2,1]]
            // )

            // let userBalance = await lotteryNftInstance.balanceOf(owner.address, 1);
            // console.log(userBalance.toString())
            //  userBalance = await lotteryNftInstance.balanceOf(owner.address, 2);
            // console.log(userBalance.toString())
            //  userBalance = await lotteryNftInstance.balanceOf(owner.address, 3);
            // console.log(userBalance.toString())
        }); 
    });

    /**
     * // assert(_numberOfTickets == _lottoNumbers.length);
        // Setting up tokenIDs for mint
        uint256[] memory amounts;
        for (uint256 i = 0; i < _numberOfTickets; i++) {
            // tokenIDsCount_.increment();
            tokenIDs[i] = 1; //tokenIDsCount_.current();
            amounts[i] = 1;
            // lottoNumbers_[tokenIDs[i]] = _lottoNumbers[i];
        }
     */

});