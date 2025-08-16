const { ethers } = require("hardhat");

async function main() {
  console.log("=== Checking Supported Tokens in Bonzo Finance ===");
  
  // Get signer
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log("Using address:", myAddress);
  
  // Contract addresses
  const LENDING_POOL_ADDRESS = ethers.utils.getAddress("0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2");
  
  // Lending Pool ABI
  const lendingPoolABI = [
    "function getReservesList() view returns (address[])",
    "function getReserveData(address asset) view returns (tuple(tuple(uint256 data) configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))"
  ];
  
  // Generic ERC20 ABI for token info
  const erc20ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)"
  ];
  
  try {
    const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, lendingPoolABI, signer);
    
    // Get all supported reserves
    const reservesList = await lendingPool.getReservesList();
    console.log("\nSupported reserves:", reservesList.length);
    
    for (let i = 0; i < reservesList.length; i++) {
      const reserveAddress = reservesList[i];
      console.log("\n=== Reserve", i + 1, "===");
      console.log("Address:", reserveAddress);
      
      try {
        // Try to get token information
        const token = new ethers.Contract(reserveAddress, erc20ABI, signer);
        
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        const balance = await token.balanceOf(myAddress);
        
        console.log("Name:", name);
        console.log("Symbol:", symbol);
        console.log("Decimals:", decimals);
        console.log("Your balance:", ethers.utils.formatUnits(balance, decimals));
        
        // Get reserve data
        const reserveData = await lendingPool.getReserveData(reserveAddress);
        console.log("aToken address:", reserveData.aTokenAddress);
        console.log("Liquidity index:", reserveData.liquidityIndex.toString());
        console.log("Active (non-zero liquidity index):", !reserveData.liquidityIndex.isZero());
        
      } catch (error) {
        console.log("Error getting token info:", error.message);
        
        // Try to get reserve data anyway
        try {
          const reserveData = await lendingPool.getReserveData(reserveAddress);
          console.log("aToken address:", reserveData.aTokenAddress);
          console.log("Reserve ID:", reserveData.id);
        } catch (reserveError) {
          console.log("Error getting reserve data:", reserveError.message);
        }
      }
    }
    
    // Check if any of these might be WHBAR with different address format
    console.log("\n=== Checking for WHBAR-like tokens ===");
    const WHBAR_ADDRESS = ethers.utils.getAddress("0xb1F616b8134F602c3Bb465fB5b5e6565cCAd37Ed");
    console.log("Expected WHBAR address:", WHBAR_ADDRESS);
    
    for (const reserveAddress of reservesList) {
      try {
        const token = new ethers.Contract(reserveAddress, erc20ABI, signer);
        const symbol = await token.symbol();
        const name = await token.name();
        
        if (symbol.toLowerCase().includes('hbar') || 
            symbol.toLowerCase().includes('whbar') ||
            name.toLowerCase().includes('wrapped hbar')) {
          console.log("Found HBAR-related token:");
          console.log("  Address:", reserveAddress);
          console.log("  Symbol:", symbol);
          console.log("  Name:", name);
        }
      } catch (error) {
        // Skip tokens that can't be read
      }
    }
    
  } catch (error) {
    console.error("Error during token check:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });