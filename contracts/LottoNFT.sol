//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LottoNFT is ERC1155, Ownable {
    // Libraries 
    // Counter to create unique token IDs
    using Counters for Counters.Counter;
    Counters.Counter private tokenIDsCount_;

    // State variables 
    address internal lottoContract_;
    // Storage of the lotto numbers for each token
    mapping(uint256 => uint8[]) internal lottoNumbers_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event infoBatchMint(
        address indexed receiving, 
        uint256 amountOfTokens, 
        uint256[] tokenIDs
    );

    //-------------------------------------------------------------------------
    // MODIFIERS
    //-------------------------------------------------------------------------

    /**
     * @notice  Restricts minting of new tokens to only the lotto contract.
     */
    modifier onlyLotto() {
        require(
            msg.sender == lottoContract_,
            "Only Lotto can mint"
        );
        _;
    }

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    /**
     * @param   _uri A dynamic URI that enables individuals to view information
     *          around their NFT token. To see the information replace the 
     *          `\{id\}` substring with the actual token type ID. For more info
     *          visit:
     *          https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     * @param   _lotto The address of the lotto contract. The lotto contract has
     *          elevated permissions on this contract. 
     */
    constructor(
        string memory _uri,
        address _lotto
    ) 
    ERC1155(
        _uri
    ) 
    {
        // Only Lotto contract will be able to mint new tokens
        lottoContract_ = _lotto;
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------


    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS 
    //-------------------------------------------------------------------------

    /**
     * @param   _to The address being minted to
     * @param   _amount The number of NFT's to mint
     * @notice  Only the lotto contract is able to mint tokens. 
     */
    function batchMint(
        address _to,
        uint8 _amount,
        uint8[][] calldata _lottoNumbers
    )
        public
        onlyLotto()
        returns(uint256[] memory tokenIDs)
    {
        // Setting up tokenIDs for mint
        uint256[] memory amounts;
        for (uint256 i = 0; i < _amount; i++) {
            tokenIDsCount_.increment();
            tokenIDs[i] = tokenIDsCount_.current();
            amounts[i] = 1;
            lottoNumbers_[tokenIDs[i]] = _lottoNumbers[i];
        }
        // Minting the batch of tokens
        _mintBatch(
            _to,
            tokenIDs,
            amounts,
            msg.data
        );// TODO might want to hardcode bytes passed in (msg.data) to be blank
        // Emitting relevant info
        emit infoBatchMint(
            _to, 
            _amount, 
            tokenIDs
        ); 
    }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS 
    //-------------------------------------------------------------------------

}