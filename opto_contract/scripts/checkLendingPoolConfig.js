const { ethers } = require("hardhat");

async function main() {
  console.log("=== Checking Bonzo Finance Lending Pool Configuration ===");
  
  // Get signer
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log("Using address:", myAddress);
  
  // Contract addresses (using proper checksum)
  const LENDING_POOL_ADDRESS = ethers.utils.getAddress("0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2");
  const WHBAR_ADDRESS = ethers.utils.getAddress("0xb1F616b8134F602c3Bb465fB5b5e6565cCAd37Ed");
  const ADDRESSES_PROVIDER = ethers.utils.getAddress("0x16197Ef10F26De77C9873d075f8774BdEc20A75d");
  
  // ABIs
  const lendingPoolABI = [
    "function getReserveData(address asset) view returns (tuple(tuple(uint256 data) configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))",
    "function getConfiguration(address asset) view returns (tuple(uint256 data))",
    "function paused() view returns (bool)",
    "function getReservesList() view returns (address[])"
  ];
  
  const whbarABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
  ];
  
  try {
    // Connect to contracts
    const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, lendingPoolABI, signer);
    const whbar = new ethers.Contract(WHBAR_ADDRESS, whbarABI, signer);
    
    console.log("\n=== WHBAR Token Information ===");
    const whbarName = await whbar.name();
    const whbarSymbol = await whbar.symbol();
    const whbarDecimals = await whbar.decimals();
    const whbarBalance = await whbar.balanceOf(myAddress);
    const whbarAllowance = await whbar.allowance(myAddress, LENDING_POOL_ADDRESS);
    
    console.log("WHBAR Name:", whbarName);
    console.log("WHBAR Symbol:", whbarSymbol);
    console.log("WHBAR Decimals:", whbarDecimals);
    console.log("WHBAR Balance:", ethers.utils.formatUnits(whbarBalance, whbarDecimals));
    console.log("WHBAR Allowance:", ethers.utils.formatUnits(whbarAllowance, whbarDecimals));
    
    console.log("\n=== Lending Pool Information ===");
    
    // Check if lending pool is paused
    try {
      const isPaused = await lendingPool.paused();
      console.log("Lending Pool Paused:", isPaused);
    } catch (error) {
      console.log("Could not check paused status:", error.message);
    }
    
    // Get reserves list
    try {
      const reservesList = await lendingPool.getReservesList();
      console.log("Number of reserves:", reservesList.length);
      console.log("Reserves list:", reservesList);
      
      // Check if WHBAR is in the reserves list
      const whbarInReserves = reservesList.some(addr => 
        addr.toLowerCase() === WHBAR_ADDRESS.toLowerCase()
      );
      console.log("WHBAR in reserves:", whbarInReserves);
      
    } catch (error) {
      console.log("Could not get reserves list:", error.message);
    }
    
    // Get WHBAR reserve data
    try {
      console.log("\n=== WHBAR Reserve Configuration ===");
      const reserveData = await lendingPool.getReserveData(WHBAR_ADDRESS);
      console.log("Reserve Data:", {
        liquidityIndex: reserveData.liquidityIndex.toString(),
        variableBorrowIndex: reserveData.variableBorrowIndex.toString(),
        currentLiquidityRate: reserveData.currentLiquidityRate.toString(),
        currentVariableBorrowRate: reserveData.currentVariableBorrowRate.toString(),
        aTokenAddress: reserveData.aTokenAddress,
        id: reserveData.id
      });
      
      // Check configuration
      const config = await lendingPool.getConfiguration(WHBAR_ADDRESS);
      console.log("Configuration data:", config.data.toString());
      
    } catch (error) {
      console.log("Error getting WHBAR reserve data:", error.message);
      console.log("This might indicate WHBAR is not supported as a reserve");
    }
    
    // Test a small deposit call (without sending)
    console.log("\n=== Testing Deposit Call ===");
    try {
      const depositAmount = ethers.utils.parseUnits("0.1", 8); // 0.1 WHBAR
      
      // Estimate gas for deposit
      const gasEstimate = await lendingPool.estimateGas.deposit(
        WHBAR_ADDRESS,
        depositAmount,
        myAddress,
        0 // referralCode
      );
      console.log("Gas estimate for deposit:", gasEstimate.toString());
      
    } catch (error) {
      console.log("Error estimating gas for deposit:");
      console.log("Error message:", error.message);
      
      if (error.reason) {
        console.log("Error reason:", error.reason);
      }
      
      if (error.data) {
        console.log("Error data:", error.data);
      }
    }
    
  } catch (error) {
    console.error("Error during configuration check:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });