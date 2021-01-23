// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/BEP20.sol";

contract MockBEP20 is BEP20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 supply
    ) public BEP20(name, symbol) {
        _mint(msg.sender, supply);

    }
}