const { ethers } = require('hardhat');

async function main() {
    console.log('\n=== USDC Balance Monitor & Auto-Deposit to Bonzo Finance ===\n');
    
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log('Account:', signer.address);
    
    // USDC token address on Hedera testnet
    const usdcAddress = '0x0000000000000000000000000000000000068cDa';
    
    // Bonzo Finance Lending Pool address
    const lendingPoolAddress = '0x0000000000000000000000000000000000394C5A';
    
    // USDC contract
    const usdcAbi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function approve(address spender, uint256 amount) returns (bool)'
    ];
    
    // Lending Pool ABI (minimal)
    const lendingPoolAbi = [
        'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)'
    ];
    
    try {
        const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, signer);
        const lendingPool = new ethers.Contract(lendingPoolAddress, lendingPoolAbi, signer);
        
        // Check USDC balance
        const usdcBalance = await usdcContract.balanceOf(signer.address);
        const usdcDecimals = await usdcContract.decimals();
        const usdcSymbol = await usdcContract.symbol();
        
        console.log(`${usdcSymbol} Balance:`, ethers.utils.formatUnits(usdcBalance, usdcDecimals), usdcSymbol);
        
        if (usdcBalance.eq(0)) {
            console.log('\n❌ No USDC found in your wallet.');
            console.log('\nPlease complete the manual swap on SaucerSwap first:');
            console.log('1. Visit: https://testnet.saucerswap.finance/');
            console.log('2. Swap HBAR for USDC');
            console.log('3. Run this script again after the swap');
            console.log('\nOr run the guide script:');
            console.log('npx hardhat run scripts/saucerSwapManualGuide.js --network hedera-testnet');
            return;
        }
        
        console.log('\n✅ USDC detected! Proceeding with Bonzo Finance deposit...');
        
        // Step 1: Approve USDC for Lending Pool
        console.log('\n📝 Step 1: Approving USDC for Bonzo Finance...');
        const approveTx = await usdcContract.approve(lendingPoolAddress, usdcBalance);
        console.log('Approval transaction hash:', approveTx.hash);
        await approveTx.wait();
        console.log('✅ USDC approved successfully!');
        
        // Step 2: Deposit USDC to Lending Pool
        console.log('\n🏦 Step 2: Depositing USDC to Bonzo Finance...');
        const depositTx = await lendingPool.deposit(
            usdcAddress,
            usdcBalance,
            signer.address,
            0 // referral code
        );
        console.log('Deposit transaction hash:', depositTx.hash);
        await depositTx.wait();
        
        console.log('\n🎉 SUCCESS! USDC deposited to Bonzo Finance!');
        console.log(`✅ Deposited: ${ethers.utils.formatUnits(usdcBalance, usdcDecimals)} ${usdcSymbol}`);
        
        // Check final balance
        const finalBalance = await usdcContract.balanceOf(signer.address);
        console.log(`Remaining ${usdcSymbol} Balance:`, ethers.utils.formatUnits(finalBalance, usdcDecimals), usdcSymbol);
        
        console.log('\n=== Next Steps ===');
        console.log('• Your USDC is now earning interest in Bonzo Finance');
        console.log('• You can view your position on the Bonzo Finance dashboard');
        console.log('• You will receive aUSDC tokens representing your deposit');
        console.log('• You can withdraw your USDC + interest anytime');
        
    } catch (error) {
        console.error('\n❌ Error during deposit process:');
        
        if (error.message.includes('CALL_EXCEPTION')) {
            console.error('Transaction failed. Possible reasons:');
            console.error('• Insufficient USDC balance');
            console.error('• Network connectivity issues');
            console.error('• Contract interaction problems');
        } else if (error.message.includes('insufficient funds')) {
            console.error('Insufficient HBAR for transaction fees');
        } else {
            console.error('Error details:', error.message);
        }
        
        console.log('\n🔄 You can try running this script again after resolving the issue.');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });