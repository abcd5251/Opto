const { ethers } = require("hardhat");

async function main() {
  console.log('🔄 Automated HBAR to HBARX Swap on SaucerSwap');
  console.log('=' .repeat(55));
  
  // Get signer
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log('📝 Account:', myAddress);
  
  // Token addresses and IDs
  const HBAR_ADDRESS = '0x0000000000000000000000000000000000000000'; // Native HBAR
  const HBARX_TOKEN_ID = '0.0.2231533';
  const HBARX_ADDRESS = '0x0000000000000000000000000000000000220cED';
  
  // SaucerSwap Router address (testnet) - Updated with correct address
  const SAUCERSWAP_ROUTER = '0x0000000000000000000000000000000000004b40'; // 0.0.19264 in hex
  
  // WHBAR address (needed for swaps) - Updated with correct testnet address
  const WHBAR_ADDRESS = '0x0000000000000000000000000000000000003ad1'; // 0.0.15057 in hex
  
  // ABIs
  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
  ];
  
  const WHBAR_ABI = [
    'function deposit() payable',
    'function withdraw(uint256) external',
    'function balanceOf(address) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
  ];
  
  // SaucerSwap Router ABI (simplified)
  const ROUTER_ABI = [
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
    'function WHBAR() external pure returns (address)'
  ];
  
  try {
    // Check current balances
    console.log('\n📊 STEP 1: Checking Current Balances');
    console.log('-' .repeat(40));
    
    const hbarBalance = await signer.getBalance();
    const hbarFormatted = ethers.utils.formatEther(hbarBalance);
    console.log('💰 HBAR Balance:', hbarFormatted, 'HBAR');
    
    const hbarxContract = new ethers.Contract(HBARX_ADDRESS, ERC20_ABI, signer);
    const hbarxBalance = await hbarxContract.balanceOf(myAddress);
    const hbarxDecimals = await hbarxContract.decimals();
    const hbarxFormatted = ethers.utils.formatUnits(hbarxBalance, hbarxDecimals);
    console.log('🔥 HBARX Balance:', hbarxFormatted, 'HBARX');
    
    if (hbarBalance.lt(ethers.utils.parseEther('1'))) {
      console.log('\n❌ Insufficient HBAR balance for swap!');
      console.log('💡 You need at least 1 HBAR to perform a swap');
      return;
    }
    
    // Amount to swap (1 HBAR for testing)
    const swapAmount = ethers.utils.parseEther('1');
    const swapAmountFormatted = ethers.utils.formatEther(swapAmount);
    
    console.log('\n🔄 STEP 2: Preparing HBAR to HBARX Swap');
    console.log('-' .repeat(40));
    console.log('💱 Swap Amount:', swapAmountFormatted, 'HBAR');
    
    // Initialize contracts
    const whbarContract = new ethers.Contract(WHBAR_ADDRESS, WHBAR_ABI, signer);
    const routerContract = new ethers.Contract(SAUCERSWAP_ROUTER, ROUTER_ABI, signer);
    
    // Step 1: Try direct HBAR to HBARX swap first
    console.log('\n📦 STEP 3: Attempting Direct HBAR to HBARX Swap');
    console.log('-' .repeat(40));
    
    // Try direct path: HBAR -> HBARX (using WHBAR as intermediary in path)
    const directPath = [WHBAR_ADDRESS, HBARX_ADDRESS];
    
    try {
      const directAmounts = await routerContract.getAmountsOut(swapAmount, directPath);
      const expectedHBARX = directAmounts[1];
      const minHBARX = expectedHBARX.mul(95).div(100); // 5% slippage
      
      console.log('💱 Attempting direct HBAR to HBARX swap...');
      const deadline = Math.floor(Date.now() / 1000) + 1800;
      
      const directSwapTx = await routerContract.swapExactETHForTokens(
        minHBARX,
        directPath,
        myAddress,
        deadline,
        { value: swapAmount, gasLimit: 500000 }
      );
      
      console.log('⏳ Direct HBAR to HBARX swap transaction:', directSwapTx.hash);
      await directSwapTx.wait();
      console.log('✅ Direct HBAR to HBARX swap completed successfully!');
      
      // Check final balances and exit early
      const finalHbarxBalance = await hbarxContract.balanceOf(myAddress);
      const finalHbarxFormatted = ethers.utils.formatUnits(finalHbarxBalance, hbarxDecimals);
      const hbarxGained = finalHbarxBalance.sub(hbarxBalance);
      const hbarxGainedFormatted = ethers.utils.formatUnits(hbarxGained, hbarxDecimals);
      
      console.log('\n🎉 Direct Swap Summary:');
      console.log('   HBAR Used:', swapAmountFormatted, 'HBAR');
      console.log('   HBARX Received:', hbarxGainedFormatted, 'HBARX');
      console.log('   Transaction:', directSwapTx.hash);
      return;
      
    } catch (error) {
      console.log('❌ Direct HBAR to HBARX swap failed:', error.message);
      console.log('🔄 Falling back to two-step process...');
    }
    
    // Fallback: Get WHBAR via SaucerSwap (HBAR -> WHBAR)
    console.log('\n📦 STEP 3a: Getting WHBAR via SaucerSwap (Fallback)');
    console.log('-' .repeat(40));
    
    // First swap HBAR to WHBAR on SaucerSwap
    // Note: For swapExactETHForTokens, path should start with WHBAR
    const hbarToWhbarPath = [WHBAR_ADDRESS];
    
    try {
      const hbarToWhbarAmounts = await routerContract.getAmountsOut(swapAmount, hbarToWhbarPath);
      const expectedWHBAR = hbarToWhbarAmounts[1];
      const minWHBAR = expectedWHBAR.mul(99).div(100); // 1% slippage
      
      console.log('💱 Swapping HBAR to WHBAR first...');
      const deadline = Math.floor(Date.now() / 1000) + 1800;
      
      const hbarToWhbarTx = await routerContract.swapExactETHForTokens(
        minWHBAR,
        hbarToWhbarPath,
        myAddress,
        deadline,
        { value: swapAmount, gasLimit: 500000 }
      );
      
      console.log('⏳ HBAR to WHBAR swap transaction:', hbarToWhbarTx.hash);
      await hbarToWhbarTx.wait();
      console.log('✅ HBAR successfully swapped to WHBAR');
      
    } catch (error) {
      console.log('❌ HBAR to WHBAR swap failed:', error.message);
      console.log('💡 Alternative: Get WHBAR directly from SaucerSwap UI');
      return;
    }
    
    // Check WHBAR balance
    const whbarBalance = await whbarContract.balanceOf(myAddress);
    const whbarFormatted = ethers.utils.formatEther(whbarBalance);
    console.log('🔗 WHBAR Balance:', whbarFormatted, 'WHBAR');
    
    // Step 2: Approve WHBAR for router
    console.log('\n📝 STEP 4: Approving WHBAR for SaucerSwap');
    console.log('-' .repeat(40));
    
    if (whbarBalance.eq(0)) {
      console.log('❌ No WHBAR balance to swap for HBARX');
      return;
    }
    
    const currentAllowance = await whbarContract.allowance(myAddress, SAUCERSWAP_ROUTER);
    
    if (currentAllowance.lt(whbarBalance)) {
      const approveTx = await whbarContract.approve(SAUCERSWAP_ROUTER, whbarBalance, {
        gasLimit: 200000
      });
      
      console.log('⏳ Approval transaction:', approveTx.hash);
      await approveTx.wait();
      console.log('✅ WHBAR approved for swapping');
    } else {
      console.log('✅ Sufficient allowance already exists');
    }
    
    // Step 3: Get expected output amount
    console.log('\n📊 STEP 5: Calculating WHBAR to HBARX Swap Output');
    console.log('-' .repeat(45));
    
    const whbarToHbarxPath = [WHBAR_ADDRESS, HBARX_ADDRESS];
    
    try {
      const amountsOut = await routerContract.getAmountsOut(whbarBalance, whbarToHbarxPath);
      const expectedHBARX = amountsOut[1];
      const expectedHBARXFormatted = ethers.utils.formatUnits(expectedHBARX, hbarxDecimals);
      
      console.log('📈 Expected HBARX output:', expectedHBARXFormatted, 'HBARX');
      console.log('💰 Using WHBAR amount:', whbarFormatted, 'WHBAR');
      
      // Set minimum output (with 1% slippage)
      const minAmountOut = expectedHBARX.mul(99).div(100);
      const minAmountOutFormatted = ethers.utils.formatUnits(minAmountOut, hbarxDecimals);
      console.log('📉 Minimum HBARX (1% slippage):', minAmountOutFormatted, 'HBARX');
      
      // Step 4: Execute the swap
      console.log('\n🔄 STEP 6: Executing WHBAR to HBARX Swap');
      console.log('-' .repeat(40));
      
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
      
      const swapTx = await routerContract.swapExactTokensForTokens(
        whbarBalance,
        minAmountOut,
        whbarToHbarxPath,
        myAddress,
        deadline,
        { gasLimit: 500000 }
      );
      
      console.log('⏳ Swap transaction:', swapTx.hash);
      const receipt = await swapTx.wait();
      console.log('✅ Swap completed successfully!');
      
      // Check final balances
      console.log('\n📊 STEP 7: Final Balance Check');
      console.log('-' .repeat(30));
      
      const finalHbarBalance = await signer.getBalance();
      const finalHbarFormatted = ethers.utils.formatEther(finalHbarBalance);
      
      const finalHbarxBalance = await hbarxContract.balanceOf(myAddress);
      const finalHbarxFormatted = ethers.utils.formatUnits(finalHbarxBalance, hbarxDecimals);
      
      const hbarxGained = finalHbarxBalance.sub(hbarxBalance);
      const hbarxGainedFormatted = ethers.utils.formatUnits(hbarxGained, hbarxDecimals);
      
      console.log('💰 Final HBAR Balance:', finalHbarFormatted, 'HBAR');
      console.log('🔥 Final HBARX Balance:', finalHbarxFormatted, 'HBARX');
      console.log('📈 HBARX Gained:', hbarxGainedFormatted, 'HBARX');
      
      console.log('\n🎉 Two-Step Swap Summary:');
      console.log('   Step 1: HBAR → WHBAR via SaucerSwap');
      console.log('   Step 2: WHBAR → HBARX via SaucerSwap');
      console.log('   Total HBAR Used:', swapAmountFormatted, 'HBAR');
      console.log('   Final HBARX Received:', hbarxGainedFormatted, 'HBARX');
      console.log('   Final Transaction:', receipt.transactionHash);
      
    } catch (error) {
      if (error.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
        console.log('❌ Swap failed: Insufficient liquidity or high slippage');
        console.log('💡 Try:');
        console.log('   1. Reducing the swap amount');
        console.log('   2. Increasing slippage tolerance');
        console.log('   3. Checking SaucerSwap liquidity pools');
      } else {
        console.log('❌ Swap failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during swap process:', error.message);
    
    if (error.message.includes('CALL_EXCEPTION')) {
      console.log('\n💡 This might be due to:');
      console.log('   1. Network connectivity issues');
      console.log('   2. Incorrect contract addresses');
      console.log('   3. Insufficient gas or gas price issues');
      console.log('   4. SaucerSwap router not available');
    }
  }
}

// Additional helper function to check SaucerSwap pair existence
async function checkPairExists() {
  console.log('\n🔍 Checking WHBAR/HBARX Pair on SaucerSwap...');
  
  // This would require SaucerSwap Factory contract
  // For now, we'll assume the pair exists
  console.log('✅ Assuming WHBAR/HBARX pair exists on SaucerSwap');
  console.log('💡 If swap fails, the pair might not exist or have insufficient liquidity');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });