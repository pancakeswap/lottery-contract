pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LotteryNFT is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping (uint256 => uint8[4]) public lotteryInfo;
    mapping (uint256 => uint256) public lotteryAmount;
    mapping (uint256 => uint256) public issueIndex;
    mapping (uint256 => bool) public claimInfo;

    constructor() public ERC1155("random meta uri") {}

    function newLotteryItem(address player, uint8[4] memory _lotteryNumbers, uint256 _amount, uint256 _issueIndex)
        public onlyOwner
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId, 1);
        lotteryInfo[newItemId] = _lotteryNumbers;
        lotteryAmount[newItemId] = _amount;
        issueIndex[newItemId] = _issueIndex;
        // claimInfo[newItemId] = false; default is false here
        // _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function batchNewLotteryItem(address player, uint8[4][] memory _lotteryNumbers, uint256 _amount, uint256 _issueIndex)
        public onlyOwner
        returns (uint256[] memory)
    {
        uint256[] memory newItemIds;
        uint256[] memory prices;
        for (uint i = 0; i < _numbers.length; i ++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();
            newItemIds[i] = newItemId
            lotteryInfo[newItemId] = _lotteryNumbers[i];
            lotteryAmount[newItemId] = _amount;
            issueIndex[newItemId] = _issueIndex;
            prices[i] = _amount;
        }
        _mintBatch(player, newItemIds, prices)
        return newItemIds
    }

    function getLotteryNumbers(uint256 tokenId) external view returns (uint8[4] memory) {
        return lotteryInfo[tokenId];
    }
    function getLotteryAmount(uint256 tokenId) external view returns (uint256) {
        return lotteryAmount[tokenId];
    }
    function getLotteryIssueIndex(uint256 tokenId) external view returns (uint256) {
        return issueIndex[tokenId];
    }
    function claimReward(uint256 tokenId) external onlyOwner {
        claimInfo[tokenId] = true;
    }
    function multiClaimReward(uint256[] memory _tokenIds) external onlyOwner {
        for (uint i = 0; i < _tokenIds.length; i++) {
            claimInfo[_tokenIds[i]] = true;
        }
    }
    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }
    function getClaimStatus(uint256 tokenId) external view returns (bool) {
        return claimInfo[tokenId];
    }
}
