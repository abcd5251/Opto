const { ethers } = require('hardhat');
const hre = require('hardhat');

// Token addresses and configurations
const HBARX_TOKEN_ID = '0.0.2231533'; // HBARX token ID on Hedera testnet
const HBARX_ADDRESS = '0x0000000000000000000000000000000000220cED'; // HBARX contract address on Bonzo Finance
const BONZO_LENDING_POOL = '0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2';

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
  'function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))',
  'function getConfiguration(address asset) view returns (tuple(uint256 data))'
];

async function completeHBARtoHBARXWorkflow() {
  console.log('🚀 Complete HBAR to HBARX Workflow for Bonzo Finance');
  console.log('=' .repeat(60));
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('📝 Account:', signer.address);
    
    // Step 1: Check current balances
    console.log('\n📊 STEP 1: Checking Current Balances');
    console.log('-' .repeat(40));
    
    const hbarBalance = await signer.getBalance();
    console.log('💰 HBAR Balance:', ethers.utils.formatEther(hbarBalance), 'HBAR');
    
    const hbarxAddress = ethers.utils.getAddress(HBARX_ADDRESS);
    const hbarxContract = new ethers.Contract(hbarxAddress, ERC20_ABI, signer);
    
    let hbarxBalance, hbarxDecimals;
    try {
      hbarxBalance = await hbarxContract.balanceOf(signer.address);
      hbarxDecimals = await hbarxContract.decimals();
      console.log('🔥 HBARX Balance:', ethers.utils.formatUnits(hbarxBalance, hbarxDecimals), 'HBARX');
    } catch (error) {
      console.log('🔥 HBARX Balance: Unable to check (likely 0)');
      hbarxBalance = ethers.BigNumber.from('0');
      hbarxDecimals = 8; // HBARX typically has 8 decimals
    }
    
    // Step 2: Determine next action
    console.log('\n🎯 STEP 2: Determining Next Action');
    console.log('-' .repeat(40));
    
    if (hbarxBalance.gt(0)) {
      console.log('✅ You have HBARX! Proceeding to deposit into Bonzo Finance...');
      await depositHBARXToBonzo(signer, hbarxContract, hbarxBalance, hbarxDecimals, hbarxAddress);
    } else {
      console.log('❌ No HBARX found. You need to swap HBAR for HBARX first.');
      await showHBARXSwapInstructions(hbarBalance);
    }
    
  } catch (error) {
    console.error('❌ Error in workflow:', error.message);
  }
}

async function depositHBARXToBonzo(signer, hbarxContract, hbarxBalance, hbarxDecimals, hbarxAddress) {
  console.log('\n💰 STEP 3: Depositing HBARX to Bonzo Finance');
  console.log('-' .repeat(40));
  
  try {
    // Connect to Bonzo lending pool
    const lendingPool = new ethers.Contract(BONZO_LENDING_POOL, LENDING_POOL_ABI, signer);
    
    // Check if HBARX is supported and active
     let reserveData;
     let isDepositAllowed = false;
     
     try {
       reserveData = await lendingPool.getReserveData(hbarxAddress);
       console.log('✅ HBARX is supported by Bonzo Finance');
       console.log('📊 Liquidity Index:', reserveData.liquidityIndex.toString());
       
       // Check reserve configuration to see if deposits are allowed
        const config = await lendingPool.getConfiguration(hbarxAddress);
        const configData = config.data;
        
        const isActive = configData.and(1).eq(1);
        const isFrozen = configData.and(2).eq(2);
        const isPaused = configData.and(16).eq(16);
       
       console.log('📊 Reserve Status:');
       console.log('   - Active:', isActive ? '✅ YES' : '❌ NO');
       console.log('   - Frozen:', isFrozen ? '❌ YES' : '✅ NO');
       console.log('   - Paused:', isPaused ? '❌ YES' : '✅ NO');
       
       isDepositAllowed = isActive && !isFrozen && !isPaused;
       
       if (!isDepositAllowed) {
         console.log('\n❌ HBARX deposits are currently not allowed on Bonzo Finance');
         if (!isActive) console.log('   Reason: Reserve is not active');
         if (isFrozen) console.log('   Reason: Reserve is frozen');
         if (isPaused) console.log('   Reason: Reserve is paused');
         
         console.log('\n💡 Alternative Options:');
         console.log('1. 🔄 Swap HBARX for supported tokens:');
         console.log('   - Visit SaucerSwap: https://testnet.saucerswap.finance/');
         console.log('   - Swap HBARX → USDC (supported by Bonzo)');
         console.log('   - Then deposit USDC to Bonzo Finance');
         console.log('');
         console.log('2. ⏳ Wait for HBARX support to be reactivated:');
         console.log('   - Monitor Bonzo Finance announcements');
         console.log('   - Check their Discord/Twitter for updates');
         console.log('');
         console.log('3. 🏦 Use Bonzo Finance UI directly:');
         console.log('   - Visit: https://testnet.bonzo.finance/');
         console.log('   - Check if HBARX deposits work through the UI');
         console.log('');
         console.log('4. 💰 Hold HBARX for staking rewards:');
         console.log('   - HBARX earns staking rewards automatically');
         console.log('   - No action needed to earn rewards');
         
         return;
       }
       
     } catch (error) {
       console.log('❌ Error checking HBARX support:', error.message);
       return;
     }
     
     // Check current allowance
     console.log('\n🔍 Checking HBARX allowance for Bonzo Finance...');
     const currentAllowance = await hbarxContract.allowance(signer.address, BONZO_LENDING_POOL);
     console.log('📊 Current allowance:', ethers.utils.formatUnits(currentAllowance, hbarxDecimals), 'HBARX');
     
     // Approve if needed
     if (currentAllowance.lt(hbarxBalance)) {
       console.log('\n📝 Approving HBARX for Bonzo Finance...');
       const approveTx = await hbarxContract.approve(BONZO_LENDING_POOL, hbarxBalance, { gasLimit: 300000 });
       console.log('⏳ Approval transaction hash:', approveTx.hash);
       await approveTx.wait();
       console.log('✅ HBARX approved successfully!');
     } else {
       console.log('✅ Sufficient allowance already exists');
     }
     
     // Deposit HBARX
     console.log('\n💰 Depositing HBARX to Bonzo Finance...');
     console.log('📊 Deposit amount:', ethers.utils.formatUnits(hbarxBalance, hbarxDecimals), 'HBARX');
     
     const depositTx = await lendingPool.deposit(
       hbarxAddress,
       hbarxBalance,
       signer.address,
       0, // referral code
       { gasLimit: 500000 }
     );
     
     console.log('⏳ Deposit transaction hash:', depositTx.hash);
     await depositTx.wait();
     console.log('✅ HBARX deposited successfully to Bonzo Finance!');
     
     // Check final balances
     console.log('\n📊 Final Status:');
     console.log('-'.repeat(40));
     const finalHBARXBalance = await hbarxContract.balanceOf(signer.address);
     console.log('🔥 Remaining HBARX balance:', ethers.utils.formatUnits(finalHBARXBalance, hbarxDecimals));
     
     // Get aToken balance
     try {
       const aTokenAddress = reserveData.aTokenAddress;
       const aTokenContract = new ethers.Contract(aTokenAddress, ERC20_ABI, signer);
       const aTokenBalance = await aTokenContract.balanceOf(signer.address);
       const aTokenDecimals = await aTokenContract.decimals();
       console.log('🏦 aHBARX balance:', ethers.utils.formatUnits(aTokenBalance, aTokenDecimals));
     } catch (error) {
       console.log('🏦 aHBARX balance: Unable to check');
     }
     
     console.log('\n🎉 HBARX successfully deposited into Bonzo Finance!');
     console.log('💡 You are now earning lending rewards on your HBARX');
     console.log('🔗 Visit Bonzo Finance dashboard to monitor your position');
    
  } catch (error) {
    console.error('❌ Error depositing to Bonzo:', error.message);
  }
}

async function showHBARXSwapInstructions(hbarBalance) {
  console.log('\n💱 STEP 3: HBAR to HBARX Swap Instructions');
  console.log('-' .repeat(40));
  console.log('To get HBARX, you need to stake HBAR with Stader Labs. Follow these steps:');
  console.log('');
  
  console.log('🌐 1. Visit Stader Labs Hedera Testnet:');
  console.log('   https://testnet.staderlabs.com/hedera/liquid-staking/');
  console.log('   (Note: Verify the correct testnet URL)');
  console.log('');
  
  console.log('🔗 2. Connect Your Wallet:');
  console.log('   - Click "Connect Wallet"');
  console.log('   - Select "HashPack"');
  console.log('   - Approve the connection in your HashPack wallet');
  console.log('');
  
  console.log('🔥 3. Stake HBAR for HBARX:');
  console.log('   - Navigate to the liquid staking section');
  console.log('   - Enter the amount of HBAR you want to stake');
  
  if (hbarBalance.gt(ethers.utils.parseEther('1'))) {
    const maxStake = ethers.utils.formatEther(hbarBalance.sub(ethers.utils.parseEther('1')));
    console.log(`   - Recommended amount: Up to ${maxStake} HBAR`);
    console.log('     (Keep ~1 HBAR for future transaction fees)');
  }
  
  console.log('   - Review the staking terms and exchange rate');
  console.log('   - Click "Stake" and confirm in HashPack');
  console.log('   - You will receive HBARX tokens in return');
  console.log('');
  
  console.log('⏳ 4. Wait for Confirmation:');
  console.log('   - Staking transaction should complete in 3-5 seconds');
  console.log('   - Fee will be less than $0.01');
  console.log('   - HBARX tokens will appear in your wallet');
  console.log('');
  
  console.log('✅ 5. After Successful Staking:');
  console.log('   Run this script again to automatically deposit HBARX:');
  console.log('   npx hardhat run scripts/completeHBARtoHBARXWorkflow.js --network hedera-testnet');
  console.log('');
  
  console.log('📋 Alternative Method - SaucerSwap:');
  console.log('   If direct staking is not available, you can also:');
  console.log('   1. Visit https://testnet.saucerswap.finance/');
  console.log('   2. Swap HBAR for HBARX directly');
  console.log('   3. Follow the same process as USDC swapping');
  console.log('');
  
  console.log('💡 About HBARX:');
  console.log('   - HBARX is a liquid staking token by Stader Labs');
  console.log('   - Represents staked HBAR that earns staking rewards');
  console.log('   - Can be used in DeFi while still earning staking rewards');
  console.log('   - Token ID: 0.0.2231533 (verify on testnet)');
  console.log('');
  
  console.log('🆘 Need Help?');
  console.log('   - Stader Labs Documentation: https://docs.staderlabs.com/');
  console.log('   - SaucerSwap Documentation: https://docs.saucerswap.finance/');
  console.log('   - Bonzo Finance: https://bonzo.finance/');
  console.log('');
}

// Quick balance checker for HBARX
async function quickHBARXBalanceCheck() {
  const [signer] = await ethers.getSigners();
  const hbarBalance = await signer.getBalance();
  
  console.log('💰 Quick Balance Check:');
  console.log('   HBAR:', ethers.utils.formatEther(hbarBalance));
  
  try {
    const hbarxAddress = ethers.utils.getAddress(tokenIdToAddress(HBARX_TOKEN_ID));
    const hbarxContract = new ethers.Contract(hbarxAddress, ERC20_ABI, signer);
    const hbarxBalance = await hbarxContract.balanceOf(signer.address);
    const hbarxDecimals = await hbarxContract.decimals();
    console.log('   HBARX:', ethers.utils.formatUnits(hbarxBalance, hbarxDecimals));
  } catch (error) {
    console.log('   HBARX: 0.0 (or unable to check)');
  }
}

// Alternative SaucerSwap method for HBARX
async function swapHBARtoHBARXOnSaucerSwap() {
  console.log('🔄 Alternative: HBAR to HBARX Swap on SaucerSwap');
  console.log('=' .repeat(50));
  
  const [signer] = await ethers.getSigners();
  const hbarBalance = await signer.getBalance();
  
  console.log('📝 Account:', signer.address);
  console.log('💰 HBAR Balance:', ethers.utils.formatEther(hbarBalance), 'HBAR');
  console.log('');
  
  console.log('🌐 1. Visit SaucerSwap Testnet:');
  console.log('   https://testnet.saucerswap.finance/');
  console.log('');
  
  console.log('🔗 2. Connect HashPack Wallet');
  console.log('');
  
  console.log('💱 3. Perform HBAR → HBARX Swap:');
  console.log('   - From: HBAR');
  console.log('   - To: HBARX');
  console.log('   - Enter desired amount');
  console.log('   - Review exchange rate');
  console.log('   - Confirm swap');
  console.log('');
  
  console.log('✅ 4. After swap, run:');
  console.log('   npx hardhat run scripts/completeHBARtoHBARXWorkflow.js --network hedera-testnet');
}

// Main execution
if (require.main === module) {
  completeHBARtoHBARXWorkflow()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  completeHBARtoHBARXWorkflow,
  quickHBARXBalanceCheck,
  swapHBARtoHBARXOnSaucerSwap,
  tokenIdToAddress
};