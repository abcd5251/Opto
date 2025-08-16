const { ethers } = require('hardhat');
const hre = require('hardhat');

// Token configurations
const HBARX_TOKEN_ID = '0.0.2231533'; // HBARX token ID on Hedera testnet
const WHBAR_TOKEN_ID = '0.0.99'; // WHBAR token ID

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
  'function name() view returns (string)'
];

async function saucerSwapHBARtoHBARX() {
  console.log('🔄 SaucerSwap: HBAR to HBARX Swap Guide');
  console.log('=' .repeat(50));
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('📝 Account:', signer.address);
    
    // Check current balances
    const hbarBalance = await signer.getBalance();
    console.log('💰 Current HBAR balance:', ethers.utils.formatEther(hbarBalance), 'HBAR');
    
    // Check HBARX balance
    const hbarxAddress = ethers.utils.getAddress(tokenIdToAddress(HBARX_TOKEN_ID));
    let hbarxBalance = ethers.BigNumber.from('0');
    let hbarxDecimals = 8;
    
    try {
      const hbarxContract = new ethers.Contract(hbarxAddress, ERC20_ABI, signer);
      hbarxBalance = await hbarxContract.balanceOf(signer.address);
      hbarxDecimals = await hbarxContract.decimals();
      const hbarxSymbol = await hbarxContract.symbol();
      console.log(`🔥 Current ${hbarxSymbol} balance:`, ethers.utils.formatUnits(hbarxBalance, hbarxDecimals), hbarxSymbol);
    } catch (error) {
      console.log('🔥 Current HBARX balance: 0.0 (or unable to check)');
    }
    
    if (hbarxBalance.gt(0)) {
      console.log('\n✅ You already have HBARX!');
      console.log('📋 To deposit into Bonzo Finance, run:');
      console.log('   npx hardhat run scripts/completeHBARtoHBARXWorkflow.js --network hedera-testnet');
      return;
    }
    
    console.log('\n🌐 STEP 1: Visit SaucerSwap Testnet');
    console.log('-' .repeat(40));
    console.log('🔗 URL: https://testnet.saucerswap.finance/');
    console.log('💡 Make sure you\'re on the TESTNET version');
    console.log('');
    
    console.log('🔗 STEP 2: Connect Your Wallet');
    console.log('-' .repeat(40));
    console.log('1. Click "Connect Wallet" button');
    console.log('2. Select "HashPack" from the wallet options');
    console.log('3. Approve the connection in your HashPack extension');
    console.log('4. Verify your account address matches:', signer.address);
    console.log('');
    
    console.log('💱 STEP 3: Set Up the Swap');
    console.log('-' .repeat(40));
    console.log('1. In the swap interface:');
    console.log('   - FROM token: Select "HBAR"');
    console.log('   - TO token: Search for "HBARX" and select it');
    console.log('   - Token ID to verify: 0.0.2231533');
    console.log('');
    
    if (hbarBalance.gt(ethers.utils.parseEther('1'))) {
      const recommendedAmount = ethers.utils.formatEther(hbarBalance.sub(ethers.utils.parseEther('1')));
      console.log('💰 STEP 4: Enter Swap Amount');
      console.log('-' .repeat(40));
      console.log(`📊 Your available HBAR: ${ethers.utils.formatEther(hbarBalance)}`);
      console.log(`💡 Recommended swap amount: Up to ${recommendedAmount} HBAR`);
      console.log('⚠️  Keep ~1 HBAR for future transaction fees');
      console.log('');
    }
    
    console.log('🔍 STEP 5: Review Swap Details');
    console.log('-' .repeat(40));
    console.log('Before confirming, check:');
    console.log('✓ Exchange rate (HBAR per HBARX)');
    console.log('✓ Price impact (should be low)');
    console.log('✓ Slippage tolerance (usually 0.5-2%)');
    console.log('✓ Estimated gas fees');
    console.log('');
    
    console.log('✅ STEP 6: Execute the Swap');
    console.log('-' .repeat(40));
    console.log('1. Click "Swap" button');
    console.log('2. Review the transaction details in HashPack');
    console.log('3. Confirm the transaction');
    console.log('4. Wait for confirmation (3-5 seconds)');
    console.log('');
    
    console.log('🎉 STEP 7: After Successful Swap');
    console.log('-' .repeat(40));
    console.log('1. Verify HBARX tokens in your wallet');
    console.log('2. Run the complete workflow to deposit into Bonzo:');
    console.log('   npx hardhat run scripts/completeHBARtoHBARXWorkflow.js --network hedera-testnet');
    console.log('');
    
    console.log('💡 HELPFUL TIPS');
    console.log('-' .repeat(40));
    console.log('🔥 About HBARX:');
    console.log('   - Liquid staking token by Stader Labs');
    console.log('   - Represents staked HBAR earning rewards');
    console.log('   - Can be used in DeFi while earning staking rewards');
    console.log('');
    console.log('⚡ Transaction Info:');
    console.log('   - Fees: Less than $0.01 USD');
    console.log('   - Speed: 3-5 seconds confirmation');
    console.log('   - Network: Hedera Testnet');
    console.log('');
    console.log('🔄 Alternative Methods:');
    console.log('   - Direct staking on Stader Labs platform');
    console.log('   - Other DEXs supporting HBARX (if available)');
    console.log('');
    
    console.log('🆘 TROUBLESHOOTING');
    console.log('-' .repeat(40));
    console.log('❌ If HBARX is not found on SaucerSwap:');
    console.log('   1. Verify you\'re on testnet.saucerswap.finance');
    console.log('   2. Check if HBARX is available on testnet');
    console.log('   3. Try searching by token ID: 0.0.2231533');
    console.log('   4. Contact SaucerSwap support if needed');
    console.log('');
    console.log('❌ If swap fails:');
    console.log('   1. Check you have enough HBAR for gas fees');
    console.log('   2. Reduce swap amount and try again');
    console.log('   3. Increase slippage tolerance slightly');
    console.log('   4. Ensure sufficient liquidity exists');
    console.log('');
    
    console.log('📚 USEFUL LINKS');
    console.log('-' .repeat(40));
    console.log('🌐 SaucerSwap Testnet: https://testnet.saucerswap.finance/');
    console.log('📖 SaucerSwap Docs: https://docs.saucerswap.finance/');
    console.log('🔥 Stader Labs: https://staderlabs.com/');
    console.log('💰 Bonzo Finance: https://bonzo.finance/');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error in HBAR to HBARX guide:', error.message);
  }
}

// Function to check if HBARX swap was successful
async function checkHBARXSwapStatus() {
  console.log('🔍 Checking HBARX Swap Status...');
  
  try {
    const [signer] = await ethers.getSigners();
    const hbarxAddress = ethers.utils.getAddress(tokenIdToAddress(HBARX_TOKEN_ID));
    const hbarxContract = new ethers.Contract(hbarxAddress, ERC20_ABI, signer);
    
    const hbarxBalance = await hbarxContract.balanceOf(signer.address);
    const hbarxDecimals = await hbarxContract.decimals();
    const hbarxSymbol = await hbarxContract.symbol();
    
    console.log(`🔥 ${hbarxSymbol} Balance:`, ethers.utils.formatUnits(hbarxBalance, hbarxDecimals));
    
    if (hbarxBalance.gt(0)) {
      console.log('✅ HBARX swap successful!');
      console.log('📋 Next step: Deposit to Bonzo Finance');
      console.log('   npx hardhat run scripts/completeHBARtoHBARXWorkflow.js --network hedera-testnet');
    } else {
      console.log('❌ No HBARX found. Please complete the swap first.');
    }
    
  } catch (error) {
    console.log('❌ Unable to check HBARX balance:', error.message);
  }
}

// Quick function to show current balances
async function showCurrentBalances() {
  const [signer] = await ethers.getSigners();
  
  console.log('💰 Current Balances:');
  console.log('Account:', signer.address);
  
  // HBAR balance
  const hbarBalance = await signer.getBalance();
  console.log('HBAR:', ethers.utils.formatEther(hbarBalance));
  
  // HBARX balance
  try {
    const hbarxAddress = ethers.utils.getAddress(tokenIdToAddress(HBARX_TOKEN_ID));
    const hbarxContract = new ethers.Contract(hbarxAddress, ERC20_ABI, signer);
    const hbarxBalance = await hbarxContract.balanceOf(signer.address);
    const hbarxDecimals = await hbarxContract.decimals();
    console.log('HBARX:', ethers.utils.formatUnits(hbarxBalance, hbarxDecimals));
  } catch (error) {
    console.log('HBARX: 0.0 (or unable to check)');
  }
}

// Main execution
if (require.main === module) {
  saucerSwapHBARtoHBARX()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  saucerSwapHBARtoHBARX,
  checkHBARXSwapStatus,
  showCurrentBalances,
  tokenIdToAddress
};