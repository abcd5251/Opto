const { ethers } = require("hardhat");

/**
 * Quick USDC Deposit to Bonzo Finance
 * Run this after swapping HBAR for USDC on SaucerSwap
 */

async function main() {
  console.log("=== Quick USDC Deposit to Bonzo Finance ===");
  
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log("Wallet address:", myAddress);
  
  // Contract addresses
  const LENDING_POOL_ADDRESS = ethers.utils.getAddress("0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2");
  const USDC_ADDRESS = ethers.utils.getAddress("0x0000000000000000000000000000000000001549");
  
  // Contract ABIs
  const usdcABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];
  
  const lendingPoolABI = [
    "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)"
  ];
  
  const usdc = new ethers.Contract(USDC_ADDRESS, usdcABI, signer);
  const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, lendingPoolABI, signer);
  
  try {
    // Check USDC balance
    const usdcBalance = await usdc.balanceOf(myAddress);
    const usdcDecimals = await usdc.decimals();
    const usdcSymbol = await usdc.symbol();
    
    console.log("\n💰 Current USDC balance:", ethers.utils.formatUnits(usdcBalance, usdcDecimals), usdcSymbol);
    
    if (usdcBalance.eq(0)) {
      console.log("\n❌ No USDC found. Please complete the SaucerSwap first:");
      console.log("🌐 Visit: https://testnet.saucerswap.finance/");
      console.log("💱 Swap HBAR → USDC");
      console.log("🔄 Then run this script again");
      return;
    }
    
    // Deposit 80% of USDC balance (keep some for gas/fees)
    const depositAmount = usdcBalance.mul(80).div(100);
    console.log("📥 Depositing:", ethers.utils.formatUnits(depositAmount, usdcDecimals), usdcSymbol);
    
    // Check and approve if needed
    const currentAllowance = await usdc.allowance(myAddress, LENDING_POOL_ADDRESS);
    
    if (currentAllowance.lt(depositAmount)) {
      console.log("\n🔐 Approving USDC...");
      const approveTx = await usdc.approve(LENDING_POOL_ADDRESS, depositAmount, { gasLimit: 300000 });
      await approveTx.wait();
      console.log("✅ Approved!");
    }
    
    // Deposit to Bonzo Finance
    console.log("\n🏦 Depositing to Bonzo Finance...");
    const depositTx = await lendingPool.deposit(
      USDC_ADDRESS,
      depositAmount,
      myAddress,
      0,
      { gasLimit: 500000 }
    );
    
    const receipt = await depositTx.wait();
    
    if (receipt.status === 1) {
      console.log("\n🎉 SUCCESS!");
      console.log("💰 Deposited:", ethers.utils.formatUnits(depositAmount, usdcDecimals), "USDC");
      console.log("📋 Transaction:", receipt.transactionHash);
      console.log("🌐 View on HashScan: https://hashscan.io/testnet/transaction/" + receipt.transactionHash);
      console.log("\n✨ You're now earning interest on your USDC in Bonzo Finance!");
    } else {
      console.log("❌ Deposit failed");
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    if (error.message.includes("ENOTFOUND")) {
      console.log("\n🌐 Network issue - please try again in a moment");
    } else {
      console.log("\n🔧 Try visiting Bonzo Finance directly: https://testnet.bonzo.finance/");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });