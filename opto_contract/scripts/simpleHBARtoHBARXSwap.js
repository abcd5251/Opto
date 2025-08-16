const { ethers } = require("hardhat");

async function main() {
  console.log('🔄 Simple HBAR to HBARX Swap via SaucerSwap');
  console.log('=' .repeat(50));
  
  // Get signer
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log('📝 Account:', myAddress);
  
  // Contract addresses for Hedera testnet
  const SAUCERSWAP_ROUTER = '0x17934dcF52d9027c6B4f0897E0dE4b4Ff5D7e0b9';
  const WHBAR_ADDRESS = '0x0000000000000000000000000000000000003aD2';
  const HBARX_ADDRESS = '0x0000000000000000000000000000000000220cED';
  
  // Simplified Router ABI for swaps
  const ROUTER_ABI = [
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
  ];
  
  // Basic ERC20 ABI for balance checks
  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];
  
  try {
    // Check HBAR balance
    const hbarBalance = await signer.getBalance();
    const hbarFormatted = ethers.utils.formatEther(hbarBalance);
    console.log('💰 HBAR Balance:', hbarFormatted, 'HBAR');
    
    if (hbarBalance.lt(ethers.utils.parseEther('1'))) {
      console.log('❌ Insufficient HBAR balance for swap!');
      console.log('💡 You need at least 1 HBAR to perform a swap');
      return;
    }
    
    // Amount to swap (1 HBAR)
    const swapAmount = ethers.utils.parseEther('1');
    console.log('💱 Swapping 1 HBAR for HBARX...');
    
    // Initialize router contract
    const routerContract = new ethers.Contract(SAUCERSWAP_ROUTER, ROUTER_ABI, signer);
    
    // Check if we can get HBARX balance (optional, for comparison)
    let initialHbarxBalance = ethers.BigNumber.from(0);
    try {
      const hbarxContract = new ethers.Contract(HBARX_ADDRESS, ERC20_ABI, signer);
      initialHbarxBalance = await hbarxContract.balanceOf(myAddress);
      const hbarxDecimals = await hbarxContract.decimals();
      const hbarxFormatted = ethers.utils.formatUnits(initialHbarxBalance, hbarxDecimals);
      console.log('🔥 Initial HBARX Balance:', hbarxFormatted, 'HBARX');
    } catch (error) {
      console.log('⚠️  Could not check initial HBARX balance:', error.message.split('\n')[0]);
    }
    
    // Method 1: Try direct HBAR to HBARX swap
    console.log('\n🔄 Attempting direct HBAR to HBARX swap...');
    const directPath = [WHBAR_ADDRESS, HBARX_ADDRESS];
    
    try {
      // Get expected output
      const amountsOut = await routerContract.getAmountsOut(swapAmount, directPath);
      const expectedHBARX = amountsOut[1];
      const minAmountOut = expectedHBARX.mul(95).div(100); // 5% slippage tolerance
      
      console.log('📈 Expected HBARX output:', ethers.utils.formatUnits(expectedHBARX, 8));
      
      // Execute swap
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
      
      const swapTx = await routerContract.swapExactETHForTokens(
        minAmountOut,
        directPath,
        myAddress,
        deadline,
        { 
          value: swapAmount, 
          gasLimit: 800000,
          gasPrice: ethers.utils.parseUnits('20', 'gwei')
        }
      );
      
      console.log('⏳ Swap transaction submitted:', swapTx.hash);
      console.log('🔗 View on HashScan: https://hashscan.io/testnet/transaction/' + swapTx.hash);
      
      const receipt = await swapTx.wait();
      
      if (receipt.status === 1) {
        console.log('✅ Swap completed successfully!');
        
        // Check final balances
        const finalHbarBalance = await signer.getBalance();
        const finalHbarFormatted = ethers.utils.formatEther(finalHbarBalance);
        console.log('💰 Final HBAR Balance:', finalHbarFormatted, 'HBAR');
        
        try {
          const hbarxContract = new ethers.Contract(HBARX_ADDRESS, ERC20_ABI, signer);
          const finalHbarxBalance = await hbarxContract.balanceOf(myAddress);
          const hbarxDecimals = await hbarxContract.decimals();
          const finalHbarxFormatted = ethers.utils.formatUnits(finalHbarxBalance, hbarxDecimals);
          const hbarxGained = finalHbarxBalance.sub(initialHbarxBalance);
          const hbarxGainedFormatted = ethers.utils.formatUnits(hbarxGained, hbarxDecimals);
          
          console.log('🔥 Final HBARX Balance:', finalHbarxFormatted, 'HBARX');
          console.log('📈 HBARX Gained:', hbarxGainedFormatted, 'HBARX');
        } catch (error) {
          console.log('⚠️  Could not check final HBARX balance');
        }
        
        console.log('\n🎉 Swap Summary:');
        console.log('   ✅ Successfully swapped 1 HBAR for HBARX');
        console.log('   📋 Transaction Hash:', receipt.transactionHash);
        console.log('   ⛽ Gas Used:', receipt.gasUsed.toString());
        
      } else {
        console.log('❌ Swap transaction failed');
      }
      
    } catch (swapError) {
      console.log('❌ Direct swap failed:', swapError.message.split('\n')[0]);
      
      if (swapError.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
        console.log('💡 This usually means:');
        console.log('   - Insufficient liquidity in the HBAR/HBARX pool');
        console.log('   - High slippage due to large trade size');
        console.log('   - Try reducing the swap amount or increasing slippage tolerance');
      } else if (swapError.message.includes('CALL_EXCEPTION')) {
        console.log('💡 This might be due to:');
        console.log('   - Network connectivity issues');
        console.log('   - SaucerSwap router not available');
        console.log('   - Incorrect contract addresses');
      }
      
      console.log('\n🔄 Alternative Solutions:');
      console.log('1. 🌐 Use SaucerSwap Web Interface:');
      console.log('   - Visit: https://testnet.saucerswap.finance/');
      console.log('   - Manually swap HBAR for HBARX');
      
      console.log('\n2. 🔄 Try Two-Step Swap:');
      console.log('   - First: HBAR → USDC');
      console.log('   - Then: USDC → HBARX');
      console.log('   - This might have better liquidity');
      
      console.log('\n3. ⏰ Try Again Later:');
      console.log('   - Network issues might be temporary');
      console.log('   - Liquidity pools might be replenished');
    }
    
  } catch (error) {
    console.error('❌ Error during swap process:', error.message.split('\n')[0]);
    
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check your internet connection');
    console.log('2. Verify you\'re connected to Hedera testnet');
    console.log('3. Ensure you have sufficient HBAR for gas fees');
    console.log('4. Try again in a few minutes');
    
    console.log('\n📞 Need Help?');
    console.log('- SaucerSwap Discord: https://discord.gg/saucerswap');
    console.log('- Hedera Discord: https://discord.gg/hedera');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });