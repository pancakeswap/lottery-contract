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
        one: {
            cost: "10000000000000000000"
        },
        ten: {
            cost: "100000000000000000000"
        },
        one_hundred: {
            cost: "1000000000000000000000"
        },
        max: {
            cost: "1100000000000000000000"
        }
    }
}
const lottoNFT = {
    newLottoNft: {
        uri: "https://testing.com/tokens/\{id\}"
    }
}

function generateLottoNumbers({
    numberOfTickets,
    lottoSize,
    maxRange
}){
    var numberOfNumbers = [];
    let counterForNumbers = 0;
    for (let i = 0; i < numberOfTickets; i++) {
        for (let j = 0; j < lottoSize; j++) {
            numberOfNumbers[counterForNumbers] = Math.floor(Math.random() * maxRange + 1); 
            counterForNumbers += 1;
        }
    }
    return numberOfNumbers;
}

module.exports = {
    lotto,
    lottoNFT,
    generateLottoNumbers
}