// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";


contract LotteryNFT is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    uint256
        private constant LOTTERY_INDEX = 0x00000000000000000000000000000000000000000000000000000000000007FF;
    
    address payable public manager;
    string public name = "Pancake Lottery Ticket";
    string public symbol = "PLT";

    mapping (uint256 => uint8[4]) public lotteryInfo;
    mapping (uint256 => uint256) public lotteryAmount;
    mapping (uint256 => uint256) public issueIndex;
    mapping (uint256 => bool) public claimInfo;

    constructor(
        string memory _newURI, 
    ) public ERC1155(_newURI) {
        name;
        symbol;
    }

    function newLotteryItem(address player, uint8[4] memory _lotteryNumbers, uint256 _amount, uint256 _issueIndex)
        public onlyOwner
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId, _amount, "");
        lotteryInfo[newItemId] = _lotteryNumbers;
        lotteryAmount[newItemId] = _amount;
        issueIndex[newItemId] = _issueIndex;
        // claimInfo[newItemId] = false; default is false here
        // _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }

    function newBatchLotteryItem(uint256[] memory _ids, address player, uint8[4][] memory _lotteryNumbers, uint256[] memory _amounts, uint256[] memory _issueIndexs)
        public onlyOwner
        returns (uint256[] memory)
    {
        uint256[] memory lotteryItemIds;
        _mintBatch(player, lotteryItemIds, _amounts, "");
        for (uint256 i = 0; i < _ids.length; i++) {
            _tokenIds.increment();
            lotteryItemIds[i] =  _tokenIds.current();
            lotteryInfo[lotteryItemIds[i]] = _lotteryNumbers;
            lotteryAmount[lotteryItemIds[i]] = _amounts[i];
            issueIndex[lotteryItemIds[i]] = _issueIndexs[i];
        }
        return lotteryItemIds;
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
    function multiClaimReward(uint256[] calldata _ids) external onlyOwner {
        for (uint i = 0; i < _ids.length; i++) {
            claimInfo[_ids[i]] = true;
        }
    }
    function burn(address player, uint256 tokenId, uint256 amount) external onlyOwner {
        _burn(player, tokenId, amount);
    }
    function multiBurn(address player, uint256[] calldata _ids, uint256[] memory amounts) external onlyOwner {
        _burnBatch(player, _ids, amounts); 
    }
    function getClaimStatus(uint256 tokenId) external view returns (bool) {
        return claimInfo[tokenId];
    }
    // Used as the URI for all tickets types by relying on ID substitution, e.g. https://pancakeswap.finance/lottery/tickets{id}.json
    function setURI(string memory _newURI) public onlyOwner {
        _setURI(_newURI);
    }
    // balanceOfBatch Multiple accounts
    function getBalanceBatch(address[] players, uint256[] calldata _ids) external onlyOwner {
        balanceOfBatch(players, _ids);
    }
}