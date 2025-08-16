const { ethers } = require('hardhat');
const hre = require('hardhat');

// Token addresses and configurations
const USDC_TOKEN_ID = '0.0.429274';
const BONZO_LENDING_POOL = '0x0000000000000000000000000000000000068cda';

// Convert Hedera token ID to EVM address
function tokenIdToAddress(tokenId) {
  const parts = tokenId.split('.');
  const tokenNum = parseInt(parts[2]);
  return '0x' + tokenNum.toString(16).padStart(40, '0');
}

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

// Bonzo Finance Lending Pool ABI
const LENDING_POOL_ABI = [
  'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
  'function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))'
];

async function completeHBARtoUSDCWorkflow() {
  console.log('🚀 Complete HBAR to USDC Workflow for Bonzo Finance');
  console.log('=' .repeat(60));
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('📝 Account:', signer.address);
    
    // Step 1: Check current balances
    console.log('\n📊 STEP 1: Checking Current Balances');
    console.log('-' .repeat(40));
    
    const hbarBalance = await signer.getBalance();
    console.log('💰 HBAR Balance:', ethers.utils.formatEther(hbarBalance), 'HBAR');
    
    const usdcAddress = ethers.utils.getAddress(tokenIdToAddress(USDC_TOKEN_ID));
    const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
    
    let usdcBalance, usdcDecimals;
    try {
      usdcBalance = await usdcContract.balanceOf(signer.address);
      usdcDecimals = await usdcContract.decimals();
      console.log('💵 USDC Balance:', ethers.utils.formatUnits(usdcBalance, usdcDecimals), 'USDC');
    } catch (error) {
      console.log('💵 USDC Balance: Unable to check (likely 0)');
      usdcBalance = ethers.BigNumber.from('0');
      usdcDecimals = 6;
    }
    
    // Step 2: Determine next action
    console.log('\n🎯 STEP 2: Determining Next Action');
    console.log('-' .repeat(40));
    
    if (usdcBalance.gt(0)) {
      console.log('✅ You have USDC! Proceeding to deposit into Bonzo Finance...');
      await depositUSDCtoBonzo(signer, usdcContract, usdcBalance, usdcDecimals, usdcAddress);
    } else {
      console.log('❌ No USDC found. You need to swap HBAR for USDC first.');
      await showSwapInstructions(hbarBalance);
    }
    
  } catch (error) {
    console.error('❌ Error in workflow:', error.message);
  }
}

async function depositUSDCtoBonzo(signer, usdcContract, usdcBalance, usdcDecimals, usdcAddress) {
  console.log('\n💰 STEP 3: Depositing USDC to Bonzo Finance');
  console.log('-' .repeat(40));
  
  try {
    // Connect to Bonzo lending pool
    const lendingPool = new ethers.Contract(BONZO_LENDING_POOL, LENDING_POOL_ABI, signer);
    
    // Check if USDC is supported
    try {
      const reserveData = await lendingPool.getReserveData(usdcAddress);
      console.log('✅ USDC is supported by Bonzo Finance');
    } catch (error) {
      console.log('❌ USDC may not be supported by Bonzo Finance');
      return;
    }
    
    // Check allowance
    const currentAllowance = await usdcContract.allowance(signer.address, BONZO_LENDING_POOL);
    console.log('🔍 Current allowance:', ethers.utils.formatUnits(currentAllowance, usdcDecimals), 'USDC');
    
    // Approve if needed
    if (currentAllowance.lt(usdcBalance)) {
      console.log('📝 Approving USDC for Bonzo Finance...');
      const approveTx = await usdcContract.approve(BONZO_LENDING_POOL, usdcBalance);
      console.log('⏳ Approval transaction:', approveTx.hash);
      await approveTx.wait();
      console.log('✅ Approval confirmed');
    } else {
      console.log('✅ Sufficient allowance already exists');
    }
    
    // Deposit USDC
    console.log('💰 Depositing', ethers.utils.formatUnits(usdcBalance, usdcDecimals), 'USDC to Bonzo Finance...');
    const depositTx = await lendingPool.deposit(
      usdcAddress,
      usdcBalance,
      signer.address,
      0 // referral code
    );
    
    console.log('⏳ Deposit transaction:', depositTx.hash);
    const receipt = await depositTx.wait();
    console.log('✅ Deposit confirmed in block:', receipt.blockNumber);
    
    // Check new balance
    const newUsdcBalance = await usdcContract.balanceOf(signer.address);
    console.log('💵 New USDC balance:', ethers.utils.formatUnits(newUsdcBalance, usdcDecimals), 'USDC');
    
    console.log('\n🎉 SUCCESS! Your USDC has been deposited into Bonzo Finance!');
    console.log('📈 You will now start earning interest on your deposit.');
    console.log('🔗 You can monitor your position on the Bonzo Finance dashboard.');
    
  } catch (error) {
    console.error('❌ Error depositing to Bonzo:', error.message);
  }
}

async function showSwapInstructions(hbarBalance) {
  console.log('\n💱 STEP 3: HBAR to USDC Swap Instructions');
  console.log('-' .repeat(40));
  console.log('Since automated swapping is not currently available, please follow these manual steps:');
  console.log('');
  
  console.log('🌐 1. Visit SaucerSwap Testnet:');
  console.log('   https://testnet.saucerswap.finance/');
  console.log('');
  
  console.log('🔗 2. Connect Your Wallet:');
  console.log('   - Click "Connect Wallet"');
  console.log('   - Select "HashPack"');
  console.log('   - Approve the connection in your HashPack wallet');
  console.log('');
  
  console.log('💱 3. Perform the Swap:');
  console.log('   - From token: HBAR');
  console.log('   - To token: USDC');
  
  if (hbarBalance.gt(ethers.utils.parseEther('1'))) {
    const maxSwap = ethers.utils.formatEther(hbarBalance.sub(ethers.utils.parseEther('1')));
    console.log(`   - Recommended amount: Up to ${maxSwap} HBAR`);
    console.log('     (Keep ~1 HBAR for future transaction fees)');
  }
  
  console.log('   - Review the swap rate and slippage');
  console.log('   - Click "Swap" and confirm in HashPack');
  console.log('');
  
  console.log('⏳ 4. Wait for Confirmation:');
  console.log('   - Transaction should complete in 3-5 seconds');
  console.log('   - Fee will be less than $0.01');
  console.log('');
  
  console.log('✅ 5. After Successful Swap:');
  console.log('   Run this script again to automatically deposit USDC:');
  console.log('   npx hardhat run scripts/completeHBARtoUSDCWorkflow.js --network hedera-testnet');
  console.log('');
  
  console.log('📋 Alternative Options:');
  console.log('   If USDC is not available, you can also swap HBAR for:');
  console.log('   - SAUCE (Token ID: 0.0.731861)');
  console.log('   - XSAUCE, HBARX, or KARATE');
  console.log('   All are supported by Bonzo Finance');
  console.log('');
  
  console.log('🆘 Need Help?');
  console.log('   - SaucerSwap Documentation: https://docs.saucerswap.finance/');
  console.log('   - Bonzo Finance: https://bonzo.finance/');
  console.log('');
}

// Quick balance checker
async function quickBalanceCheck() {
  const [signer] = await ethers.getSigners();
  const hbarBalance = await signer.getBalance();
  
  console.log('💰 Quick Balance Check:');
  console.log('   HBAR:', ethers.utils.formatEther(hbarBalance));
  
  try {
    const usdcAddress = ethers.utils.getAddress(tokenIdToAddress(USDC_TOKEN_ID));
    const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
    const usdcBalance = await usdcContract.balanceOf(signer.address);
    const usdcDecimals = await usdcContract.decimals();
    console.log('   USDC:', ethers.utils.formatUnits(usdcBalance, usdcDecimals));
  } catch (error) {
    console.log('   USDC: 0.0 (or unable to check)');
  }
}

// Main execution
if (require.main === module) {
  completeHBARtoUSDCWorkflow()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  completeHBARtoUSDCWorkflow,
  quickBalanceCheck,
  tokenIdToAddress
};