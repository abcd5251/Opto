const { ethers } = require("hardhat");

/**
 * Comprehensive HBAR Deposit Script for Bonzo Finance
 * 
 * This script attempts multiple approaches to deposit HBAR into Bonzo Finance:
 * 1. Direct WHBAR deposit (if supported)
 * 2. Alternative supported tokens via SaucerSwap
 * 3. Check for updated reserve configurations
 */

async function main() {
  console.log("=== Bonzo Finance HBAR Deposit - Comprehensive Approach ===");
  
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log("Using address:", myAddress);
  
  // Contract addresses
  const LENDING_POOL_ADDRESS = ethers.utils.getAddress("0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2");
  const WHBAR_ADDRESS = ethers.utils.getAddress("0xb1F616b8134F602c3Bb465fB5b5e6565cCAd37Ed");
  const ADDRESSES_PROVIDER = ethers.utils.getAddress("0x16197Ef10F26De77C9873d075f8774BdEc20A75d");
  
  // Check current balances
  const hbarBalance = await signer.getBalance();
  console.log("HBAR balance:", ethers.utils.formatEther(hbarBalance), "HBAR");
  
  // WHBAR contract
  const whbarABI = [
    "function deposit() payable",
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
  ];
  
  // Lending Pool ABI
  const lendingPoolABI = [
    "function getReservesList() view returns (address[])",
    "function getReserveData(address asset) view returns (tuple(tuple(uint256 data) configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))",
    "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)"
  ];
  
  const whbar = new ethers.Contract(WHBAR_ADDRESS, whbarABI, signer);
  const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, lendingPoolABI, signer);
  
  try {
    // Step 1: Check current WHBAR balance
    console.log("\n=== Step 1: Checking WHBAR Status ===");
    const whbarBalance = await whbar.balanceOf(myAddress);
    const whbarDecimals = await whbar.decimals();
    console.log("Current WHBAR balance:", ethers.utils.formatUnits(whbarBalance, whbarDecimals), "WHBAR");
    
    // Step 2: Check if WHBAR is now supported in reserves
    console.log("\n=== Step 2: Checking Reserve Support ===");
    const reservesList = await lendingPool.getReservesList();
    console.log("Total reserves:", reservesList.length);
    
    const whbarSupported = reservesList.some(addr => 
      addr.toLowerCase() === WHBAR_ADDRESS.toLowerCase()
    );
    console.log("WHBAR supported:", whbarSupported);
    
    if (whbarSupported) {
      console.log("✅ WHBAR is now supported! Proceeding with deposit...");
      await depositWHBAR(whbar, lendingPool, myAddress, whbarDecimals);
    } else {
      console.log("❌ WHBAR still not supported. Checking alternatives...");
      await checkAlternatives(reservesList, signer, myAddress);
    }
    
  } catch (error) {
    console.error("Error in main process:", error.message);
    
    // Provide guidance based on error
    if (error.message.includes("UNPREDICTABLE_GAS_LIMIT")) {
      console.log("\n💡 Suggestion: The transaction would fail. This likely means WHBAR is still not supported.");
    } else if (error.message.includes("CALL_EXCEPTION")) {
      console.log("\n💡 Suggestion: Contract call failed. Check if the lending pool configuration has changed.");
    }
    
    console.log("\n=== Alternative Solutions ===");
    console.log("1. 🔄 Use SaucerSwap to convert HBAR to supported tokens:");
    console.log("   - USDC, SAUCE, XSAUCE, HBARX, KARATE");
    console.log("   - Visit: https://testnet.saucerswap.finance/");
    console.log("\n2. 📞 Contact Bonzo Finance for WHBAR support:");
    console.log("   - Discord: https://discord.gg/bonzofinance");
    console.log("   - Request WHBAR as a reserve asset");
    console.log("\n3. 🌐 Try Bonzo Finance mainnet:");
    console.log("   - Mainnet may have broader token support");
    console.log("   - Check: https://bonzo.finance/");
  }
}

async function depositWHBAR(whbar, lendingPool, myAddress, whbarDecimals) {
  const depositAmount = "1.0"; // 1 HBAR worth
  const amountInTinybars = ethers.utils.parseUnits(depositAmount, whbarDecimals);
  const valueInWei = ethers.utils.parseEther(depositAmount);
  
  console.log("\n=== WHBAR Deposit Process ===");
  
  // Check if we need to wrap more HBAR
  const currentBalance = await whbar.balanceOf(myAddress);
  if (currentBalance.lt(amountInTinybars)) {
    const neededAmount = amountInTinybars.sub(currentBalance);
    const neededHBAR = ethers.utils.formatUnits(neededAmount, whbarDecimals);
    
    console.log("Wrapping", neededHBAR, "HBAR to WHBAR...");
    const wrapTx = await whbar.deposit({ 
      value: ethers.utils.parseEther(neededHBAR), 
      gasLimit: 300000 
    });
    await wrapTx.wait();
    console.log("✅ HBAR wrapped successfully");
  }
  
  // Approve lending pool
  console.log("Approving WHBAR for lending pool...");
  const approveTx = await whbar.approve(lendingPool.address, amountInTinybars, { gasLimit: 300000 });
  await approveTx.wait();
  console.log("✅ WHBAR approved successfully");
  
  // Deposit to lending pool
  console.log("Depositing WHBAR to Bonzo Finance...");
  const depositTx = await lendingPool.deposit(
    whbar.address,
    amountInTinybars,
    myAddress,
    0, // referralCode
    { gasLimit: 500000 }
  );
  
  const receipt = await depositTx.wait();
  
  if (receipt.status === 1) {
    console.log("🎉 Successfully deposited", depositAmount, "WHBAR to Bonzo Finance!");
    console.log("Transaction hash:", receipt.transactionHash);
  } else {
    console.log("❌ Deposit transaction failed");
  }
}

async function checkAlternatives(reservesList, signer, myAddress) {
  console.log("\n=== Checking Alternative Supported Tokens ===");
  
  const erc20ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)"
  ];
  
  console.log("Supported tokens in Bonzo Finance:");
  
  for (let i = 0; i < Math.min(reservesList.length, 10); i++) {
    try {
      const tokenAddress = reservesList[i];
      const token = new ethers.Contract(tokenAddress, erc20ABI, signer);
      
      const symbol = await token.symbol();
      const name = await token.name();
      const decimals = await token.decimals();
      const balance = await token.balanceOf(myAddress);
      
      console.log(`${i + 1}. ${symbol} (${name})`);
      console.log(`   Address: ${tokenAddress}`);
      console.log(`   Your balance: ${ethers.utils.formatUnits(balance, decimals)}`);
      console.log("");
      
    } catch (error) {
      console.log(`${i + 1}. Token at ${reservesList[i]} - Could not read info`);
    }
  }
  
  console.log("\n💡 To deposit HBAR-equivalent value:");
  console.log("1. Visit SaucerSwap testnet: https://testnet.saucerswap.finance/");
  console.log("2. Swap HBAR for any of the supported tokens above");
  console.log("3. Return to Bonzo Finance and deposit the swapped tokens");
  console.log("4. This achieves the same economic effect as depositing HBAR");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });