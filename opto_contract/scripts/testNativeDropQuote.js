const { ethers } = require('hardhat');

async function main() {
    // Get the deployed contract
    const contractAddress = '0xC081e3CC49D5e4ac78486D2A40140a5cB81328de'; // Sepolia contract
    const MyOApp = await ethers.getContractFactory('MyOApp');
    const myOApp = MyOApp.attach(contractAddress);
    
    // Test parameters
    const dstEid = 40285; // Hedera testnet
    const message = 'Hello Hedera with native drop!';
    const receiver = '0x88cE2A88D4cdBC2b42D45748eC36103d6875dA91';
    
    // Try different native drop amounts
    const amounts = [
        ethers.utils.parseEther('0.001'), // 0.001 ETH
        ethers.utils.parseEther('0.005'), // 0.005 ETH
        ethers.utils.parseEther('0.01'),  // 0.01 ETH
        ethers.utils.parseEther('0.02'),  // 0.02 ETH
    ];
    
    for (const amount of amounts) {
        try {
            console.log(`\nTesting native drop amount: ${ethers.utils.formatEther(amount)} ETH`);
            
            const quote = await myOApp.quoteSendStringWithNativeDrop(
                dstEid,
                message,
                amount,
                receiver,
                false
            );
            
            console.log(`✅ Success! Native fee: ${ethers.utils.formatEther(quote.nativeFee)} ETH`);
            console.log(`   LZ token fee: ${quote.lzTokenFee}`);
            
        } catch (error) {
            console.log(`❌ Failed with amount ${ethers.utils.formatEther(amount)} ETH`);
            console.log(`   Error: ${error.message}`);
            if (error.data) {
                console.log(`   Error data: ${error.data}`);
            }
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });