// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interface for SaucerSwap Router
interface ISaucerSwapRouter {
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
}

// Interface for Bonzo Finance Lending Pool
interface IBonzoLendingPool {
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function getReserveData(address asset)
        external
        view
        returns (
            uint256 configuration,
            uint128 liquidityIndex,
            uint128 variableBorrowIndex,
            uint128 currentLiquidityRate,
            uint128 currentVariableBorrowRate,
            uint128 currentStableBorrowRate,
            uint40 lastUpdateTimestamp,
            address aTokenAddress,
            address stableDebtTokenAddress,
            address variableDebtTokenAddress,
            address interestRateStrategyAddress,
            uint8 id
        );
}

/**
 * @title HBARXBonzoIntegratorMulticall
 * @dev Enhanced smart contract with Multicall3 functionality to batch operations
 *      for swapping HBAR to HBARX via SaucerSwap and depositing into Bonzo Finance
 */
contract HBARXBonzoIntegratorMulticall is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Contract addresses on Hedera testnet
    address public constant SAUCERSWAP_ROUTER = 0x0000000000000000000000000000000000004b40; // SaucerSwap Router (0.0.19264)
    address public constant WHBAR_ADDRESS = 0x0000000000000000000000000000000000003aD1;     // WHBAR (0.0.15057)
    address public constant HBARX_ADDRESS = 0x0000000000000000000000000000000000220cED;     // HBARX (0.0.2231533)
    address public constant BONZO_LENDING_POOL = 0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2;  // Bonzo Finance Lending Pool

    // Multicall3 structures
    struct Call {
        address target;
        bytes callData;
    }

    struct Call3 {
        address target;
        bool allowFailure;
        bytes callData;
    }

    struct Call3Value {
        address target;
        bool allowFailure;
        uint256 value;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    // Batch operation parameters
    struct BatchSwapParams {
        uint256 minHBARXOut;
        bool checkSupportFirst;
        bool getQuoteFirst;
    }

    // Events
    event HBARSwappedForHBARX(uint256 hbarAmount, uint256 hbarxReceived);
    event HBARXDepositedToBonzo(uint256 hbarxAmount);
    event EmergencyWithdrawal(address token, uint256 amount);
    event BatchOperationExecuted(uint256 callsExecuted, uint256 successfulCalls);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Enhanced main function with optional pre-checks using multicall pattern
     * @param params Batch operation parameters
     */
    function batchSwapHBARForHBARXAndDeposit(BatchSwapParams calldata params) 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value > 0, "Must send HBAR to swap");
        
        uint256 hbarAmount = msg.value;
        
        // Execute pre-checks if requested
        if (params.checkSupportFirst || params.getQuoteFirst) {
            _executeBatchPreChecks(hbarAmount, params);
        }
        
        // Execute main swap and deposit
        uint256 hbarxReceived = _swapHBARForHBARX(hbarAmount, params.minHBARXOut);
        _depositHBARXToBonzo(hbarxReceived);
        
        emit HBARSwappedForHBARX(hbarAmount, hbarxReceived);
        emit HBARXDepositedToBonzo(hbarxReceived);
    }

    /**
     * @dev Multicall3-style aggregate function for batching multiple calls
     * @param calls Array of calls to execute
     * @return blockNumber Current block number
     * @return returnData Array of return data from each call
     */
    function aggregate(Call[] calldata calls) 
        external 
        payable 
        returns (uint256 blockNumber, bytes[] memory returnData) 
    {
        blockNumber = block.number;
        returnData = new bytes[](calls.length);
        
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);
            require(success, "Multicall3: call failed");
            returnData[i] = ret;
        }
    }

    /**
     * @dev Multicall3-style aggregate with failure tolerance
     * @param calls Array of calls to execute with failure flags
     * @return blockNumber Current block number
     * @return returnData Array of results from each call
     */
    function aggregate3(Call3[] calldata calls) 
        external 
        payable 
        returns (uint256 blockNumber, Result[] memory returnData) 
    {
        blockNumber = block.number;
        returnData = new Result[](calls.length);
        
        for (uint256 i = 0; i < calls.length; i++) {
            Result memory result = returnData[i];
            (result.success, result.returnData) = calls[i].target.call(calls[i].callData);
            if (!result.success && !calls[i].allowFailure) {
                revert("Multicall3: call failed");
            }
        }
        
        emit BatchOperationExecuted(calls.length, _countSuccessfulCalls(returnData));
    }

    /**
     * @dev Multicall3-style aggregate with value transfers
     * @param calls Array of calls to execute with value transfers
     * @return blockNumber Current block number
     * @return returnData Array of results from each call
     */
    function aggregate3Value(Call3Value[] calldata calls) 
        external 
        payable 
        returns (uint256 blockNumber, Result[] memory returnData) 
    {
        blockNumber = block.number;
        returnData = new Result[](calls.length);
        uint256 valAccumulator;
        
        for (uint256 i = 0; i < calls.length; i++) {
            Result memory result = returnData[i];
            uint256 val = calls[i].value;
            if (val != 0) {
                valAccumulator += val;
                require(valAccumulator <= msg.value, "Multicall3: value exceeds msg.value");
            }
            
            (result.success, result.returnData) = calls[i].target.call{value: val}(calls[i].callData);
            if (!result.success && !calls[i].allowFailure) {
                revert("Multicall3: call failed");
            }
        }
        
        emit BatchOperationExecuted(calls.length, _countSuccessfulCalls(returnData));
    }

    /**
     * @dev Batch function to get multiple quotes and support checks
     * @param hbarAmounts Array of HBAR amounts to get quotes for
     * @return quotes Array of expected HBARX outputs
     * @return isSupported Whether HBARX is supported in Bonzo
     */
    function batchGetQuotesAndSupport(uint256[] calldata hbarAmounts) 
        external 
        view 
        returns (uint256[] memory quotes, bool isSupported) 
    {
        quotes = new uint256[](hbarAmounts.length);
        
        for (uint256 i = 0; i < hbarAmounts.length; i++) {
            quotes[i] = getExpectedHBARXOutput(hbarAmounts[i]);
        }
        
        isSupported = checkHBARXSupportInBonzo();
    }

    /**
     * @dev Internal function to execute batch pre-checks
     * @param hbarAmount Amount of HBAR to check
     * @param params Batch parameters
     */
    function _executeBatchPreChecks(uint256 hbarAmount, BatchSwapParams calldata params) internal view {
        if (params.checkSupportFirst) {
            require(checkHBARXSupportInBonzo(), "HBARX not supported in Bonzo");
        }
        
        if (params.getQuoteFirst) {
            uint256 expectedOutput = getExpectedHBARXOutput(hbarAmount);
            require(expectedOutput >= params.minHBARXOut, "Expected output below minimum");
        }
    }

    /**
     * @dev Internal function to count successful calls
     * @param results Array of call results
     * @return count Number of successful calls
     */
    function _countSuccessfulCalls(Result[] memory results) internal pure returns (uint256 count) {
        for (uint256 i = 0; i < results.length; i++) {
            if (results[i].success) {
                count++;
            }
        }
    }

    /**
     * @dev Internal function to swap HBAR for HBARX via SaucerSwap
     * @param hbarAmount Amount of HBAR to swap
     * @param minHBARXOut Minimum amount of HBARX expected
     * @return hbarxReceived Amount of HBARX received from the swap
     */
    function _swapHBARForHBARX(uint256 hbarAmount, uint256 minHBARXOut) internal returns (uint256 hbarxReceived) {
        // Create swap path: WHBAR -> HBARX
        address[] memory path = new address[](2);
        path[0] = WHBAR_ADDRESS;
        path[1] = HBARX_ADDRESS;
        
        // Get router instance
        ISaucerSwapRouter router = ISaucerSwapRouter(SAUCERSWAP_ROUTER);
        
        // Execute swap
        uint256[] memory amounts = router.swapExactETHForTokens{value: hbarAmount}(
            minHBARXOut,
            path,
            address(this),
            block.timestamp + 300 // 5 minutes deadline
        );
        
        hbarxReceived = amounts[1];
        require(hbarxReceived >= minHBARXOut, "Insufficient HBARX received");
    }

    /**
     * @dev Internal function to deposit HBARX to Bonzo Finance
     * @param hbarxAmount Amount of HBARX to deposit
     */
    function _depositHBARXToBonzo(uint256 hbarxAmount) internal {
        IERC20 hbarxToken = IERC20(HBARX_ADDRESS);
        IBonzoLendingPool lendingPool = IBonzoLendingPool(BONZO_LENDING_POOL);
        
        // Approve Bonzo Lending Pool to spend HBARX
        hbarxToken.forceApprove(BONZO_LENDING_POOL, hbarxAmount);
        
        // Deposit HBARX to Bonzo Finance
        lendingPool.deposit(
            HBARX_ADDRESS,
            hbarxAmount,
            msg.sender, // Deposit on behalf of the caller
            0 // No referral code
        );
    }

    /**
     * @dev Get expected HBARX output for a given HBAR input
     * @param hbarAmount Amount of HBAR to swap
     * @return expectedHBARX Expected amount of HBARX
     */
    function getExpectedHBARXOutput(uint256 hbarAmount) public view returns (uint256 expectedHBARX) {
        address[] memory path = new address[](2);
        path[0] = WHBAR_ADDRESS;
        path[1] = HBARX_ADDRESS;
        
        ISaucerSwapRouter router = ISaucerSwapRouter(SAUCERSWAP_ROUTER);
        uint256[] memory amounts = router.getAmountsOut(hbarAmount, path);
        
        expectedHBARX = amounts[1];
    }

    /**
     * @dev Check if HBARX is supported as a reserve asset in Bonzo Finance
     * @return isSupported True if HBARX is supported
     */
    function checkHBARXSupportInBonzo() public view returns (bool isSupported) {
        IBonzoLendingPool lendingPool = IBonzoLendingPool(BONZO_LENDING_POOL);
        
        try lendingPool.getReserveData(HBARX_ADDRESS) returns (
            uint256 configuration,
            uint128,
            uint128,
            uint128,
            uint128,
            uint128,
            uint40,
            address aTokenAddress,
            address,
            address,
            address,
            uint8
        ) {
            // If aTokenAddress is not zero, HBARX is supported
            isSupported = (aTokenAddress != address(0) && configuration != 0);
        } catch {
            isSupported = false;
        }
    }

    /**
     * @dev Emergency function to withdraw any ERC20 tokens stuck in the contract
     * @param token Address of the token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
        emit EmergencyWithdrawal(token, amount);
    }

    /**
     * @dev Emergency function to withdraw HBAR stuck in the contract
     */
    function emergencyWithdrawHBAR() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No HBAR to withdraw");
        
        payable(owner()).transfer(balance);
        emit EmergencyWithdrawal(address(0), balance);
    }

    /**
     * @dev Receive function to accept HBAR
     */
    receive() external payable {}

    /**
     * @dev Fallback function
     */
    fallback() external payable {}
}