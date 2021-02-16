const { expectRevert, time } = require('@openzeppelin/test-helpers');
const Lottery = artifacts.require('Lottery');
const MockBEP20 = artifacts.require('MockBEP20');
const LotteryNFT = artifacts.require('LotteryNFT');
const LotteryUpgradeProxy = artifacts.require("LotteryUpgradeProxy");

const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));


contract('Lottery', (accounts) => {
    it('init', async () => {
        alice=accounts[1];
        bob=accounts[2];
        carol=accounts[3];
        dev=accounts[4];
        minter=accounts[0];

        this.cake = await MockBEP20.deployed();
        this.nft = await LotteryNFT.deployed();
        this.lottery = await Lottery.deployed();

        await LotteryUpgradeProxy.deployed();
        this.lotteryProxyAddress = LotteryUpgradeProxy.address;

        const lotteryABIFile = "test/abi/lottery.abi";
        const lotteryABI = JSON.parse(fs.readFileSync(lotteryABIFile));
        this.lotteryProxy = new web3.eth.Contract(lotteryABI, this.lotteryProxyAddress);

        await this.nft.transferOwnership(this.lotteryProxyAddress, {from: minter});
        await this.cake.transfer(bob, '2000', { from: minter });
        await this.cake.transfer(alice, '2000', { from: minter });
        await this.cake.transfer(carol, '2000', { from: minter });
    });

    it('test', async () => {
        minter=accounts[0];
        alice=accounts[1];
        bob=accounts[2];
        carol=accounts[3];
        dev=accounts[4];
        await this.cake.approve(this.lotteryProxyAddress, '1000', { from: alice });
        await this.cake.approve(this.lotteryProxyAddress, '1000', { from: bob });

        await this.lotteryProxy.methods.buy('50', [1,3,4,3]).send({from: alice, gas: 4700000});
        await this.lotteryProxy.methods.buy('100', [1,2,3,4]).send({from: alice, gas: 4700000 });
        await this.lotteryProxy.methods.buy('50', [2,3,4,4]).send({from: alice, gas: 4700000 });
        await this.lotteryProxy.methods.buy('50', [1,1,3,4]).send({from: bob, gas: 4700000 });
        await this.lotteryProxy.methods.buy('100', [2,1,4,3]).send({from: bob, gas: 4700000 });
        await this.lotteryProxy.methods.buy('50', [1,3,4,3]).send({from: bob, gas: 4700000 });
        await this.lotteryProxy.methods.multiBuy('1', [[1,3,4,3],[1,3,4,3],[1,2,2,3],[1,3,4,3],[1,3,4,3],[1,2,2,3],[1,3,4,3],[1,3,4,3],[1,2,2,3],[1,3,4,3],[1,3,4,3],[1,2,2,3],[1,3,4,3],[1,3,4,3],[1,2,2,3],[1,3,4,3],[1,3,4,3],[1,2,2,3]]).send({from: bob, gas: 8000000 });

        assert.equal((await this.cake.balanceOf(this.lotteryProxyAddress)).toString(), '418');
        assert.equal((await this.lotteryProxy.methods.totalAddresses().call()).toString(), '2');
        assert.equal((await this.nft.tokenOfOwnerByIndex(bob, 1)).toString(), '5');
        assert.equal((await this.nft.tokenOfOwnerByIndex(alice, 0)).toString(), '1');
        assert.equal((await this.lotteryProxy.methods.getTotalRewards(0).call()).toString(), '418');
        await expectRevert(
            this.nft.tokenOfOwnerByIndex(alice, 3),
            'index out of bounds',
        );
        await expectRevert(
            this.lotteryProxy.methods.drawing().send({from: bob, gas: 4700000}),
            'admin: wut?',
        );

        await this.lotteryProxy.methods.drawing().send({from: alice, gas: 4700000});
        assert.equal((await this.lotteryProxy.methods.issueIndex().call()).toString(), '0');

        await this.lotteryProxy.methods.multiClaim([4,5,6,7]).send({from: bob, gas: 10000000});
        await this.lotteryProxy.methods.multiClaim([8,9,10,11]).send({from: bob, gas: 10000000});
        await this.lotteryProxy.methods.multiClaim([12,13,14,15]).send({from: bob, gas: 10000000});
        await this.lotteryProxy.methods.multiClaim([16,17,18,19]).send({from: bob, gas: 10000000});
        await this.lotteryProxy.methods.reset().send({from: alice, gas: 10000000});

        await this.lotteryProxy.methods.claimReward(1).send({from: alice, gas: 4700000});
        await this.lotteryProxy.methods.claimReward(2).send({from: alice, gas: 4700000});
        await this.lotteryProxy.methods.claimReward(3).send({from: alice, gas: 4700000});


        // console.log('reward:', (await this.lottery.getRewardView(tikeckIndex, {from: alice})).toString())
        // console.log('cake2:', (await this.cake.balanceOf(alice, {from: alice})).toString());
        // console.log((await this.nft.getClaimStatus(tikeckIndex, {from: alice})));

        // await expectRevert(this.lottery.claimReward(tikeckIndex, {from: alice}), 'claimed');

        // await this.lottery.reset({from: alice});

        // assert.equal((await this.lottery.issueIndex()), '1');

        // console.log((await this.lottery.historyNumbers(0, 1, {from: alice})).toString());

        // console.log((await this.lottery.getTotalRewards(1, {from: alice})).toString());

        // await this.lottery.buy('50', [1,3,4,3], {from: alice });
        // await this.lottery.buy('100', [1,2,4,3], {from: alice });
        // await this.lottery.buy('50', [2,3,4,4], {from: alice });
        // await this.lottery.buy('50', [1,1,3,4], {from: bob });
        // await this.lottery.buy('100', [2,1,4,3], {from: bob });
        // await this.lottery.buy('50', [1,3,4,3], {from: bob });

        // console.log((await this.lottery.getTotalRewards(0, {from: alice})).toString());
        // console.log((await this.lottery.getTotalRewards(1, {from: alice})).toString());

        // await this.lottery.drawing({from: alice});
        // for(let i= 0;i<4;i++) {
        //     console.log((await this.lottery.winningNumbers(i)).toString())
        // }
        // console.log((await this.lottery.getMatchingLotteries(1, 4, 0)).toString())
        // console.log((await this.lottery.getMatchingLotteries(1, 3, 0)).toString())
        // console.log((await this.lottery.getMatchingLotteries(1, 2, 0)).toString())
        // assert.equal((await this.lottery.winningNumbers()).toString(), '1');

        // assert.equal((await this.lottery.userInfo(alice, 0)).lotteryNumber1, '1');
        // assert.equal((await this.lottery.issueIndex()), '1');
        // // assert.equal((await this.lottery.lotteryInfo).length(), '1');

        // await this.lottery.drawing({from: alice });

        // console.log(await this.lottery.winningNumbers(0))

        // assert.equal((await this.lottery.historyNumbers(0,0)).toString(), (await this.lottery.winningNumbers(0)).toString());

        // assert.equal((await this.lottery.userInfo(alice, 0)).lotteryNumber1, '1');

        // await this.lottery.buy('5', [1,3,4,3], {from: bob });

        // console.log((await this.nft.tokenOfOwnerByIndex(bob, 0, {from: bob })).toString())
        // console.log((await this.nft.tokenOfOwnerByIndex(alice, 0, {from: bob })).toString())

    });

});
