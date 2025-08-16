const { ethers } = require('hardhat');
const hre = require('hardhat');

// Known token addresses on Hedera testnet
const WHBAR_TOKEN_ID = '0.0.99'; // WHBAR token ID
const USDC_TOKEN_ID = '0.0.429274'; // USDC token ID
const SAUCE_TOKEN_ID = '0.0.731861'; // SAUCE token ID

// Convert Hedera token ID to EVM address format
function tokenIdToAddress(tokenId) {
  const parts = tokenId.split('.');
  const tokenNum = parseInt(parts[2]);
  return '0x' + tokenNum.toString(16).padStart(40, '0');
}

// ERC20 ABI for token operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint amount) returns (bool)'
];

// Potential SaucerSwap router addresses to try
const POTENTIAL_ROUTERS = [
  '0x0000000000000000000000000000000000000001', // Common pattern
  '0x0000000000000000000000000000000000000002',
  '0x0000000000000000000000000000000000000003',
  '0x0000000000000000000000000000000000000004',
  '0x0000000000000000000000000000000000000005',
  '0x0000000000000000000000000000000000001000',
  '0x0000000000000000000000000000000000002000',
  '0x0000000000000000000000000000000000003000',
];

// Router ABI (minimal)
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function WETH() external pure returns (address)',
  'function factory() external pure returns (address)'
];

async function hybridHBARtoUSDCSwap() {
  console.log('🚀 Starting Hybrid HBAR to USDC Swap Process...');
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('📝 Using account:', signer.address);
    
    // Check balances
    const hbarBalance = await signer.getBalance();
    console.log('💰 Current HBAR balance:', ethers.utils.formatEther(hbarBalance), 'HBAR');
    
    // Check USDC balance
    const usdcAddress = ethers.utils.getAddress(tokenIdToAddress(USDC_TOKEN_ID));
    const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
    
    try {
      const usdcBalance = await usdcContract.balanceOf(signer.address);
      const usdcDecimals = await usdcContract.decimals();
      console.log('💵 Current USDC balance:', ethers.utils.formatUnits(usdcBalance, usdcDecimals), 'USDC');
      
      if (usdcBalance.gt(0)) {
        console.log('✅ You already have USDC! You can proceed directly to deposit into Bonzo Finance.');
        console.log('📋 Run: npx hardhat run scripts/monitorAndDepositUSDC.js --network hedera-testnet');
        return;
      }
    } catch (error) {
      console.log('⚠️ Could not check USDC balance, proceeding with swap...');
    }
    
    console.log('\n🔍 Attempting to find SaucerSwap router...');
    
    // Try to find a working router
    let workingRouter = null;
    for (const routerAddress of POTENTIAL_ROUTERS) {
      try {
        console.log(`Testing router: ${routerAddress}`);
        const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
        
        // Test if the contract responds
        const weth = await router.WETH();
        console.log(`✅ Found working router at ${routerAddress}, WETH: ${weth}`);
        workingRouter = { address: routerAddress, contract: router, weth };
        break;
      } catch (error) {
        console.log(`❌ Router at ${routerAddress} not working`);
      }
    }
    
    if (workingRouter) {
      console.log('\n🎯 Attempting automated swap...');
      await attemptAutomatedSwap(workingRouter, signer, usdcAddress);
    } else {
      console.log('\n❌ No working SaucerSwap router found.');
      await showManualSwapInstructions(signer.address, hbarBalance);
    }
    
  } catch (error) {
    console.error('❌ Error in hybrid swap:', error.message);
    await showManualSwapInstructions();
  }
}

async function attemptAutomatedSwap(router, signer, usdcAddress) {
  try {
    const swapAmount = ethers.utils.parseEther('5'); // Swap 5 HBAR
    const path = [router.weth, usdcAddress];
    
    console.log('📊 Getting swap quote...');
    const amountsOut = await router.contract.getAmountsOut(swapAmount, path);
    const expectedUsdc = amountsOut[1];
    
    console.log('💱 Expected USDC output:', ethers.utils.formatUnits(expectedUsdc, 6), 'USDC');
    
    // Set slippage tolerance (5%)
    const minAmountOut = expectedUsdc.mul(95).div(100);
    const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes
    
    console.log('🔄 Executing swap...');
    const tx = await router.contract.swapExactETHForTokens(
      minAmountOut,
      path,
      signer.address,
      deadline,
      { value: swapAmount, gasLimit: 300000 }
    );
    
    console.log('⏳ Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Swap completed in block:', receipt.blockNumber);
    
    // Check new USDC balance
    const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
    const newUsdcBalance = await usdcContract.balanceOf(signer.address);
    console.log('💵 New USDC balance:', ethers.utils.formatUnits(newUsdcBalance, 6), 'USDC');
    
    console.log('\n🎉 Automated swap successful!');
    console.log('📋 Next step: Run deposit script');
    console.log('   npx hardhat run scripts/monitorAndDepositUSDC.js --network hedera-testnet');
    
  } catch (error) {
    console.log('❌ Automated swap failed:', error.message);
    await showManualSwapInstructions();
  }
}

async function showManualSwapInstructions(address, hbarBalance) {
  console.log('\n📋 MANUAL SWAP INSTRUCTIONS');
  console.log('=' .repeat(50));
  console.log('Since automated swap is not available, please follow these steps:');
  console.log('');
  console.log('1. 🌐 Visit SaucerSwap Testnet:');
  console.log('   https://testnet.saucerswap.finance/');
  console.log('');
  console.log('2. 🔗 Connect your HashPack wallet');
  console.log('   - Click "Connect Wallet"');
  console.log('   - Select HashPack');
  console.log('   - Approve the connection');
  console.log('');
  console.log('3. 💱 Perform the swap:');
  console.log('   - From: HBAR');
  console.log('   - To: USDC');
  if (hbarBalance) {
    const availableHbar = ethers.utils.formatEther(hbarBalance.sub(ethers.utils.parseEther('1')));
    console.log(`   - Amount: Up to ${availableHbar} HBAR (keep 1 HBAR for fees)`);
  }
  console.log('   - Review the swap details');
  console.log('   - Click "Swap" and confirm in HashPack');
  console.log('');
  console.log('4. ✅ After successful swap:');
  console.log('   - Wait for transaction confirmation');
  console.log('   - Run the deposit script:');
  console.log('     npx hardhat run scripts/monitorAndDepositUSDC.js --network hedera-testnet');
  console.log('');
  console.log('💡 Tips:');
  console.log('   - Transaction fees are less than $0.01');
  console.log('   - Transactions complete in 3-5 seconds');
  console.log('   - USDC Token ID: 0.0.429274');
  console.log('   - Keep some HBAR for future transaction fees');
  console.log('');
  console.log('🔄 Alternative tokens supported by Bonzo Finance:');
  console.log('   - SAUCE (0.0.731861)');
  console.log('   - XSAUCE, HBARX, KARATE');
  console.log('');
}

// Quick balance checker function
async function checkBalances() {
  const [signer] = await ethers.getSigners();
  const hbarBalance = await signer.getBalance();
  
  console.log('💰 Current balances:');
  console.log('   HBAR:', ethers.utils.formatEther(hbarBalance));
  
  // Check USDC
  try {
    const usdcAddress = ethers.utils.getAddress(tokenIdToAddress(USDC_TOKEN_ID));
    const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
    const usdcBalance = await usdcContract.balanceOf(signer.address);
    const usdcDecimals = await usdcContract.decimals();
    console.log('   USDC:', ethers.utils.formatUnits(usdcBalance, usdcDecimals));
  } catch (error) {
    console.log('   USDC: Unable to check');
  }
}

// Main execution
if (require.main === module) {
  hybridHBARtoUSDCSwap()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  hybridHBARtoUSDCSwap,
  checkBalances,
  tokenIdToAddress
};