// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WETH (Wrapped ETH)
 * @dev A simple ERC20 token that represents wrapped ETH for testing purposes
 * This will be used on Sepolia testnet before bridging to Hedera
 */
contract WETH is ERC20, Ownable {
    event Deposit(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);

    constructor() ERC20("Wrapped Ether", "WETH") Ownable(msg.sender) {}

    /**
     * @dev Deposit ETH and mint WETH tokens
     */
    function deposit() public payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw ETH by burning WETH tokens
     */
    function withdraw(uint256 wad) public {
        require(balanceOf(msg.sender) >= wad, "Insufficient WETH balance");
        _burn(msg.sender, wad);
        payable(msg.sender).transfer(wad);
        emit Withdrawal(msg.sender, wad);
    }

    /**
     * @dev Mint WETH tokens for testing purposes (only owner)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {
        deposit();
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        deposit();
    }
}