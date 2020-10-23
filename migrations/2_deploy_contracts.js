const Lottery = artifacts.require("Lottery");
const MockBEP20 = artifacts.require("MockBEP20");
const LotteryNFT = artifacts.require("LotteryNFT");
const LotteryUpgradeProxy = artifacts.require("LotteryUpgradeProxy");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));


module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(LotteryNFT);
    await deployer.deploy(MockBEP20, "Pancake", "cake", "100000000000000000000000000");
    await deployer.deploy(Lottery);

    proxyAdmin=accounts[9];
    lotteryOwner=accounts[7];
    alice=accounts[1];
    admin=alice;
    const abiEncodeData = web3.eth.abi.encodeFunctionCall({
        "inputs": [
            {
                "internalType": "contract IERC20",
                "name": "_cake",
                "type": "address"
            },
            {
                "internalType": "contract LotteryNFT",
                "name": "_lottery",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_maxNumber",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_adminAddress",
                "type": "address"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, [MockBEP20.address, LotteryNFT.address, 4, lotteryOwner, admin]);

    await deployer.deploy(LotteryUpgradeProxy, Lottery.address, proxyAdmin, abiEncodeData);
};



