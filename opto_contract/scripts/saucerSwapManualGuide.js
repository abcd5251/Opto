const { ethers } = require('hardhat');

async function main() {
    console.log('\n=== SaucerSwap HBAR to USDC Manual Swap Guide ===\n');
    
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log('Account:', signer.address);
    
    // Check HBAR balance
    const hbarBalance = await signer.provider.getBalance(signer.address);
    console.log('HBAR Balance:', ethers.utils.formatEther(hbarBalance), 'HBAR');
    
    // USDC token address on Hedera testnet (from Bonzo Finance supported tokens)
    const usdcAddress = '0x0000000000000000000000000000000000068cDa'; // USDC on testnet
    
    // Check USDC balance
    const usdcAbi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
    ];
    
    try {
        const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, signer);
        const usdcBalance = await usdcContract.balanceOf(signer.address);
        const usdcDecimals = await usdcContract.decimals();
        const usdcSymbol = await usdcContract.symbol();
        
        console.log(`${usdcSymbol} Balance:`, ethers.utils.formatUnits(usdcBalance, usdcDecimals), usdcSymbol);
        
        if (usdcBalance > 0) {
            console.log('\n✅ You already have USDC! You can proceed to deposit it into Bonzo Finance.');
            console.log('\nTo deposit USDC to Bonzo Finance, run:');
            console.log('npx hardhat run scripts/depositUSDCtoBonzo.js --network hedera-testnet');
            return;
        }
    } catch (error) {
        console.log('USDC Balance: 0 USDC (or token not associated)');
    }
    
    console.log('\n=== Manual Swap Instructions ===\n');
    
    console.log('Since automated router interaction is not working, please follow these steps:');
    console.log('\n1. 🌐 Open SaucerSwap Testnet:');
    console.log('   https://testnet.saucerswap.finance/');
    
    console.log('\n2. 🔗 Connect Your Wallet:');
    console.log('   - Click "Connect Wallet"');
    console.log('   - Select HashPack or your preferred Hedera wallet');
    console.log('   - Make sure you\'re connected to Hedera Testnet');
    
    console.log('\n3. 💱 Perform the Swap:');
    console.log('   - In the "From" field, select HBAR');
    console.log('   - In the "To" field, select USDC');
    console.log('   - Enter the amount of HBAR you want to swap (e.g., 10 HBAR)');
    console.log('   - Review the estimated USDC you\'ll receive');
    console.log('   - Click "Swap" and confirm the transaction in your wallet');
    
    console.log('\n4. ✅ Verify the Swap:');
    console.log('   - Wait for the transaction to complete (usually 3-5 seconds)');
    console.log('   - Check that USDC appears in your wallet');
    console.log('   - You may need to associate the USDC token first if prompted');
    
    console.log('\n5. 🏦 Deposit to Bonzo Finance:');
    console.log('   - After you have USDC, run this script again');
    console.log('   - Or run: npx hardhat run scripts/depositUSDCtoBonzo.js --network hedera-testnet');
    
    console.log('\n=== Important Notes ===\n');
    console.log('• Make sure you have enough HBAR for transaction fees (~0.1 HBAR)');
    console.log('• USDC Token ID on testnet: 0.0.429274');
    console.log('• SaucerSwap uses very low fees (<$0.01 per transaction)');
    console.log('• Transactions are usually confirmed within 3-5 seconds');
    
    console.log('\n=== Alternative Tokens ===\n');
    console.log('If USDC is not available, you can also swap HBAR for these Bonzo-supported tokens:');
    console.log('• SAUCE (SaucerSwap native token)');
    console.log('• XSAUCE (Staked SAUCE)');
    console.log('• HBARX (Staked HBAR)');
    console.log('• KARATE (Community token)');
    
    console.log('\n=== Troubleshooting ===\n');
    console.log('• If tokens don\'t appear: Try refreshing the page and reconnecting wallet');
    console.log('• If swap fails: Check you have enough HBAR for fees');
    console.log('• If USDC doesn\'t show: You may need to associate the token first');
    console.log('• For help: Visit SaucerSwap Discord or Telegram community');
    
    console.log('\n🎯 Goal: Get USDC → Deposit to Bonzo Finance for lending');
    console.log('\nOnce you complete the manual swap, this script will detect your USDC and guide you to deposit it!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });