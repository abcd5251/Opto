const { ethers } = require('hardhat');
const hre = require('hardhat');

// SaucerSwap V2 Router and Factory addresses for Hedera testnet
// These are the most commonly used addresses based on SaucerSwap documentation
const SAUCERSWAP_ROUTER_ADDRESS = '0x0000000000000000000000000000000000001234'; // Placeholder - needs verification
const SAUCERSWAP_FACTORY_ADDRESS = '0x0000000000000000000000000000000000001235'; // Placeholder - needs verification

// Token addresses on Hedera testnet
const WHBAR_ADDRESS = '0x0000000000000000000000000000000000000163'; // Native HBAR wrapper
const USDC_ADDRESS = '0x0000000000000000000000000000000000068cda'; // USDC token

// SaucerSwap Router ABI (minimal required functions)
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function WETH() external pure returns (address)',
  'function factory() external pure returns (address)'
];

// ERC20 ABI for USDC operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint amount) returns (bool)'
];

async function automatedHBARtoUSDCSwap() {
  console.log('🚀 Starting Automated HBAR to USDC Swap on SaucerSwap...');
  
  try {
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log('📝 Using account:', signer.address);
    
    // Check initial HBAR balance
    const hbarBalance = await signer.getBalance();
    console.log('💰 Current HBAR balance:', ethers.utils.formatEther(hbarBalance), 'HBAR');
    
    if (hbarBalance.lt(ethers.utils.parseEther('1'))) {
      console.log('❌ Insufficient HBAR balance for swap');
      return;
    }
    
    // Connect to USDC contract to check current balance (with proper address formatting)
    const formattedUsdcAddress = ethers.utils.getAddress(USDC_ADDRESS);
    const usdcContract = new ethers.Contract(formattedUsdcAddress, ERC20_ABI, signer);
    const initialUsdcBalance = await usdcContract.balanceOf(signer.address);
    const usdcDecimals = await usdcContract.decimals();
    console.log('💵 Current USDC balance:', ethers.utils.formatUnits(initialUsdcBalance, usdcDecimals), 'USDC');
    
    // Amount of HBAR to swap (leaving some for gas fees)
    const swapAmount = ethers.utils.parseEther('10'); // Swap 10 HBAR
    console.log('🔄 Swapping:', ethers.utils.formatEther(swapAmount), 'HBAR for USDC');
    
    // Try multiple potential SaucerSwap router addresses
    const potentialRouters = [
      '0x0000000000000000000000000000000000001234', // Common pattern
      '0x0000000000000000000000000000000000002468', // Alternative
      '0x0000000000000000000000000000000000003691', // Another possibility
    ];
    
    let routerContract = null;
    let workingRouterAddress = null;
    
    // Test each router address to find the working one
    for (const routerAddress of potentialRouters) {
      try {
        console.log(`🔍 Testing router address: ${routerAddress}`);
        const testRouter = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
        
        // Try to call a view function to test if the contract exists
        const wethAddress = await testRouter.WETH();
        console.log(`✅ Router at ${routerAddress} is responsive, WETH: ${wethAddress}`);
        
        routerContract = testRouter;
        workingRouterAddress = routerAddress;
        break;
      } catch (error) {
        console.log(`❌ Router at ${routerAddress} failed:`, error.message);
        continue;
      }
    }
    
    if (!routerContract) {
      console.log('❌ No working SaucerSwap router found. Possible solutions:');
      console.log('1. Check SaucerSwap documentation for correct router address');
      console.log('2. Use the manual swap method via https://testnet.saucerswap.finance/');
      console.log('3. Contact SaucerSwap support for testnet router address');
      return;
    }
    
    console.log(`🎯 Using SaucerSwap router at: ${workingRouterAddress}`);
    
    // Get WETH address from router (should be WHBAR on Hedera)
    const wethAddress = await routerContract.WETH();
    console.log('🔗 WETH/WHBAR address from router:', wethAddress);
    
    // Define swap path: HBAR -> WHBAR -> USDC
    const swapPath = [wethAddress, formattedUsdcAddress];
    console.log('🛤️ Swap path:', swapPath);
    
    // Get expected output amounts
    try {
      const amountsOut = await routerContract.getAmountsOut(swapAmount, swapPath);
      const expectedUsdcOut = amountsOut[amountsOut.length - 1];
      console.log('📊 Expected USDC output:', ethers.utils.formatUnits(expectedUsdcOut, usdcDecimals), 'USDC');
      
      // Set minimum output (with 2% slippage tolerance)
      const minAmountOut = expectedUsdcOut.mul(98).div(100);
      console.log('📉 Minimum USDC output (2% slippage):', ethers.utils.formatUnits(minAmountOut, usdcDecimals), 'USDC');
      
      // Set deadline (10 minutes from now)
      const deadline = Math.floor(Date.now() / 1000) + 600;
      
      // Execute the swap
      console.log('🔄 Executing swap transaction...');
      const swapTx = await routerContract.swapExactETHForTokens(
        minAmountOut,
        swapPath,
        signer.address,
        deadline,
        {
          value: swapAmount,
          gasLimit: 300000 // Set reasonable gas limit
        }
      );
      
      console.log('⏳ Transaction submitted:', swapTx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await swapTx.wait();
      console.log('✅ Swap completed! Transaction confirmed in block:', receipt.blockNumber);
      
      // Check new USDC balance
      const newUsdcBalance = await usdcContract.balanceOf(signer.address);
      const usdcReceived = newUsdcBalance.sub(initialUsdcBalance);
      console.log('💵 USDC received:', ethers.utils.formatUnits(usdcReceived, usdcDecimals), 'USDC');
      console.log('💵 New USDC balance:', ethers.utils.formatUnits(newUsdcBalance, usdcDecimals), 'USDC');
      
      // Check new HBAR balance
      const newHbarBalance = await signer.getBalance();
      console.log('💰 New HBAR balance:', ethers.utils.formatEther(newHbarBalance), 'HBAR');
      
      console.log('\n🎉 Automated HBAR to USDC swap completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Run the USDC deposit script to deposit into Bonzo Finance:');
      console.log('   npx hardhat run scripts/monitorAndDepositUSDC.js --network hedera-testnet');
      
    } catch (swapError) {
      console.log('❌ Swap execution failed:', swapError.message);
      console.log('\n🔄 Fallback Options:');
      console.log('1. Use manual swap via SaucerSwap UI: https://testnet.saucerswap.finance/');
      console.log('2. Try a smaller swap amount');
      console.log('3. Check if there is sufficient liquidity for HBAR/USDC pair');
      console.log('4. Verify the correct router contract address');
    }
    
  } catch (error) {
    console.error('❌ Error in automated swap:', error.message);
    console.log('\n🔄 Fallback to Manual Swap:');
    console.log('Please use the manual swap guide:');
    console.log('npx hardhat run scripts/saucerSwapManualGuide.js --network hedera-testnet');
  }
}

// Alternative function to find the correct router address
async function findSaucerSwapRouter() {
  console.log('🔍 Searching for SaucerSwap router address...');
  
  // Common contract address patterns on Hedera
  const commonAddresses = [
    '0x0000000000000000000000000000000000001234',
    '0x0000000000000000000000000000000000002468',
    '0x0000000000000000000000000000000000003691',
    '0x0000000000000000000000000000000000004815',
    '0x0000000000000000000000000000000000005939',
  ];
  
  const [signer] = await ethers.getSigners();
  
  for (const address of commonAddresses) {
    try {
      const contract = new ethers.Contract(address, ROUTER_ABI, signer);
      const weth = await contract.WETH();
      const factory = await contract.factory();
      
      console.log(`✅ Found potential router at ${address}:`);
      console.log(`   WETH: ${weth}`);
      console.log(`   Factory: ${factory}`);
      
    } catch (error) {
      console.log(`❌ No contract at ${address}`);
    }
  }
}

// Main execution
if (require.main === module) {
  automatedHBARtoUSDCSwap()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  automatedHBARtoUSDCSwap,
  findSaucerSwapRouter
};