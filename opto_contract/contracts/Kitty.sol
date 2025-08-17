// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interface for the Wrapped FLOW (WFLOW) contract
interface IWFLOW is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

// Interface for the KittyPunch Stable Pool
interface IKittyPool {
    /**
     * @notice Deposit coins into the pool
     * @param _amounts Amount of each coin to deposit
     * @param _min_mint_amount Minimum amount of LP tokens to mint
     * @param _receiver Address to receive the LP tokens
     * @return The amount of LP tokens minted
     */
    function add_liquidity(
        uint256[2] calldata _amounts,
        uint256 _min_mint_amount,
        address _receiver
    ) external returns (uint256);
}

/**
 * @title KittyPunchFlowDepositor
 * @author Nora AI
 * @notice A helper contract to wrap native FLOW and deposit it into the KittyPunch FLOW/ankrFLOW stable pool in a single transaction.
 */
contract KittyPunchFlowDepositor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Flow EVM Mainnet Addresses ---

    // Wrapped FLOW (WFLOW) Token
    // [FIXED] Corrected the address checksum to avoid compiler warnings.
    address public constant WFLOW_ADDRESS = 0x1e028A752a155959A083c51A7A71a9b3A7B14c3b;

    // KittyPunch FLOW/ankrFLOW Stable Pool
    address public constant KITTY_POOL_ADDRESS = 0x7296a9C350cad25fc69B47Ec839DCf601752C3C2;

    // --- Events ---
    event Deposited(address indexed user, uint256 flowAmount, uint256 lpTokensReceived);
    event EmergencyWithdrawal(address indexed token, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Wraps native FLOW and deposits it into the KittyPunch stable pool.
     * @param _minLpTokensOut The minimum amount of LP tokens you are willing to receive (for slippage protection).
     */
    function wrapAndDepositFlow(uint256 _minLpTokensOut) external payable nonReentrant {
        uint256 depositAmount = msg.value;
        require(depositAmount > 0, "Must send FLOW to deposit");

        // Step 1: Wrap the native FLOW into WFLOW ERC20 token
        // The WFLOW contract will mint WFLOW tokens to this contract's address
        IWFLOW(WFLOW_ADDRESS).deposit{value: depositAmount}();

        // Step 2: Approve the KittyPunch pool to spend the WFLOW
        // [FIXED] Replaced deprecated `safeApprove` with `safeIncreaseAllowance`.
        IERC20(WFLOW_ADDRESS).safeIncreaseAllowance(KITTY_POOL_ADDRESS, depositAmount);

        // Step 3: Add liquidity to the pool
        // We are only depositing WFLOW, so the amount for ankrFLOW (index 1) is 0.
        uint256[2] memory amounts = [depositAmount, 0];
        
        uint256 lpTokensReceived = IKittyPool(KITTY_POOL_ADDRESS).add_liquidity(
            amounts,
            _minLpTokensOut,
            msg.sender // The LP tokens are sent directly to you (the caller)
        );

        emit Deposited(msg.sender, depositAmount, lpTokensReceived);
    }

    // --- Emergency Functions ---

    /**
     * @notice Allows the owner to withdraw any stuck ERC20 tokens from this contract.
     * @param _tokenAddress The address of the ERC20 token to withdraw.
     */
    function emergencyWithdrawToken(address _tokenAddress) external onlyOwner {
        uint256 amount = IERC20(_tokenAddress).balanceOf(address(this));
        if (amount > 0) {
            IERC20(_tokenAddress).safeTransfer(owner(), amount);
            emit EmergencyWithdrawal(_tokenAddress, amount);
        }
    }

    /**
     * @notice Allows the owner to withdraw any stuck native FLOW from this contract.
     */
    function emergencyWithdrawNative() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
            emit EmergencyWithdrawal(address(0), balance); // Use address(0) for native token
        }
    }

    // Allow the contract to receive native FLOW
    receive() external payable {}
}