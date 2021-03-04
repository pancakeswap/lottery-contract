//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Mock_erc20 is ERC20 {
    constructor(uint256 _supply) ERC20("Cake", "$C") {
        _mint(msg.sender, _supply);
    }
}