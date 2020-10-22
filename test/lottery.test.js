const { expectRevert, time } = require('@openzeppelin/test-helpers');
const Lottery = artifacts.require('Lottery');
const MockBEP20 = artifacts.require('MockBEP20');
const LotteryNFT = artifacts.require('LotteryNFT');

contract('Lottery', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.cake = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
        this.nft = await LotteryNFT.new({ from: minter })
        this.lottery = await Lottery.new(this.cake.address,this.nft.address,'4', alice, { from: minter });

        await this.nft.transferOwnership( this.lottery.address, {from: minter});
        await this.cake.transfer(bob, '2000', { from: minter });
        await this.cake.transfer(alice, '2000', { from: minter });
        await this.cake.transfer(carol, '2000', { from: minter });
    });

    it('test', async () => {
        await this.cake.approve(this.lottery.address, '1000', { from: alice });
        await this.cake.approve(this.lottery.address, '1000', { from: bob });
        await this.lottery.buy('50', [1,3,4,3], {from: alice });
        await this.lottery.buy('100', [1,2,3,4], {from: alice });
        await this.lottery.buy('50', [2,3,4,4], {from: alice });
        await this.lottery.buy('50', [1,1,3,4], {from: bob });
        await this.lottery.buy('100', [2,1,4,3], {from: bob });
        await this.lottery.buy('50', [1,3,4,3], {from: bob });
        await this.lottery.multiBuy('1', [[1,3,4,3],[1,3,4,3],[1,2,2,3],[1,3,4,3],[1,3,4,3],[1,2,2,3],[1,3,4,3],[1,3,4,3],[1,2,2,3],[1,3,4,3],[1,3,4,3],[1,2,2,3],[1,3,4,3],[1,3,4,3],[1,2,2,3],[1,3,4,3],[1,3,4,3],[1,2,2,3]], {from: bob });

        assert.equal((await this.cake.balanceOf(this.lottery.address)).toString(), '418');
        assert.equal((await this.lottery.totalAddresses()).toString(), '2');
        assert.equal((await this.nft.tokenOfOwnerByIndex(bob, 1)).toString(), '5');
        assert.equal((await this.nft.tokenOfOwnerByIndex(alice, 0)).toString(), '1');
        assert.equal((await this.lottery.getTotalRewards(0)).toString(), '418');
        await expectRevert(
            this.nft.tokenOfOwnerByIndex(alice, 3),
            'index out of bounds',
        );
        await expectRevert(
            this.lottery.drawing({from: bob}),
            'admin: wut?',
        );

        await this.lottery.drawing({from: alice});
        const historyAmount = await this.lottery.calculateMatchingRewardAmount({from: alice});


        assert.equal((await this.lottery.issueIndex()).toString(), '0');
        for(let i= 0;i<4;i++) {
            console.log((await this.lottery.winningNumbers(i)).toString())
        }

        await this.lottery.multiClaim([4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19], {from: bob})
        await this.lottery.reset({from: alice})
        console.log((await this.lottery.getMatchingLotteries(0, 4, 0)).toString())
        console.log((await this.lottery.getMatchingLotteries(0, 3, 0)).toString())
        console.log((await this.lottery.getMatchingLotteries(0, 2, 0)).toString())

        const tikeckIndex = (await this.lottery.getMatchingLotteries(0, 2, 0)).toString()


        console.log('cake1:', (await this.cake.balanceOf(alice, {from: alice})).toString());
        await this.lottery.claimReward(tikeckIndex, {from: alice})


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
