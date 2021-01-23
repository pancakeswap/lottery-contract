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


    event Ticket(
        address indexed _player,
        uint256 indexed _id,
        uint256 indexed _amount
    );

    event TicketBatch(
        address indexed _player,
        uint256[] indexed _ids,
        uint256[] indexed _amounts
    );

    modifier onlyManager() {
        require(msg.sender == manager, "caller is not the manager");
        _;
    }

    constructor(
        string memory _newURI,
        address payable _deployerAddress
    ) public ERC1155(_newURI) {
        name;
        symbol;
        manager = _deployerAddress;
    }

    function newLotteryItem(address player, uint8[4] memory _lotteryNumbers, uint256 _amount, uint256 _issueIndex)
        public onlyManager()
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
        
        emit Ticket(player, newItemId, _amount);
        return newItemId;
        
    }

    function newBatchLotteryItem(uint256[] memory _ids, address player, uint8[4] memory _lotteryNumbers, uint256[] memory _amounts, uint256[] memory _issueIndexs)
        public onlyManager()
        returns (uint256[] memory)
    {
        uint256[] memory lotteryItemIds;
        for (uint256 i = 0; i < _ids.length; i++) {
            _tokenIds.increment();
            lotteryItemIds[i] =  _tokenIds.current();
        }
        _mintBatch(player, lotteryItemIds, _amounts, "");
        for (uint256 i = 0; i < _ids.length; i++) {
            lotteryInfo[lotteryItemIds[i]] = _lotteryNumbers;
            lotteryAmount[lotteryItemIds[i]] = _amounts[i];
            issueIndex[lotteryItemIds[i]] = _issueIndexs[i];
        }
        emit TicketBatch(player, _ids, _amounts) ;
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
    function claimReward(uint256 tokenId) external onlyManager() {
        claimInfo[tokenId] = true;
    }
    function multiClaimReward(uint256[] calldata _ids) external onlyManager() {
        for (uint i = 0; i < _ids.length; i++) {
            claimInfo[_ids[i]] = true;
        }
    }
    function burn(address player, uint256 tokenId, uint256 amount) external onlyManager() {
        _burn(player, tokenId, amount);
    }
    function multiBurn(address player, uint256[] calldata _ids, uint256[] memory amounts) external onlyManager() {
        _burnBatch(player, _ids, amounts); 
    }
    function getClaimStatus(uint256 tokenId) external view returns (bool) {
        return claimInfo[tokenId];
    }
    // Used as the URI for all tickets types by relying on ID substitution, e.g. https://pancakeswap.finance/lottery/tickets{id}.json
    function setURI(string memory _newURI) public onlyManager() {
        _setURI(_newURI);
    }
}
