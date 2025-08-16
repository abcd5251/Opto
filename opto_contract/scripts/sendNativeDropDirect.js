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
    const nativeDropAmount = ethers.utils.parseEther('0.001'); // 0.001 ETH - this worked in quote
    
    try {
        console.log('Getting quote first...');
        const quote = await myOApp.quoteSendStringWithNativeDrop(
            dstEid,
            message,
            nativeDropAmount,
            receiver,
            false
        );
        
        console.log(`Quote successful!`);
        console.log(`Native fee: ${ethers.utils.formatEther(quote.nativeFee)} ETH`);
        console.log(`LZ token fee: ${quote.lzTokenFee}`);
        
        // Add some buffer to the fee
        const totalFee = quote.nativeFee.mul(110).div(100); // Add 10% buffer
        console.log(`Total fee with buffer: ${ethers.utils.formatEther(totalFee)} ETH`);
        
        console.log('\nSending transaction...');
        const tx = await myOApp.sendStringWithNativeDrop(
            dstEid,
            message,
            nativeDropAmount,
            receiver,
            { value: totalFee }
        );
        
        console.log(`Transaction sent: ${tx.hash}`);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed}`);
        
    } catch (error) {
        console.log(`❌ Failed:`);
        console.log(`Error: ${error.message}`);
        if (error.data) {
            console.log(`Error data: ${error.data}`);
        }
        if (error.reason) {
            console.log(`Reason: ${error.reason}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });