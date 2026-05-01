// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 100000*10**decimals());
    }

    function mintTokens(uint256 _amount) external {
        _mint(msg.sender, _amount);
    }
}