const { ethers } = require('hardhat');

// Contract addresses
const HBARX_ADDRESS = '0x0000000000000000000000000000000000220cED';
const BONZO_LENDING_POOL = '0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2';

// ABIs
const LENDING_POOL_ABI = [
  'function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))',
  'function getConfiguration(address asset) external view returns (tuple(uint256 data))',
  'function paused() external view returns (bool)'
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

async function checkHBARXDepositStatus() {
  console.log('🔍 Checking HBARX Deposit Status on Bonzo Finance');
  console.log('=' .repeat(50));
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('📝 Account:', signer.address);
    
    // Connect to contracts
    const lendingPool = new ethers.Contract(BONZO_LENDING_POOL, LENDING_POOL_ABI, signer);
    const hbarxContract = new ethers.Contract(HBARX_ADDRESS, ERC20_ABI, signer);
    
    // Check HBARX token info
    console.log('\n🔥 HBARX Token Information:');
    console.log('-' .repeat(40));
    const hbarxName = await hbarxContract.name();
    const hbarxSymbol = await hbarxContract.symbol();
    const hbarxDecimals = await hbarxContract.decimals();
    const hbarxBalance = await hbarxContract.balanceOf(signer.address);
    
    console.log('Name:', hbarxName);
    console.log('Symbol:', hbarxSymbol);
    console.log('Decimals:', hbarxDecimals);
    console.log('Your Balance:', ethers.utils.formatUnits(hbarxBalance, hbarxDecimals));
    console.log('Contract Address:', HBARX_ADDRESS);
    
    // Check if lending pool is paused
    console.log('\n🏦 Bonzo Finance Status:');
    console.log('-' .repeat(40));
    try {
      const isPaused = await lendingPool.paused();
      console.log('Lending Pool Paused:', isPaused ? '❌ YES' : '✅ NO');
    } catch (error) {
      console.log('Lending Pool Paused: Unable to check');
    }
    
    // Check HBARX reserve data
    console.log('\n📊 HBARX Reserve Data:');
    console.log('-' .repeat(40));
    try {
      const reserveData = await lendingPool.getReserveData(HBARX_ADDRESS);
      
      console.log('✅ HBARX is supported as a reserve');
      console.log('Liquidity Index:', reserveData.liquidityIndex.toString());
      console.log('Variable Borrow Index:', reserveData.variableBorrowIndex.toString());
      console.log('Current Liquidity Rate:', reserveData.currentLiquidityRate.toString());
      console.log('Current Variable Borrow Rate:', reserveData.currentVariableBorrowRate.toString());
      console.log('aToken Address:', reserveData.aTokenAddress);
      console.log('Reserve ID:', reserveData.id);
      
      // Check if reserve is active (non-zero liquidity index)
      const isActive = reserveData.liquidityIndex.gt(0);
      console.log('Reserve Active:', isActive ? '✅ YES' : '❌ NO');
      
    } catch (error) {
      console.log('❌ Error getting reserve data:', error.message);
      return;
    }
    
    // Check reserve configuration
    console.log('\n⚙️  HBARX Reserve Configuration:');
    console.log('-' .repeat(40));
    try {
      const config = await lendingPool.getConfiguration(HBARX_ADDRESS);
      const configData = config.data;
      
      console.log('Configuration Data:', configData.toString());
      
      // Decode configuration bits (simplified)
      // Bit 0: Reserve is active
      // Bit 1: Reserve is frozen
      // Bit 2: Borrowing is enabled
      // Bit 3: Stable rate borrowing is enabled
      // Bit 4: Reserve is paused
      
      const isActive = configData.and(1).eq(1);
      const isFrozen = configData.and(2).eq(2);
      const borrowingEnabled = configData.and(4).eq(4);
      const stableRateEnabled = configData.and(8).eq(8);
      const isPaused = configData.and(16).eq(16);
      
      console.log('Reserve Active:', isActive ? '✅ YES' : '❌ NO');
      console.log('Reserve Frozen:', isFrozen ? '❌ YES' : '✅ NO');
      console.log('Borrowing Enabled:', borrowingEnabled ? '✅ YES' : '❌ NO');
      console.log('Stable Rate Enabled:', stableRateEnabled ? '✅ YES' : '❌ NO');
      console.log('Reserve Paused:', isPaused ? '❌ YES' : '✅ NO');
      
      // Determine if deposits should work
      console.log('\n🎯 Deposit Status Analysis:');
      console.log('-' .repeat(40));
      
      if (!isActive) {
        console.log('❌ DEPOSITS NOT ALLOWED: Reserve is not active');
      } else if (isFrozen) {
        console.log('❌ DEPOSITS NOT ALLOWED: Reserve is frozen');
      } else if (isPaused) {
        console.log('❌ DEPOSITS NOT ALLOWED: Reserve is paused');
      } else {
        console.log('✅ DEPOSITS SHOULD BE ALLOWED');
        console.log('💡 If deposits are still failing, it might be:');
        console.log('   - Gas limit issues');
        console.log('   - Network congestion');
        console.log('   - Contract-specific restrictions');
        console.log('   - Insufficient allowance');
      }
      
    } catch (error) {
      console.log('❌ Error getting configuration:', error.message);
    }
    
    // Check allowance
    console.log('\n🔍 Allowance Check:');
    console.log('-' .repeat(40));
    try {
      const allowance = await hbarxContract.allowance(signer.address, BONZO_LENDING_POOL);
      console.log('Current Allowance:', ethers.utils.formatUnits(allowance, hbarxDecimals), 'HBARX');
      
      if (allowance.gte(hbarxBalance)) {
        console.log('✅ Sufficient allowance for current balance');
      } else {
        console.log('❌ Insufficient allowance - need to approve first');
      }
    } catch (error) {
      console.log('❌ Error checking allowance:', error.message);
    }
    
    console.log('\n💡 Recommendations:');
    console.log('-' .repeat(40));
    console.log('1. If reserve is active and not frozen/paused:');
    console.log('   - Try depositing a smaller amount first');
    console.log('   - Ensure sufficient gas limit (500,000+)');
    console.log('   - Check network status');
    console.log('');
    console.log('2. If reserve has issues:');
    console.log('   - Wait for Bonzo Finance to resolve');
    console.log('   - Check Bonzo Finance announcements');
    console.log('   - Try alternative supported tokens (USDC, SAUCE)');
    console.log('');
    console.log('3. Alternative approach:');
    console.log('   - Use Bonzo Finance UI directly');
    console.log('   - Visit: https://testnet.bonzo.finance/');
    console.log('   - Compare behavior with UI vs script');
    
  } catch (error) {
    console.error('❌ Error in status check:', error.message);
  }
}

if (require.main === module) {
  checkHBARXDepositStatus()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  checkHBARXDepositStatus
};