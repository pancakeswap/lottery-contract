const { ethers } = require("ethers");
const { BigNumber } = require("bignumber.js");

const lotto = {
    setup: {
        sizeOfLottery: 4,
        maxValidRange: 20
    },
    newLotto: {
        distribution: [5, 10, 15, 20, 30],
        prize: ethers.utils.parseUnits("1000", 18),
        cost: ethers.utils.parseUnits("10", 18),
    }, 
    events: {
        new: "newLotteryCreated",
        mint: "newBatchMint"
    },
    buy: {
        cake: ethers.utils.parseUnits("10000000", 18),
        one_hundred: {
            cost: "1000000000000000000000"
        }
    }
}
const lottoNFT = {
    newLottoNft: {
        uri: "https://testing.com/tokens/\{id\}"
    }
}

function createAndFillTwoDArray({
    rows,
    columns
}){
    var numberOfNumbers = Array(rows);
    for (let index = 0; index < rows; index++) {
        numberOfNumbers[index] = Array(columns).fill(1);
    }
    return numberOfNumbers;
}

module.exports = {
    lotto,
    lottoNFT,
    createAndFillTwoDArray
}