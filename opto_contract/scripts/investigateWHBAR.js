const { ethers } = require("hardhat");

/**
 * Investigate the actual WHBAR contract interface
 * to understand how to properly wrap HBAR
 */

async function main() {
  console.log("=== Investigating WHBAR Contract Interface ===");
  
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log("Using address:", myAddress);
  
  // The WHBAR address from Bonzo Finance reserves
  const WHBAR_ADDRESS = "0x0000000000000000000000000000000000003aD2";
  
  // Basic ERC20 functions that should work
  const basicABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function transfer(address,uint256) returns (bool)"
  ];
  
  const whbar = new ethers.Contract(WHBAR_ADDRESS, basicABI, signer);
  
  try {
    console.log("\n=== Basic Token Information ===");
    const name = await whbar.name();
    const symbol = await whbar.symbol();
    const decimals = await whbar.decimals();
    const totalSupply = await whbar.totalSupply();
    const balance = await whbar.balanceOf(myAddress);
    
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Decimals:", decimals);
    console.log("Total Supply:", ethers.utils.formatUnits(totalSupply, decimals));
    console.log("Your Balance:", ethers.utils.formatUnits(balance, decimals));
    
  } catch (error) {
    console.error("Error reading basic token info:", error.message);
  }
  
  // Try to get the contract code to understand its interface
  try {
    console.log("\n=== Contract Code Analysis ===");
    const code = await signer.provider.getCode(WHBAR_ADDRESS);
    console.log("Contract has code:", code !== "0x");
    console.log("Code length:", code.length, "characters");
    
    if (code === "0x") {
      console.log("⚠️  This address has no contract code - it might be an HTS token");
      console.log("HTS tokens on Hedera use native token operations, not ERC20 contracts");
    }
    
  } catch (error) {
    console.error("Error reading contract code:", error.message);
  }
  
  // Check if this is an HTS token by trying Hedera-specific operations
  console.log("\n=== HTS Token Investigation ===");
  console.log("Address format suggests this is an HTS (Hedera Token Service) token");
  console.log("HTS tokens use different mechanics than standard ERC20 tokens");
  
  // For HTS tokens, we need to check if there's a wrapper contract
  console.log("\n=== Looking for HBAR Wrapper Solutions ===");
  
  // Check if we can find any HBAR in our account that we can use directly
  const hbarBalance = await signer.getBalance();
  console.log("Current HBAR balance:", ethers.utils.formatEther(hbarBalance), "HBAR");
  
  // Suggest alternative approaches
  console.log("\n=== Alternative Approaches ===");
  console.log("1. 🔄 Use SaucerSwap to get WHBAR:");
  console.log("   - Visit: https://testnet.saucerswap.finance/");
  console.log("   - Swap HBAR directly for WHBAR");
  console.log("   - This bypasses the need for a wrapper contract");
  
  console.log("\n2. 🏦 Use other supported tokens:");
  console.log("   - USDC, SAUCE, XSAUCE, HBARX, KARATE are all supported");
  console.log("   - Swap HBAR for any of these on SaucerSwap");
  console.log("   - Deposit the swapped tokens to Bonzo Finance");
  
  console.log("\n3. 🔍 Check for official WHBAR wrapper:");
  console.log("   - Look for official Hedera WHBAR wrapper documentation");
  console.log("   - The wrapper might be at a different address");
  
  // Try to see if we can transfer some existing WHBAR to test
  try {
    const currentBalance = await whbar.balanceOf(myAddress);
    if (currentBalance.gt(0)) {
      console.log("\n=== Testing WHBAR Transfer ===");
      console.log("You have", ethers.utils.formatUnits(currentBalance, 8), "WHBAR");
      console.log("This confirms the token works as an ERC20 token");
      
      // Test if we can approve it for the lending pool
      const LENDING_POOL_ADDRESS = "0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2";
      console.log("\n=== Testing WHBAR Approval ===");
      
      const allowance = await whbar.allowance(myAddress, LENDING_POOL_ADDRESS);
      console.log("Current allowance:", ethers.utils.formatUnits(allowance, 8));
      
      if (allowance.eq(0)) {
        console.log("Attempting to approve 0.1 WHBAR for testing...");
        const approveAmount = ethers.utils.parseUnits("0.1", 8);
        
        try {
          const approveTx = await whbar.approve(LENDING_POOL_ADDRESS, approveAmount, { gasLimit: 300000 });
          const receipt = await approveTx.wait();
          
          if (receipt.status === 1) {
            console.log("✅ WHBAR approval successful!");
            console.log("This means WHBAR can be used with Bonzo Finance");
            console.log("The issue is just getting HBAR wrapped to WHBAR");
          }
        } catch (error) {
          console.log("❌ WHBAR approval failed:", error.message);
        }
      } else {
        console.log("✅ WHBAR already has allowance - it works with Bonzo Finance");
      }
    }
  } catch (error) {
    console.log("Could not test WHBAR operations:", error.message);
  }
  
  console.log("\n=== Conclusion ===");
  console.log("The WHBAR token at", WHBAR_ADDRESS, "is supported by Bonzo Finance");
  console.log("The challenge is converting HBAR to WHBAR");
  console.log("Recommended solution: Use SaucerSwap to swap HBAR for WHBAR");
  console.log("Then deposit the WHBAR directly to Bonzo Finance");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });