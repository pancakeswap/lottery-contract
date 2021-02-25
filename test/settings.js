const { ethers } = require("ethers");

const lotto = {
    newLotto: {
        noOfNo: 5,
        distribution: [5, 10, 15, 20, 30],
        prize: ethers.utils.parseUnits("1000", 12)
    }, 
    events: {
        new: "newLotteryCreated"
    }
}
const lottoNFT = {
    newLottoNft: {
        uri: "https://testing.com/tokens/\{id\}"
    }
}

module.exports = {
    lotto,
    lottoNFT
}