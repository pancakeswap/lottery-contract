require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  gasReporter: {
    enabled: true,
    currency: 'CHF',
    gasPrice: 21
  },
  networks: {
    hardhat: {
      blockGasLimit: 13000000,
      gasPrice: 20
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12"
      },
      {
        version: "0.7.3"
      }
    ]
  } 
};
