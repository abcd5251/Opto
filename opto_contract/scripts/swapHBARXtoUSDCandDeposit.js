const { ethers } = require("hardhat");

async function main() {
  console.log('🔄 HBARX → USDC → Bonzo Finance Workflow');
  console.log('=' .repeat(60));
  
  // Get signer
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log('📝 Account:', myAddress);
  
  // Token addresses
  const HBARX_TOKEN_ID = '0.0.2231533';
  const USDC_TOKEN_ID = '0.0.1361'; // Correct USDC token ID
  const HBARX_ADDRESS = '0x0000000000000000000000000000000000220cED';
  const USDC_ADDRESS = '0x0000000000000000000000000000000000001549'; // Correct USDC address
  
  // Bonzo Finance
  const BONZO_LENDING_POOL = '0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2';
  
  // ABIs
  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
  ];
  
  const LENDING_POOL_ABI = [
    'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
    'function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))'
  ];
  
  try {
    // Check current balances
    console.log('\n📊 STEP 1: Checking Current Balances');
    console.log('-' .repeat(40));
    
    const hbarxContract = new ethers.Contract(HBARX_ADDRESS, ERC20_ABI, signer);
    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
    
    const hbarxBalance = await hbarxContract.balanceOf(myAddress);
    const usdcBalance = await usdcContract.balanceOf(myAddress);
    const hbarxDecimals = await hbarxContract.decimals();
    const usdcDecimals = await usdcContract.decimals();
    
    const hbarxFormatted = ethers.utils.formatUnits(hbarxBalance, hbarxDecimals);
    const usdcFormatted = ethers.utils.formatUnits(usdcBalance, usdcDecimals);
    
    console.log('🔥 HBARX Balance:', hbarxFormatted, 'HBARX');
    console.log('💵 USDC Balance:', usdcFormatted, 'USDC');
    
    if (hbarxBalance.eq(0)) {
      console.log('\n❌ No HBARX to swap!');
      console.log('💡 Please get HBARX first by:');
      console.log('   1. Staking HBAR with Stader Labs');
      console.log('   2. Swapping HBAR for HBARX on SaucerSwap');
      return;
    }
    
    // Manual swap instructions
    console.log('\n🔄 STEP 2: Swap HBARX to USDC on SaucerSwap');
    console.log('-' .repeat(40));
    console.log('❗ MANUAL ACTION REQUIRED:');
    console.log('');
    console.log('1. 🌐 Visit SaucerSwap Testnet:');
    console.log('   https://testnet.saucerswap.finance/');
    console.log('');
    console.log('2. 🔗 Connect your wallet');
    console.log('   - Click "Connect Wallet"');
    console.log('   - Select your wallet (HashPack, Blade, etc.)');
    console.log('   - Approve the connection');
    console.log('');
    console.log('3. ⚙️  Set up the swap:');
    console.log('   - From Token: HBARX (' + HBARX_TOKEN_ID + ')');
    console.log('   - To Token: USDC (' + USDC_TOKEN_ID + ')');
    console.log('   - Amount: ' + hbarxFormatted + ' HBARX (or desired amount)');
    console.log('');
    console.log('4. 📊 Review swap details:');
    console.log('   - Check the exchange rate');
    console.log('   - Review slippage tolerance (usually 0.5-1%)');
    console.log('   - Verify the estimated USDC output');
    console.log('');
    console.log('5. ✅ Execute the swap:');
    console.log('   - Click "Swap"');
    console.log('   - Approve the transaction in your wallet');
    console.log('   - Wait for confirmation');
    console.log('');
    console.log('6. 🔍 Verify the swap:');
    console.log('   - Check your USDC balance increased');
    console.log('   - Check your HBARX balance decreased');
    console.log('');
    console.log('💡 After successful swap, run this script again to deposit USDC to Bonzo Finance!');
    console.log('');
    
    // Check if we have USDC to deposit
    if (usdcBalance.gt(0)) {
      console.log('\n💰 STEP 3: Depositing USDC to Bonzo Finance');
      console.log('-' .repeat(40));
      
      const lendingPool = new ethers.Contract(BONZO_LENDING_POOL, LENDING_POOL_ABI, signer);
      
      // Check if USDC is supported
      try {
        const reserveData = await lendingPool.getReserveData(USDC_ADDRESS);
        console.log('✅ USDC is supported by Bonzo Finance');
        console.log('📊 aToken Address:', reserveData.aTokenAddress);
        
        // Check allowance
        const currentAllowance = await usdcContract.allowance(myAddress, BONZO_LENDING_POOL);
        console.log('\n🔍 Current USDC allowance:', ethers.utils.formatUnits(currentAllowance, usdcDecimals));
        
        if (currentAllowance.lt(usdcBalance)) {
          console.log('📝 Approving USDC for Bonzo Finance...');
          const approveTx = await usdcContract.approve(BONZO_LENDING_POOL, usdcBalance, {
            gasLimit: 300000
          });
          await approveTx.wait();
          console.log('✅ USDC approved for deposit');
        }
        
        // Deposit USDC
        console.log('💰 Depositing', usdcFormatted, 'USDC to Bonzo Finance...');
        const depositTx = await lendingPool.deposit(
          USDC_ADDRESS,
          usdcBalance,
          myAddress,
          0, // referral code
          { gasLimit: 500000 }
        );
        
        console.log('⏳ Transaction submitted:', depositTx.hash);
        await depositTx.wait();
        console.log('✅ USDC successfully deposited to Bonzo Finance!');
        
        // Check final balances
        const finalUsdcBalance = await usdcContract.balanceOf(myAddress);
        const finalUsdcFormatted = ethers.utils.formatUnits(finalUsdcBalance, usdcDecimals);
        
        console.log('\n📊 Final Balances:');
        console.log('💵 USDC Balance:', finalUsdcFormatted, 'USDC');
        console.log('🏦 Deposited to Bonzo Finance successfully!');
        
      } catch (error) {
        console.log('❌ Error with USDC deposit:', error.message);
      }
    } else {
      console.log('\n💡 No USDC available for deposit.');
      console.log('   Complete the HBARX → USDC swap first, then run this script again.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });