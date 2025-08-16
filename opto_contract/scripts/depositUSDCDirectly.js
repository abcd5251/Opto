const { ethers } = require("hardhat");

async function main() {
  console.log('💵 Direct USDC Deposit to Bonzo Finance');
  console.log('=' .repeat(50));
  
  // Get signer
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log('📝 Account:', myAddress);
  
  // Contract addresses
  const USDC_ADDRESS = '0x0000000000000000000000000000000000001549';
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
    // Check USDC balance
    console.log('\n📊 Checking USDC Balance');
    console.log('-' .repeat(30));
    
    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
    const usdcBalance = await usdcContract.balanceOf(myAddress);
    const usdcDecimals = await usdcContract.decimals();
    const usdcFormatted = ethers.utils.formatUnits(usdcBalance, usdcDecimals);
    
    console.log('💵 USDC Balance:', usdcFormatted, 'USDC');
    
    if (usdcBalance.eq(0)) {
      console.log('\n❌ No USDC to deposit!');
      console.log('💡 Please get USDC first by:');
      console.log('   1. Swapping HBAR for USDC on SaucerSwap');
      console.log('   2. Swapping HBARX for USDC on SaucerSwap');
      return;
    }
    
    // Check Bonzo Finance support
    console.log('\n🏦 Checking Bonzo Finance Support');
    console.log('-' .repeat(35));
    
    const lendingPool = new ethers.Contract(BONZO_LENDING_POOL, LENDING_POOL_ABI, signer);
    
    try {
      const reserveData = await lendingPool.getReserveData(USDC_ADDRESS);
      console.log('✅ USDC is supported by Bonzo Finance');
      console.log('📊 aToken Address:', reserveData.aTokenAddress);
      console.log('📊 Liquidity Index:', reserveData.liquidityIndex.toString());
      
      // Check current allowance
      console.log('\n🔍 Checking Allowance');
      console.log('-' .repeat(25));
      
      const currentAllowance = await usdcContract.allowance(myAddress, BONZO_LENDING_POOL);
      const allowanceFormatted = ethers.utils.formatUnits(currentAllowance, usdcDecimals);
      console.log('Current allowance:', allowanceFormatted, 'USDC');
      
      // Approve if needed
      if (currentAllowance.lt(usdcBalance)) {
        console.log('\n📝 Approving USDC for Bonzo Finance...');
        
        // Use a smaller amount for testing
        const approveAmount = ethers.utils.parseUnits('1', usdcDecimals); // Approve 1 USDC
        
        const approveTx = await usdcContract.approve(BONZO_LENDING_POOL, approveAmount, {
          gasLimit: 200000
        });
        
        console.log('⏳ Approval transaction:', approveTx.hash);
        await approveTx.wait();
        console.log('✅ USDC approved for deposit');
        
        // Deposit the approved amount
        console.log('\n💰 Depositing 1 USDC to Bonzo Finance...');
        const depositTx = await lendingPool.deposit(
          USDC_ADDRESS,
          approveAmount,
          myAddress,
          0, // referral code
          { gasLimit: 300000 }
        );
        
        console.log('⏳ Deposit transaction:', depositTx.hash);
        await depositTx.wait();
        console.log('✅ USDC successfully deposited to Bonzo Finance!');
        
      } else {
        console.log('✅ Sufficient allowance already exists');
        
        // Deposit available amount (up to allowance)
        const depositAmount = currentAllowance.lt(usdcBalance) ? currentAllowance : usdcBalance;
        const depositFormatted = ethers.utils.formatUnits(depositAmount, usdcDecimals);
        
        console.log('\n💰 Depositing', depositFormatted, 'USDC to Bonzo Finance...');
        const depositTx = await lendingPool.deposit(
          USDC_ADDRESS,
          depositAmount,
          myAddress,
          0, // referral code
          { gasLimit: 300000 }
        );
        
        console.log('⏳ Deposit transaction:', depositTx.hash);
        await depositTx.wait();
        console.log('✅ USDC successfully deposited to Bonzo Finance!');
      }
      
      // Check final balance
      console.log('\n📊 Final Balance Check');
      console.log('-' .repeat(25));
      
      const finalUsdcBalance = await usdcContract.balanceOf(myAddress);
      const finalUsdcFormatted = ethers.utils.formatUnits(finalUsdcBalance, usdcDecimals);
      
      console.log('💵 Remaining USDC:', finalUsdcFormatted, 'USDC');
      console.log('🏦 Successfully deposited to Bonzo Finance!');
      
    } catch (error) {
      console.log('❌ Error with USDC operations:', error.message);
      
      if (error.message.includes('CALL_EXCEPTION')) {
        console.log('\n💡 This might be due to:');
        console.log('   1. Network connectivity issues');
        console.log('   2. Contract interaction problems');
        console.log('   3. Insufficient gas or gas price issues');
        console.log('\n🔄 Try again in a few moments or check network status');
      }
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