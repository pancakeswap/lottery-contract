const Lottery = artifacts.require("Lottery");
const MockBEP20 = artifacts.require("MockBEP20");
const LotteryNFT = artifacts.require("LotteryNFT");

const adminAddress = '0xB9FA21a62FC96Cb2aC635a051061E2E50d964051'

module.exports = async function(deployer) {
  // await deployer.deploy(LotteryNFT)
  // const nft = await LotteryNFT.deployed();
  // const cake = await MockBEP20.at('0x43acC9A5E94905c7D31415EB410F3E666e5F1e9A');
  // await deployer.deploy(Lottery, cake.address, nft.address, '10', adminAddress)
  // const lottery = await Lottery.deployed();
  // await nft.transferOwnership(lottery.address)

  // const lottery = await Lottery.deployed()
  // await lottery.drawing()
  // await lottery.reset()
}



