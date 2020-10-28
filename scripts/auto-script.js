const lotteryAbi = require("./lottery.json");
const Web3 = require("web3");

const fromAddress = "0x35f16A46D3cf19010d28578A8b02DfA3CB4095a1";
const toAddress = "0x3C3f2049cc17C136a604bE23cF7E42745edf3b91";

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    "https://bsc-dataseed.binance.org"
  )
);

const lottery = new web3.eth.Contract(lotteryAbi, toAddress);

const enterDrawing  = async () =>  {
  const nonce = await web3.eth.getTransactionCount(fromAddress);
  const gasPriceWei = await web3.eth.getGasPrice();
  const data = lottery.methods.enterDrawingPhase().encodeABI()

  const signedTx  = await web3.eth.accounts.signTransaction({
      to: toAddress,
      gas: 2000000,
      data: data,
      gasPrice: gasPriceWei,
      nonce: nonce,
      chainId: 56
  }, privateKey)

  await web3.eth.sendSignedTransaction(signedTx.rawTransaction || signedTx.rawTransaction);

}

const drawing = async () => {
  const nonce = await web3.eth.getTransactionCount(fromAddress);
  const gasPriceWei = await web3.eth.getGasPrice();
  const randomNumber = Math.floor((Math.random() * 10) + 1);
  const data = lottery.methods.drawing(randomNumber).encodeABI()

  const signedTx  = await web3.eth.accounts.signTransaction({
      to: toAddress,
      gas: 2000000,
      data: data,
      gasPrice: gasPriceWei,
      nonce: nonce,
      chainId: 56
  }, privateKey)

  await web3.eth.sendSignedTransaction(signedTx.rawTransaction || signedTx.rawTransaction);
};

const reset = async () => {
  const nonce = await web3.eth.getTransactionCount(fromAddress);
  const gasPriceWei = await web3.eth.getGasPrice();

  const signedTx  = await web3.eth.accounts.signTransaction({
      to: toAddress,
      gas: 2000000,
      data: '0xd826f88f',
      gasPrice: gasPriceWei,
      nonce: nonce,
      chainId: 56
  }, privateKey)

  await web3.eth.sendSignedTransaction(signedTx.rawTransaction || signedTx.rawTransaction);
};

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function main() {
  while(1) {
    await sleep(10000);
    const time = Date.parse(new Date()) / 1000;

    if((time - 10800) % 21600 < 18) {
      try {
        await reset()
      }
      catch(err) {
        console.log(err)
      }
    }

    else if((time - 7200) % 21600 < 18) {
      try {
        await enterDrawing()
        await drawing()
      }
      catch(err) {
        console.log(err)
      }
    }
  }
}

main();

