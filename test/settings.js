const { ethers } = require("ethers");
const { BigNumber } = require("bignumber.js");

const lotto = {
    setup: {
        sizeOfLottery: 4,
        maxValidRange: 20
    },
    newLotto: {
        distribution: [5, 10, 15, 20, 50],
        prize: ethers.utils.parseUnits("1000", 18),
        cost: ethers.utils.parseUnits("10", 18),
        closeIncrease: 10000,
        endIncrease: 20000,
        blankWinningNumbers: "0,0,0,0",
        simpleWinningNumbers: "1,2,3,4"
    }, 
    events: {
        new: "NewLotteryCreated",
        mint: "NewBatchMint"
    },
    buy: {
        cake: ethers.utils.parseUnits("10000000", 18),
        one: {
            cost: "10000000000000000000"
        },
        ten: {
            cost: "100000000000000000000"
        },
        fifty: {
            cost: "500000000000000000000"
        },
        seventy_five: {
            cost: "750000000000000000000"
        }
    },
    errorData: {
        distribution: [5, 10, 15, 20, 10],
        prize: ethers.utils.parseUnits("0", 18),
        cost: ethers.utils.parseUnits("0", 18),
        startTime: ethers.utils.parseUnits("0", 18),
    },
    errors: {
        invalid_admin: "Ownable: caller is not the owner",
        invalid_distribution: "Prize distribution is not 100%",
        invalid_price_or_cost: "Prize or cost cannot be 0",
        invalid_timestamp: "Timestamps for lottery invalid",
        invalid_mint_timestamp: "Invalid time for mint",
        invalid_mint_numbers: "Invalid chosen numbers",
        invalid_mint_approve: "ERC20: transfer amount exceeds allowance",
        invalid_draw_time: "Cannot set winning numbers during lottery",
        invalid_draw_repeat: "Winning Numbers chosen"
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
    BigNumber,
    generateLottoNumbers
}