const { ethers } = require("hardhat");

async function main() {
    console.log('🧪 Testing Direct HBAR to HBARX Swap');
    console.log('=' .repeat(50));
    
    const [signer] = await ethers.getSigners();
    const myAddress = await signer.getAddress();
    
    console.log('👤 Testing with address:', myAddress);
    
    // Use the working router address
    const SAUCERSWAP_ROUTER = '0x0000000000000000000000000000000000004b40'; // 0.0.19264
    const WHBAR_ADDRESS = '0x0000000000000000000000000000000000003aD1';
    const HBARX_ADDRESS = '0x0000000000000000000000000000000000220cED';
    
    console.log('\n📋 Contract Addresses:');
    console.log('🔗 SaucerSwap Router:', SAUCERSWAP_ROUTER);
    console.log('🔗 WHBAR:', WHBAR_ADDRESS);
    console.log('🔗 HBARX:', HBARX_ADDRESS);
    
    // Router ABI
    const ROUTER_ABI = [
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
    ];
    
    // ERC20 ABI for balance checks
    const ERC20_ABI = [
        'function balanceOf(address) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
    ];
    
    try {
        // Check initial balances
        const hbarBalance = await signer.getBalance();
        console.log('\n💰 Initial HBAR Balance:', ethers.utils.formatEther(hbarBalance), 'HBAR');
        
        const hbarxContract = new ethers.Contract(HBARX_ADDRESS, ERC20_ABI, signer);
        const initialHbarxBalance = await hbarxContract.balanceOf(myAddress);
        const hbarxDecimals = await hbarxContract.decimals();
        console.log('🔥 Initial HBARX Balance:', ethers.utils.formatUnits(initialHbarxBalance, hbarxDecimals), 'HBARX');
        
        if (hbarBalance.lt(ethers.utils.parseEther('0.1'))) {
            console.log('❌ Insufficient HBAR balance for swap!');
            return;
        }
        
        const routerContract = new ethers.Contract(SAUCERSWAP_ROUTER, ROUTER_ABI, signer);
        
        // Test with a small amount first
        const swapAmount = ethers.utils.parseEther('0.1'); // 0.1 HBAR
        const path = [WHBAR_ADDRESS, HBARX_ADDRESS];
        
        console.log('\n🔍 Step 1: Getting Expected Output');
        try {
            const amounts = await routerContract.getAmountsOut(swapAmount, path);
            const expectedHBARX = amounts[1];
            console.log('✅ Expected HBARX output:', ethers.utils.formatUnits(expectedHBARX, hbarxDecimals), 'HBARX');
            
            if (expectedHBARX.eq(0)) {
                console.log('❌ Expected output is 0 - no liquidity or invalid path');
                return;
            }
            
            // Calculate minimum output with 5% slippage
            const minHBARX = expectedHBARX.mul(95).div(100);
            console.log('📉 Minimum HBARX (5% slippage):', ethers.utils.formatUnits(minHBARX, hbarxDecimals), 'HBARX');
            
            console.log('\n🔄 Step 2: Executing Swap');
            const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
            
            const swapTx = await routerContract.swapExactETHForTokens(
                minHBARX,
                path,
                myAddress,
                deadline,
                { 
                    value: swapAmount,
                    gasLimit: 500000
                }
            );
            
            console.log('⏳ Transaction hash:', swapTx.hash);
            console.log('⏳ Waiting for confirmation...');
            
            const receipt = await swapTx.wait();
            
            if (receipt.status === 1) {
                console.log('✅ Swap completed successfully!');
                
                // Check final balances
                const finalHbarxBalance = await hbarxContract.balanceOf(myAddress);
                const hbarxGained = finalHbarxBalance.sub(initialHbarxBalance);
                
                console.log('\n🎉 Swap Results:');
                console.log('💱 HBAR Used:', ethers.utils.formatEther(swapAmount), 'HBAR');
                console.log('🔥 HBARX Received:', ethers.utils.formatUnits(hbarxGained, hbarxDecimals), 'HBARX');
                console.log('📊 Final HBARX Balance:', ethers.utils.formatUnits(finalHbarxBalance, hbarxDecimals), 'HBARX');
                
            } else {
                console.log('❌ Transaction failed with status:', receipt.status);
            }
            
        } catch (error) {
            console.log('❌ getAmountsOut failed:', error.message.split('\n')[0]);
            console.log('💡 This suggests the HBAR/HBARX pair might not exist on this router');
        }
        
    } catch (error) {
        console.error('❌ Error during swap process:', error.message);
        
        if (error.message.includes('CALL_EXCEPTION')) {
            console.log('\n💡 Possible issues:');
            console.log('   - HBAR/HBARX liquidity pool does not exist');
            console.log('   - Router contract is not compatible');
            console.log('   - Network connectivity issues');
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });