const { ethers } = require("hardhat");

async function main() {
  console.log('🔄 Direct HBAR to HBARX Swap via SaucerSwap');
  console.log('=' .repeat(50));
  
  // Get signer
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log('📝 Account:', myAddress);
  
  // Contract addresses for Hedera testnet - Using SaucerSwap V2 Router
  const ROUTER_EVM = '0x0000000000000000000000000000000000159208'; // 0.0.1414040 (SaucerSwap V2)
  const WHBAR_EVM = '0x0000000000000000000000000000000000003ad1';  // 0.0.15057
  const HBARX_EVM = '0x0000000000000000000000000000000000220ced'; // 0.0.2231533
  
  // Router ABI (simplified, based on working example)
  const ROUTER_ABI = [
    "function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) payable returns (uint256[] memory amounts)"
  ];
  
  // ERC20 ABI for balance checks
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
    
    // Check initial HBARX balance
    const hbarxContract = new ethers.Contract(HBARX_EVM, ERC20_ABI, signer);
    const initialHbarxBalance = await hbarxContract.balanceOf(myAddress);
    const hbarxDecimals = await hbarxContract.decimals();
    const initialHbarxFormatted = ethers.utils.formatUnits(initialHbarxBalance, hbarxDecimals);
    console.log('🔥 Initial HBARX Balance:', initialHbarxFormatted, 'HBARX');
    
    // Amount to swap (0.1 HBAR for testing, like the working example)
    const hbarAmountDecimal = "0.1";
    const amountInWei = ethers.utils.parseUnits(hbarAmountDecimal, 18);
    console.log('💱 Swapping', hbarAmountDecimal, 'HBAR for HBARX...');
    
    // Initialize router contract
    const router = new ethers.Contract(ROUTER_EVM, ROUTER_ABI, signer);
    
    // Set up swap parameters (following working example)
    const amountOutMin = 0; // For demo - in production, set proper slippage
    const path = [WHBAR_EVM, HBARX_EVM]; // WHBAR -> HBARX
    const to = myAddress;
    const deadline = Math.floor(Date.now() / 1000) + (60 * 10); // 10 minutes
    
    console.log('🔄 Swap parameters:');
    console.log('   Path:', path);
    console.log('   Amount:', hbarAmountDecimal, 'HBAR');
    console.log('   Deadline:', new Date(deadline * 1000).toLocaleString());
    
    // Execute the swap
    console.log('\n⏳ Executing swap...');
    const tx = await router.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      {
        value: amountInWei,
        gasLimit: 500000 // Set reasonable gas limit
      }
    );
    
    console.log('📋 Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');
    console.log('   Status:', receipt.status === 1 ? 'Success' : 'Failed');
    console.log('   Gas Used:', receipt.gasUsed.toString());
    
    if (receipt.status === 1) {
      // Check final HBARX balance
      const finalHbarxBalance = await hbarxContract.balanceOf(myAddress);
      const finalHbarxFormatted = ethers.utils.formatUnits(finalHbarxBalance, hbarxDecimals);
      const hbarxGained = finalHbarxBalance.sub(initialHbarxBalance);
      const hbarxGainedFormatted = ethers.utils.formatUnits(hbarxGained, hbarxDecimals);
      
      console.log('\n🎉 Swap Summary:');
      console.log('   HBAR Used:', hbarAmountDecimal, 'HBAR');
      console.log('   HBARX Received:', hbarxGainedFormatted, 'HBARX');
      console.log('   Final HBARX Balance:', finalHbarxFormatted, 'HBARX');
      console.log('   Transaction Hash:', tx.hash);
    } else {
      console.log('❌ Swap transaction failed');
    }
    
  } catch (error) {
    console.error('❌ Error during swap:', error.message.split('\n')[0]);
    
    if (error.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
      console.log('\n💡 This usually means:');
      console.log('   - Insufficient liquidity in the HBAR/HBARX pool');
      console.log('   - High slippage due to large trade size');
      console.log('   - Try reducing the swap amount');
    } else if (error.message.includes('CALL_EXCEPTION')) {
      console.log('\n💡 This might be due to:');
      console.log('   - Network connectivity issues');
      console.log('   - SaucerSwap router not available');
      console.log('   - Incorrect contract addresses');
    }
    
    console.log('\n🌐 Alternative: Use SaucerSwap Web Interface');
    console.log('   Visit: https://testnet.saucerswap.finance/');
    console.log('   Manually swap HBAR for HBARX');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });