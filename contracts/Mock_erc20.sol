//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Mock_erc20 is ERC20 {
    constructor(uint256 _supply) ERC20("Cake", "$C") {
        _mint(msg.sender, _supply);
    }

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}