const { ethers } = require("hardhat");

/**
 * Automated HBAR to USDC Swap and Bonzo Finance Deposit
 * This script performs the complete workflow programmatically:
 * 1. Swap HBAR for USDC using SaucerSwap router
 * 2. Deposit USDC to Bonzo Finance for lending
 */

async function main() {
  console.log("=== Automated HBAR → USDC Swap & Bonzo Finance Deposit ===");
  
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log("Wallet address:", myAddress);
  
  // Contract addresses
  const SAUCERSWAP_ROUTER = ethers.utils.getAddress("0x00000000000000000000000000000000001004E7"); // SaucerSwap V2 Router
  const LENDING_POOL_ADDRESS = ethers.utils.getAddress("0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2");
  const USDC_ADDRESS = ethers.utils.getAddress("0x0000000000000000000000000000000000001549");
  const WHBAR_ADDRESS = ethers.utils.getAddress("0x0000000000000000000000000000000000003aD2");
  
  // Check initial balances
  const initialHbarBalance = await signer.getBalance();
  console.log("Initial HBAR balance:", ethers.utils.formatEther(initialHbarBalance), "HBAR");
  
  // SaucerSwap Router ABI (simplified)
  const routerABI = [
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
    "function WHBAR() external pure returns (address)"
  ];
  
  // USDC contract ABI
  const usdcABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];
  
  // Lending Pool ABI
  const lendingPoolABI = [
    "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)"
  ];
  
  const router = new ethers.Contract(SAUCERSWAP_ROUTER, routerABI, signer);
  const usdc = new ethers.Contract(USDC_ADDRESS, usdcABI, signer);
  const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, lendingPoolABI, signer);
  
  try {
    // Step 1: Check initial USDC balance
    console.log("\n=== Step 1: Initial Token Status ===");
    const initialUsdcBalance = await usdc.balanceOf(myAddress);
    const usdcDecimals = await usdc.decimals();
    console.log("Initial USDC balance:", ethers.utils.formatUnits(initialUsdcBalance, usdcDecimals), "USDC");
    
    // Step 2: Set up swap parameters
    console.log("\n=== Step 2: Setting Up HBAR → USDC Swap ===");
    const swapAmountHBAR = "10.0"; // Swap 10 HBAR for USDC
    const swapAmountWei = ethers.utils.parseEther(swapAmountHBAR);
    
    console.log("Swapping:", swapAmountHBAR, "HBAR for USDC");
    
    // Define swap path: HBAR → WHBAR → USDC
    const swapPath = [WHBAR_ADDRESS, USDC_ADDRESS];
    
    // Get expected output amount
    console.log("Getting swap quote...");
    const amountsOut = await router.getAmountsOut(swapAmountWei, swapPath);
    const expectedUsdcOut = amountsOut[1];
    const minUsdcOut = expectedUsdcOut.mul(95).div(100); // 5% slippage tolerance
    
    console.log("Expected USDC output:", ethers.utils.formatUnits(expectedUsdcOut, usdcDecimals), "USDC");
    console.log("Minimum USDC output (5% slippage):", ethers.utils.formatUnits(minUsdcOut, usdcDecimals), "USDC");
    
    // Step 3: Execute the swap
    console.log("\n=== Step 3: Executing HBAR → USDC Swap ===");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
    
    console.log("Submitting swap transaction...");
    const swapTx = await router.swapExactETHForTokens(
      minUsdcOut,
      swapPath,
      myAddress,
      deadline,
      {
        value: swapAmountWei,
        gasLimit: 500000
      }
    );
    
    console.log("Swap transaction submitted:", swapTx.hash);
    console.log("Waiting for confirmation...");
    
    const swapReceipt = await swapTx.wait();
    
    if (swapReceipt.status === 1) {
      console.log("✅ Swap successful!");
      console.log("Swap transaction:", swapReceipt.transactionHash);
      
      // Check new USDC balance
      const newUsdcBalance = await usdc.balanceOf(myAddress);
      const usdcReceived = newUsdcBalance.sub(initialUsdcBalance);
      
      console.log("USDC received:", ethers.utils.formatUnits(usdcReceived, usdcDecimals), "USDC");
      console.log("New USDC balance:", ethers.utils.formatUnits(newUsdcBalance, usdcDecimals), "USDC");
      
      // Step 4: Deposit USDC to Bonzo Finance
      console.log("\n=== Step 4: Depositing USDC to Bonzo Finance ===");
      
      if (usdcReceived.gt(0)) {
        // Deposit 90% of received USDC (keep some for potential fees)
        const depositAmount = usdcReceived.mul(90).div(100);
        console.log("Depositing:", ethers.utils.formatUnits(depositAmount, usdcDecimals), "USDC to Bonzo Finance");
        
        // Approve USDC for lending pool
        console.log("Approving USDC for Bonzo Finance...");
        const approveTx = await usdc.approve(LENDING_POOL_ADDRESS, depositAmount, { gasLimit: 300000 });
        await approveTx.wait();
        console.log("✅ USDC approved");
        
        // Deposit to Bonzo Finance
        console.log("Depositing to Bonzo Finance...");
        const depositTx = await lendingPool.deposit(
          USDC_ADDRESS,
          depositAmount,
          myAddress,
          0, // referralCode
          { gasLimit: 500000 }
        );
        
        const depositReceipt = await depositTx.wait();
        
        if (depositReceipt.status === 1) {
          console.log("\n🎉 COMPLETE SUCCESS! 🎉");
          console.log("✅ Swapped", swapAmountHBAR, "HBAR for", ethers.utils.formatUnits(usdcReceived, usdcDecimals), "USDC");
          console.log("✅ Deposited", ethers.utils.formatUnits(depositAmount, usdcDecimals), "USDC to Bonzo Finance");
          console.log("\n📋 Transaction Details:");
          console.log("Swap TX:", swapReceipt.transactionHash);
          console.log("Deposit TX:", depositReceipt.transactionHash);
          console.log("\n💰 You are now earning interest on your USDC!");
          console.log("🌐 View on HashScan: https://hashscan.io/testnet/transaction/" + depositReceipt.transactionHash);
          console.log("🏦 Monitor position: https://testnet.bonzo.finance/");
          
        } else {
          console.log("❌ Deposit to Bonzo Finance failed");
        }
      } else {
        console.log("❌ No USDC received from swap");
      }
      
    } else {
      console.log("❌ Swap transaction failed");
    }
    
    // Final balance check
    console.log("\n=== Final Balances ===");
    const finalHbarBalance = await signer.getBalance();
    const finalUsdcBalance = await usdc.balanceOf(myAddress);
    
    console.log("Final HBAR balance:", ethers.utils.formatEther(finalHbarBalance), "HBAR");
    console.log("Final USDC balance:", ethers.utils.formatUnits(finalUsdcBalance, usdcDecimals), "USDC");
    console.log("HBAR used:", ethers.utils.formatEther(initialHbarBalance.sub(finalHbarBalance)), "HBAR");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    if (error.message.includes("UNPREDICTABLE_GAS_LIMIT")) {
      console.log("\n💡 Transaction would fail. Possible reasons:");
      console.log("   - Insufficient HBAR balance");
      console.log("   - Slippage too high");
      console.log("   - Liquidity issues");
    } else if (error.message.includes("CALL_EXCEPTION")) {
      console.log("\n💡 Contract call failed. Possible reasons:");
      console.log("   - Router contract address incorrect");
      console.log("   - Swap path invalid");
      console.log("   - Deadline expired");
    } else if (error.message.includes("ENOTFOUND")) {
      console.log("\n🌐 Network connectivity issue");
      console.log("   - Check internet connection");
      console.log("   - Try again in a few moments");
    }
    
    console.log("\n🔧 Fallback Options:");
    console.log("1. 🌐 Use SaucerSwap UI manually: https://testnet.saucerswap.finance/");
    console.log("2. 🔄 Try with a smaller HBAR amount");
    console.log("3. 📞 Check SaucerSwap documentation for correct router address");
    console.log("4. 🏦 Deposit existing tokens directly to Bonzo Finance");
  }
}

// Helper function to check if SaucerSwap router is accessible
async function checkSaucerSwapRouter() {
  console.log("\n=== Checking SaucerSwap Router ===");
  
  const [signer] = await ethers.getSigners();
  const SAUCERSWAP_ROUTER = "0x00000000000000000000000000000000001004E7";
  
  try {
    const code = await signer.provider.getCode(SAUCERSWAP_ROUTER);
    console.log("Router has code:", code !== "0x");
    
    if (code === "0x") {
      console.log("⚠️  Router address may be incorrect or not deployed");
      console.log("🔍 Please verify the correct SaucerSwap V2 router address for Hedera testnet");
    } else {
      console.log("✅ Router contract found");
    }
  } catch (error) {
    console.log("❌ Error checking router:", error.message);
  }
}

main()
  .then(() => {
    console.log("\n=== Additional Checks ===");
    return checkSaucerSwapRouter();
  })
  .then(() => {
    console.log("\n=== Summary ===");
    console.log("This script automates the complete workflow:");
    console.log("1. 💱 HBAR → USDC swap via SaucerSwap router");
    console.log("2. 🏦 USDC deposit to Bonzo Finance");
    console.log("3. 💰 Start earning interest automatically");
    console.log("\nIf automated swap fails, use SaucerSwap UI as fallback.");
  })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });