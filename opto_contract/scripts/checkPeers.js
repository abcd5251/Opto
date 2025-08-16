const { ethers } = require('hardhat');

async function main() {
    const contractAddress = '0xC081e3CC49D5e4ac78486D2A40140a5cB81328de';
    const hederaEid = 40161;
    
    const MyOApp = await ethers.getContractFactory('MyOApp');
    const contract = MyOApp.attach(contractAddress);
    
    try {
        const peer = await contract.peers(hederaEid);
        console.log(`Peer for EID ${hederaEid}:`, peer);
        
        if (peer === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            console.log('No peer set for Hedera testnet');
        } else {
            console.log('Peer is set correctly');
        }
    } catch (error) {
        console.error('Error checking peer:', error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });