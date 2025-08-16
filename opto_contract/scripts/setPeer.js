const { ethers } = require('hardhat');

async function main() {
    const sepoliaContractAddress = '0xC081e3CC49D5e4ac78486D2A40140a5cB81328de';
    const hederaContractAddress = '0xF6EB0F927f801c93569EB71257D4231F4C03257E';
    const hederaEid = 40161;
    
    const MyOApp = await ethers.getContractFactory('MyOApp');
    const contract = MyOApp.attach(sepoliaContractAddress);
    
    // Convert Hedera contract address to bytes32 format
    const peerBytes32 = ethers.utils.hexZeroPad(hederaContractAddress, 32);
    
    console.log(`Setting peer for EID ${hederaEid} to ${hederaContractAddress}`);
    console.log(`Peer bytes32: ${peerBytes32}`);
    
    try {
        const tx = await contract.setPeer(hederaEid, peerBytes32);
        console.log('Transaction hash:', tx.hash);
        
        await tx.wait();
        console.log('Peer set successfully!');
        
        // Verify the peer was set
        const peer = await contract.peers(hederaEid);
        console.log(`Verified peer for EID ${hederaEid}:`, peer);
        
    } catch (error) {
        console.error('Error setting peer:', error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });