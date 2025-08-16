const { ethers } = require("hardhat");

/**
 * Complete HBAR Deposit Workflow for Bonzo Finance
 * 
 * This script demonstrates the complete process:
 * 1. Get WHBAR via SaucerSwap (simulated - requires manual step)
 * 2. Deposit WHBAR to Bonzo Finance for lending
 * 
 * Note: Step 1 requires using SaucerSwap UI manually
 * This script focuses on Step 2 - depositing existing WHBAR
 */

async function main() {
  console.log("=== Complete HBAR Deposit Workflow for Bonzo Finance ===");
  
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log("Using address:", myAddress);
  
  // Contract addresses
  const LENDING_POOL_ADDRESS = ethers.utils.getAddress("0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2");
  const WHBAR_ADDRESS = ethers.utils.getAddress("0x0000000000000000000000000000000000003aD2");
  
  // Check current balances
  const hbarBalance = await signer.getBalance();
  console.log("HBAR balance:", ethers.utils.formatEther(hbarBalance), "HBAR");
  
  // WHBAR contract ABI
  const whbarABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function transfer(address,uint256) returns (bool)"
  ];
  
  // Lending Pool ABI
  const lendingPoolABI = [
    "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
    "function getReserveData(address asset) view returns (tuple(tuple(uint256 data) configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))"
  ];
  
  const whbar = new ethers.Contract(WHBAR_ADDRESS, whbarABI, signer);
  const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, lendingPoolABI, signer);
  
  try {
    // Step 1: Check current WHBAR balance
    console.log("\n=== Step 1: Current WHBAR Status ===");
    const whbarBalance = await whbar.balanceOf(myAddress);
    const whbarDecimals = await whbar.decimals();
    const whbarSymbol = await whbar.symbol();
    
    console.log("Current WHBAR balance:", ethers.utils.formatUnits(whbarBalance, whbarDecimals), whbarSymbol);
    
    if (whbarBalance.eq(0)) {
      console.log("\n❌ No WHBAR found in your wallet");
      console.log("\n=== How to Get WHBAR ===");
      console.log("1. Visit SaucerSwap Testnet: https://testnet.saucerswap.finance/");
      console.log("2. Connect your wallet (", myAddress, ")");
      console.log("3. Swap HBAR for WHBAR");
      console.log("4. Return here and run this script again");
      console.log("\n💡 Alternative: Swap HBAR for other supported tokens:");
      console.log("   - USDC, SAUCE, XSAUCE, HBARX, KARATE");
      console.log("   - All are supported by Bonzo Finance");
      return;
    }
    
    // Step 2: Verify Bonzo Finance support
    console.log("\n=== Step 2: Verifying Bonzo Finance Support ===");
    const reserveData = await lendingPool.getReserveData(WHBAR_ADDRESS);
    console.log("✅ WHBAR is supported by Bonzo Finance");
    console.log("aToken address:", reserveData.aTokenAddress);
    console.log("Reserve ID:", reserveData.id);
    
    // Step 3: Determine deposit amount
    console.log("\n=== Step 3: Preparing Deposit ===");
    const maxDepositAmount = whbarBalance;
    const depositAmount = maxDepositAmount.div(2); // Deposit half of available WHBAR
    
    console.log("Available WHBAR:", ethers.utils.formatUnits(maxDepositAmount, whbarDecimals));
    console.log("Depositing:", ethers.utils.formatUnits(depositAmount, whbarDecimals), whbarSymbol);
    
    if (depositAmount.eq(0)) {
      console.log("❌ Insufficient WHBAR for deposit");
      return;
    }
    
    // Step 4: Approve WHBAR for lending pool
    console.log("\n=== Step 4: Approving WHBAR ===");
    const currentAllowance = await whbar.allowance(myAddress, LENDING_POOL_ADDRESS);
    console.log("Current allowance:", ethers.utils.formatUnits(currentAllowance, whbarDecimals));
    
    if (currentAllowance.lt(depositAmount)) {
      console.log("Approving WHBAR for Bonzo Finance...");
      const approveTx = await whbar.approve(LENDING_POOL_ADDRESS, depositAmount, { gasLimit: 300000 });
      const approveReceipt = await approveTx.wait();
      
      if (approveReceipt.status === 1) {
        console.log("✅ WHBAR approved successfully");
        console.log("Approval transaction:", approveReceipt.transactionHash);
      } else {
        throw new Error("WHBAR approval failed");
      }
    } else {
      console.log("✅ Sufficient allowance already exists");
    }
    
    // Step 5: Deposit WHBAR to Bonzo Finance
    console.log("\n=== Step 5: Depositing to Bonzo Finance ===");
    console.log("Depositing", ethers.utils.formatUnits(depositAmount, whbarDecimals), "WHBAR...");
    
    const depositTx = await lendingPool.deposit(
      WHBAR_ADDRESS,
      depositAmount,
      myAddress,
      0, // referralCode
      { gasLimit: 500000 }
    );
    
    console.log("Transaction submitted:", depositTx.hash);
    console.log("Waiting for confirmation...");
    
    const depositReceipt = await depositTx.wait();
    
    if (depositReceipt.status === 1) {
      console.log("\n🎉 SUCCESS! WHBAR deposited to Bonzo Finance!");
      console.log("Deposit transaction:", depositReceipt.transactionHash);
      
      // Step 6: Verify deposit success
      console.log("\n=== Step 6: Verifying Deposit ===");
      
      // Check updated WHBAR balance
      const newWhbarBalance = await whbar.balanceOf(myAddress);
      console.log("Remaining WHBAR:", ethers.utils.formatUnits(newWhbarBalance, whbarDecimals));
      
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
      
      console.log("\n📊 Lending Position:");
      console.log("aToken:", aTokenName, "(", aTokenSymbol, ")");
      console.log("aToken balance:", ethers.utils.formatUnits(aTokenBalance, whbarDecimals));
      console.log("aToken address:", reserveData.aTokenAddress);
      
      console.log("\n✅ HBAR successfully deposited into Bonzo Finance for lending!");
      console.log("💰 You are now earning interest on your HBAR");
      console.log("🔄 You can withdraw anytime using the aTokens");
      
    } else {
      console.log("❌ Deposit transaction failed");
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    if (error.message.includes("UNPREDICTABLE_GAS_LIMIT")) {
      console.log("\n💡 The transaction would fail. Possible reasons:");
      console.log("   - Insufficient WHBAR balance");
      console.log("   - Insufficient allowance");
      console.log("   - Lending pool is paused");
    } else if (error.message.includes("CALL_EXCEPTION")) {
      console.log("\n💡 Contract call failed. Possible reasons:");
      console.log("   - Network issues");
      console.log("   - Contract state changes");
      console.log("   - Check transaction on HashScan for details");
    }
    
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Ensure you have WHBAR in your wallet");
    console.log("2. Check network connectivity");
    console.log("3. Try with a smaller amount");
    console.log("4. Visit Bonzo Finance UI: https://testnet.bonzo.finance/");
  }
}

// Additional helper function to check if user has any supported tokens
async function checkSupportedTokenBalances() {
  console.log("\n=== Checking All Supported Token Balances ===");
  
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  
  const supportedTokens = [
    { address: "0x000000000000000000000000000000000015a59b", symbol: "XSAUCE" },
    { address: "0x0000000000000000000000000000000000001549", symbol: "USDC" },
    { address: "0x00000000000000000000000000000000003991eD", symbol: "KARATE" },
    { address: "0x0000000000000000000000000000000000220cED", symbol: "HBARX" },
    { address: "0x0000000000000000000000000000000000120f46", symbol: "SAUCE" },
    { address: "0x0000000000000000000000000000000000003aD2", symbol: "WHBAR" }
  ];
  
  const erc20ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
  
  for (const token of supportedTokens) {
    try {
      const contract = new ethers.Contract(token.address, erc20ABI, signer);
      const balance = await contract.balanceOf(myAddress);
      const decimals = await contract.decimals();
      
      if (balance.gt(0)) {
        console.log(`✅ ${token.symbol}: ${ethers.utils.formatUnits(balance, decimals)}`);
      } else {
        console.log(`⚪ ${token.symbol}: 0.0`);
      }
    } catch (error) {
      console.log(`❌ ${token.symbol}: Error reading balance`);
    }
  }
}

main()
  .then(() => {
    console.log("\n=== Additional Information ===");
    return checkSupportedTokenBalances();
  })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });