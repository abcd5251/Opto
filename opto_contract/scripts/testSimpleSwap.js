const { ethers } = require("hardhat");

async function main() {
    console.log('🧪 Testing Simple HBAR to HBARX Swap');
    console.log('=' .repeat(50));
    
    const [signer] = await ethers.getSigners();
    const myAddress = await signer.getAddress();
    
    console.log('👤 Testing with address:', myAddress);
    
    // Contract addresses
    const SAUCERSWAP_ROUTER = '0x0000000000000000000000000000000000159208';
    const WHBAR_ADDRESS = '0x0000000000000000000000000000000000003aD1';
    const HBARX_ADDRESS = '0x0000000000000000000000000000000000220cED';
    
    console.log('\n📋 Contract Addresses:');
    console.log('🔗 SaucerSwap Router:', SAUCERSWAP_ROUTER);
    console.log('🔗 WHBAR:', WHBAR_ADDRESS);
    console.log('🔗 HBARX:', HBARX_ADDRESS);
    
    // Check initial HBAR balance
    const initialBalance = await signer.getBalance();
    console.log('\n💰 Initial HBAR Balance:', ethers.utils.formatEther(initialBalance), 'HBAR');
    
    // Router ABI for swapExactETHForTokens
    const routerABI = [
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
    ];
    
    const router = new ethers.Contract(SAUCERSWAP_ROUTER, routerABI, signer);
    
    // Test 1: Check if we can get expected output
    console.log('\n🔍 Test 1: Checking Expected Output');
    console.log('-' .repeat(30));
    
    const testAmount = ethers.utils.parseEther('0.1'); // 0.1 HBAR
    const path = [WHBAR_ADDRESS, HBARX_ADDRESS];
    
    try {
        const amounts = await router.getAmountsOut(testAmount, path);
        console.log('✅ Expected output for', ethers.utils.formatEther(testAmount), 'HBAR:');
        console.log('   Input HBAR:', ethers.utils.formatEther(amounts[0]));
        console.log('   Output HBARX:', ethers.utils.formatUnits(amounts[1], 8));
    } catch (error) {
        console.log('❌ Failed to get expected output:', error.message.split('\n')[0]);
        console.log('💡 This suggests the liquidity pool might not exist or router is incorrect');
        return;
    }
    
    // Test 2: Attempt actual swap
    console.log('\n🔄 Test 2: Attempting Actual Swap');
    console.log('-' .repeat(30));
    
    const swapAmount = ethers.utils.parseEther('0.1'); // 0.1 HBAR
    const minAmountOut = 0; // Accept any amount for testing
    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes
    
    console.log('💱 Swapping', ethers.utils.formatEther(swapAmount), 'HBAR for HBARX...');
    
    try {
        const tx = await router.swapExactETHForTokens(
            minAmountOut,
            path,
            myAddress,
            deadline,
            {
                value: swapAmount,
                gasLimit: 500000
            }
        );
        
        console.log('⏳ Transaction submitted:', tx.hash);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log('🎉 Swap successful!');
            console.log('📋 Transaction Hash:', receipt.transactionHash);
            console.log('⛽ Gas Used:', receipt.gasUsed.toString());
            
            // Check HBARX balance
            const hbarxABI = ['function balanceOf(address) view returns (uint256)'];
            const hbarxContract = new ethers.Contract(HBARX_ADDRESS, hbarxABI, signer);
            const hbarxBalance = await hbarxContract.balanceOf(myAddress);
            console.log('🔥 HBARX Balance:', ethers.utils.formatUnits(hbarxBalance, 8), 'HBARX');
        } else {
            console.log('❌ Swap failed - transaction reverted');
        }
    } catch (error) {
        console.log('❌ Swap failed:', error.message.split('\n')[0]);
        
        if (error.message.includes('CALL_EXCEPTION')) {
            console.log('💡 This might indicate:');
            console.log('   - Insufficient liquidity in the pool');
            console.log('   - Incorrect router address');
            console.log('   - Network connectivity issues');
        }
    }
    
    console.log('\n✅ Simple swap test completed');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });