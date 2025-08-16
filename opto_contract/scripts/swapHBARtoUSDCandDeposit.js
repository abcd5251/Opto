const { ethers } = require("hardhat");

/**
 * Complete HBAR to USDC Swap and Bonzo Finance Deposit Workflow
 * 
 * This script:
 * 1. Guides user to swap HBAR for USDC on SaucerSwap
 * 2. Deposits the USDC to Bonzo Finance for lending
 */

async function main() {
  console.log("=== HBAR to USDC Swap and Bonzo Finance Deposit ===");
  
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log("Using address:", myAddress);
  
  // Contract addresses
  const LENDING_POOL_ADDRESS = ethers.utils.getAddress("0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2");
  const USDC_ADDRESS = ethers.utils.getAddress("0x0000000000000000000000000000000000001549");
  
  // Check current balances
  const hbarBalance = await signer.getBalance();
  console.log("Current HBAR balance:", ethers.utils.formatEther(hbarBalance), "HBAR");
  
  // USDC contract ABI
  const usdcABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
  ];
  
  // Lending Pool ABI
  const lendingPoolABI = [
    "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
    "function getReserveData(address asset) view returns (tuple(tuple(uint256 data) configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))"
  ];
  
  const usdc = new ethers.Contract(USDC_ADDRESS, usdcABI, signer);
  const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, lendingPoolABI, signer);
  
  try {
    // Step 1: Check current USDC balance
    console.log("\n=== Step 1: Current USDC Status ===");
    const usdcBalance = await usdc.balanceOf(myAddress);
    const usdcDecimals = await usdc.decimals();
    const usdcSymbol = await usdc.symbol();
    const usdcName = await usdc.name();
    
    console.log("Token:", usdcName, "(", usdcSymbol, ")");
    console.log("Decimals:", usdcDecimals);
    console.log("Current USDC balance:", ethers.utils.formatUnits(usdcBalance, usdcDecimals), usdcSymbol);
    
    if (usdcBalance.eq(0)) {
      console.log("\n❌ No USDC found in your wallet");
      console.log("\n=== How to Get USDC via SaucerSwap ===");
      console.log("1. 🌐 Visit SaucerSwap Testnet: https://testnet.saucerswap.finance/");
      console.log("2. 🔗 Connect your wallet (", myAddress, ")");
      console.log("3. 💱 Navigate to the Swap interface");
      console.log("4. 📝 Set up the swap:");
      console.log("   - From: HBAR");
      console.log("   - To: USDC");
      console.log("   - Amount: Recommended 10-50 HBAR for testing");
      console.log("5. ✅ Confirm and execute the swap");
      console.log("6. ⏳ Wait for transaction confirmation");
      console.log("7. 🔄 Return here and run this script again");
      console.log("\n💡 Tip: Start with a small amount for testing (e.g., 10 HBAR)");
      return;
    }
    
    // Step 2: Verify Bonzo Finance support for USDC
    console.log("\n=== Step 2: Verifying Bonzo Finance Support ===");
    const reserveData = await lendingPool.getReserveData(USDC_ADDRESS);
    console.log("✅ USDC is supported by Bonzo Finance");
    console.log("aToken address:", reserveData.aTokenAddress);
    console.log("Reserve ID:", reserveData.id);
    
    // Step 3: Determine deposit amount
    console.log("\n=== Step 3: Preparing USDC Deposit ===");
    const maxDepositAmount = usdcBalance;
    
    // For USDC, let's deposit a reasonable amount (e.g., 80% of balance or max $10 equivalent)
    const tenUSDC = ethers.utils.parseUnits("10", usdcDecimals);
    const eightyPercentBalance = maxDepositAmount.mul(80).div(100);
    const depositAmount = maxDepositAmount.gt(tenUSDC) ? 
      (eightyPercentBalance.gt(tenUSDC) ? tenUSDC : eightyPercentBalance) : 
      maxDepositAmount;
    
    console.log("Available USDC:", ethers.utils.formatUnits(maxDepositAmount, usdcDecimals));
    console.log("Depositing:", ethers.utils.formatUnits(depositAmount, usdcDecimals), usdcSymbol);
    
    if (depositAmount.eq(0)) {
      console.log("❌ Insufficient USDC for deposit");
      return;
    }
    
    // Step 4: Approve USDC for lending pool
    console.log("\n=== Step 4: Approving USDC ===");
    const currentAllowance = await usdc.allowance(myAddress, LENDING_POOL_ADDRESS);
    console.log("Current allowance:", ethers.utils.formatUnits(currentAllowance, usdcDecimals));
    
    if (currentAllowance.lt(depositAmount)) {
      console.log("Approving USDC for Bonzo Finance...");
      const approveTx = await usdc.approve(LENDING_POOL_ADDRESS, depositAmount, { gasLimit: 300000 });
      const approveReceipt = await approveTx.wait();
      
      if (approveReceipt.status === 1) {
        console.log("✅ USDC approved successfully");
        console.log("Approval transaction:", approveReceipt.transactionHash);
      } else {
        throw new Error("USDC approval failed");
      }
    } else {
      console.log("✅ Sufficient allowance already exists");
    }
    
    // Step 5: Deposit USDC to Bonzo Finance
    console.log("\n=== Step 5: Depositing USDC to Bonzo Finance ===");
    console.log("Depositing", ethers.utils.formatUnits(depositAmount, usdcDecimals), "USDC...");
    
    const depositTx = await lendingPool.deposit(
      USDC_ADDRESS,
      depositAmount,
      myAddress,
      0, // referralCode
      { gasLimit: 500000 }
    );
    
    console.log("Transaction submitted:", depositTx.hash);
    console.log("Waiting for confirmation...");
    
    const depositReceipt = await depositTx.wait();
    
    if (depositReceipt.status === 1) {
      console.log("\n🎉 SUCCESS! USDC deposited to Bonzo Finance!");
      console.log("Deposit transaction:", depositReceipt.transactionHash);
      
      // Step 6: Verify deposit success
      console.log("\n=== Step 6: Verifying Deposit Success ===");
      
      // Check updated USDC balance
      const newUsdcBalance = await usdc.balanceOf(myAddress);
      console.log("Remaining USDC:", ethers.utils.formatUnits(newUsdcBalance, usdcDecimals));
      
      // Check aToken balance (proof of deposit)
      const aTokenABI = [
        "function balanceOf(address) view returns (uint256)",
        "function symbol() view returns (string)",
        "function name() view returns (string)"
      ];
      
      const aToken = new ethers.Contract(reserveData.aTokenAddress, aTokenABI, signer);
      const aTokenBalance = await aToken.balanceOf(myAddress);
      const aTokenSymbol = await aToken.symbol();
      const aTokenName = await aToken.name();
      
      console.log("\n📊 Your Lending Position:");
      console.log("aToken:", aTokenName, "(", aTokenSymbol, ")");
      console.log("aToken balance:", ethers.utils.formatUnits(aTokenBalance, usdcDecimals));
      console.log("aToken address:", reserveData.aTokenAddress);
      
      console.log("\n✅ HBAR → USDC → Bonzo Finance deposit completed successfully!");
      console.log("💰 You are now earning interest on your USDC");
      console.log("🔄 You can withdraw anytime using the aTokens");
      console.log("🌐 Monitor your position at: https://testnet.bonzo.finance/");
      
      // Calculate approximate APY info
      console.log("\n📈 Additional Information:");
      console.log("- Your USDC is now earning lending interest");
      console.log("- aTokens represent your deposit + accrued interest");
      console.log("- Interest compounds automatically");
      console.log("- You can use aTokens as collateral for borrowing");
      
    } else {
      console.log("❌ Deposit transaction failed");
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    if (error.message.includes("UNPREDICTABLE_GAS_LIMIT")) {
      console.log("\n💡 The transaction would fail. Possible reasons:");
      console.log("   - Insufficient USDC balance");
      console.log("   - Insufficient allowance");
      console.log("   - Lending pool is paused");
      console.log("   - Network congestion");
    } else if (error.message.includes("CALL_EXCEPTION")) {
      console.log("\n💡 Contract call failed. Possible reasons:");
      console.log("   - Network issues");
      console.log("   - Contract state changes");
      console.log("   - Insufficient gas");
    } else if (error.message.includes("ENOTFOUND")) {
      console.log("\n💡 Network connectivity issue:");
      console.log("   - Check your internet connection");
      console.log("   - Try again in a few moments");
      console.log("   - The Hedera testnet RPC might be temporarily unavailable");
    }
    
    console.log("\n🔧 Troubleshooting Steps:");
    console.log("1. Ensure you have USDC in your wallet (swap on SaucerSwap first)");
    console.log("2. Check network connectivity");
    console.log("3. Try with a smaller deposit amount");
    console.log("4. Visit Bonzo Finance UI: https://testnet.bonzo.finance/");
    console.log("5. Check transaction status on HashScan: https://hashscan.io/testnet");
  }
}

// Helper function to check current token balances
async function checkAllBalances() {
  console.log("\n=== Current Token Balances ===");
  
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  
  // Check HBAR balance
  const hbarBalance = await signer.getBalance();
  console.log("HBAR:", ethers.utils.formatEther(hbarBalance));
  
  // Check supported token balances
  const supportedTokens = [
    { address: "0x0000000000000000000000000000000000001549", symbol: "USDC", decimals: 6 },
    { address: "0x0000000000000000000000000000000000003aD2", symbol: "WHBAR", decimals: 8 },
    { address: "0x0000000000000000000000000000000000120f46", symbol: "SAUCE", decimals: 6 },
    { address: "0x000000000000000000000000000000000015a59b", symbol: "XSAUCE", decimals: 6 },
    { address: "0x0000000000000000000000000000000000220cED", symbol: "HBARX", decimals: 8 },
    { address: "0x00000000000000000000000000000000003991eD", symbol: "KARATE", decimals: 8 }
  ];
  
  const erc20ABI = ["function balanceOf(address) view returns (uint256)"];
  
  for (const token of supportedTokens) {
    try {
      const contract = new ethers.Contract(token.address, erc20ABI, signer);
      const balance = await contract.balanceOf(myAddress);
      
      if (balance.gt(0)) {
        console.log(`${token.symbol}:`, ethers.utils.formatUnits(balance, token.decimals));
      } else {
        console.log(`${token.symbol}: 0.0`);
      }
    } catch (error) {
      console.log(`${token.symbol}: Error reading balance`);
    }
  }
}

main()
  .then(() => {
    console.log("\n=== Summary ===");
    console.log("This script facilitates the complete workflow:");
    console.log("1. 💱 HBAR → USDC swap on SaucerSwap (manual step)");
    console.log("2. 🏦 USDC deposit to Bonzo Finance (automated)");
    console.log("3. 💰 Start earning interest on your USDC");
    return checkAllBalances();
  })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });