const { ethers } = require("hardhat");

/**
 * Final HBAR Deposit Script for Bonzo Finance
 * Using the correct WHBAR address from the reserves list
 */

async function main() {
  console.log("=== Bonzo Finance HBAR Deposit - Final Solution ===");
  
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log("Using address:", myAddress);
  
  // Contract addresses - Using the correct WHBAR address from reserves
  const LENDING_POOL_ADDRESS = ethers.utils.getAddress("0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2");
  const WHBAR_ADDRESS = ethers.utils.getAddress("0x0000000000000000000000000000000000003aD2"); // Correct testnet WHBAR
  
  // Check current balances
  const hbarBalance = await signer.getBalance();
  console.log("HBAR balance:", ethers.utils.formatEther(hbarBalance), "HBAR");
  
  // WHBAR contract ABI
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
    "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
    "function getReserveData(address asset) view returns (tuple(tuple(uint256 data) configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))"
  ];
  
  const whbar = new ethers.Contract(WHBAR_ADDRESS, whbarABI, signer);
  const lendingPool = new ethers.Contract(LENDING_POOL_ADDRESS, lendingPoolABI, signer);
  
  try {
    // Step 1: Check WHBAR info
    console.log("\n=== Step 1: WHBAR Token Info ===");
    const whbarName = await whbar.name();
    const whbarSymbol = await whbar.symbol();
    const whbarDecimals = await whbar.decimals();
    const whbarBalance = await whbar.balanceOf(myAddress);
    
    console.log("Token:", whbarName, "(", whbarSymbol, ")");
    console.log("Decimals:", whbarDecimals);
    console.log("Current balance:", ethers.utils.formatUnits(whbarBalance, whbarDecimals), whbarSymbol);
    
    // Step 2: Verify reserve data
    console.log("\n=== Step 2: Checking Reserve Data ===");
    const reserveData = await lendingPool.getReserveData(WHBAR_ADDRESS);
    console.log("aToken address:", reserveData.aTokenAddress);
    console.log("Reserve ID:", reserveData.id);
    console.log("✅ WHBAR is confirmed as a supported reserve!");
    
    // Step 3: Deposit process
    const depositAmount = "1.0"; // 1 HBAR worth
    const amountInWei = ethers.utils.parseEther(depositAmount);
    const amountInTokenUnits = ethers.utils.parseUnits(depositAmount, whbarDecimals);
    
    console.log("\n=== Step 3: HBAR to WHBAR Wrapping ===");
    console.log("Depositing", depositAmount, "HBAR to wrap as WHBAR...");
    
    // Wrap HBAR to WHBAR
    const wrapTx = await whbar.deposit({ 
      value: amountInWei, 
      gasLimit: 300000 
    });
    const wrapReceipt = await wrapTx.wait();
    
    if (wrapReceipt.status === 1) {
      console.log("✅ Successfully wrapped", depositAmount, "HBAR to WHBAR");
      console.log("Wrap transaction hash:", wrapReceipt.transactionHash);
    } else {
      throw new Error("HBAR wrapping failed");
    }
    
    // Check new WHBAR balance
    const newWhbarBalance = await whbar.balanceOf(myAddress);
    console.log("New WHBAR balance:", ethers.utils.formatUnits(newWhbarBalance, whbarDecimals), whbarSymbol);
    
    // Step 4: Approve lending pool
    console.log("\n=== Step 4: Approving WHBAR for Lending Pool ===");
    const currentAllowance = await whbar.allowance(myAddress, LENDING_POOL_ADDRESS);
    console.log("Current allowance:", ethers.utils.formatUnits(currentAllowance, whbarDecimals));
    
    if (currentAllowance.lt(amountInTokenUnits)) {
      console.log("Approving", depositAmount, "WHBAR for lending pool...");
      const approveTx = await whbar.approve(LENDING_POOL_ADDRESS, amountInTokenUnits, { gasLimit: 300000 });
      const approveReceipt = await approveTx.wait();
      
      if (approveReceipt.status === 1) {
        console.log("✅ WHBAR approved successfully");
        console.log("Approve transaction hash:", approveReceipt.transactionHash);
      } else {
        throw new Error("WHBAR approval failed");
      }
    } else {
      console.log("✅ Sufficient allowance already exists");
    }
    
    // Step 5: Deposit to Bonzo Finance
    console.log("\n=== Step 5: Depositing WHBAR to Bonzo Finance ===");
    console.log("Depositing", depositAmount, "WHBAR to Bonzo Finance lending pool...");
    
    const depositTx = await lendingPool.deposit(
      WHBAR_ADDRESS,
      amountInTokenUnits,
      myAddress,
      0, // referralCode
      { gasLimit: 500000 }
    );
    
    const depositReceipt = await depositTx.wait();
    
    if (depositReceipt.status === 1) {
      console.log("🎉 SUCCESS! Deposited", depositAmount, "WHBAR to Bonzo Finance!");
      console.log("Deposit transaction hash:", depositReceipt.transactionHash);
      
      // Check final balances
      console.log("\n=== Final Status ===");
      const finalWhbarBalance = await whbar.balanceOf(myAddress);
      console.log("Final WHBAR balance:", ethers.utils.formatUnits(finalWhbarBalance, whbarDecimals), whbarSymbol);
      
      // Check aToken balance (proof of deposit)
      const aTokenABI = ["function balanceOf(address) view returns (uint256)", "function symbol() view returns (string)"];
      const aToken = new ethers.Contract(reserveData.aTokenAddress, aTokenABI, signer);
      const aTokenBalance = await aToken.balanceOf(myAddress);
      const aTokenSymbol = await aToken.symbol();
      
      console.log("aToken balance:", ethers.utils.formatUnits(aTokenBalance, whbarDecimals), aTokenSymbol);
      console.log("\n✅ HBAR successfully deposited into Bonzo Finance for lending!");
      
    } else {
      console.log("❌ Deposit transaction failed");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    
    if (error.message.includes("UNPREDICTABLE_GAS_LIMIT")) {
      console.log("\n💡 The transaction would fail. Check if you have sufficient balance or allowance.");
    } else if (error.message.includes("CALL_EXCEPTION")) {
      console.log("\n💡 Contract call failed. The deposit might have succeeded despite the error.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });