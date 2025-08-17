const { ethers } = require("hardhat");

async function main() {
    console.log('🧪 Testing SaucerSwap Router Address');
    console.log('=' .repeat(50));
    
    const [signer] = await ethers.getSigners();
    const myAddress = await signer.getAddress();
    
    console.log('👤 Testing with address:', myAddress);
    
    // Test both router addresses
    const ROUTER_OLD = '0x0000000000000000000000000000000000159208'; // 0.0.1414040
    const ROUTER_NEW = '0x0000000000000000000000000000000000004b40'; // 0.0.19264
    const WHBAR_ADDRESS = '0x0000000000000000000000000000000000003aD1';
    const HBARX_ADDRESS = '0x0000000000000000000000000000000000220cED';
    
    const routerABI = [
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
    ];
    
    console.log('\n🔍 Testing Router Addresses:');
    
    // Test old router
    console.log('\n📍 Testing OLD Router:', ROUTER_OLD);
    try {
        const routerOld = new ethers.Contract(ROUTER_OLD, routerABI, signer);
        const path = [WHBAR_ADDRESS, HBARX_ADDRESS];
        const amountIn = ethers.utils.parseEther('1');
        
        const amounts = await routerOld.getAmountsOut(amountIn, path);
        console.log('✅ OLD Router works! Expected output:', ethers.utils.formatUnits(amounts[1], 8), 'HBARX');
    } catch (error) {
        console.log('❌ OLD Router failed:', error.message.split('\n')[0]);
    }
    
    // Test new router
    console.log('\n📍 Testing NEW Router:', ROUTER_NEW);
    try {
        const routerNew = new ethers.Contract(ROUTER_NEW, routerABI, signer);
        const path = [WHBAR_ADDRESS, HBARX_ADDRESS];
        const amountIn = ethers.utils.parseEther('1');
        
        const amounts = await routerNew.getAmountsOut(amountIn, path);
        console.log('✅ NEW Router works! Expected output:', ethers.utils.formatUnits(amounts[1], 8), 'HBARX');
    } catch (error) {
        console.log('❌ NEW Router failed:', error.message.split('\n')[0]);
    }
    
    // Check if contracts exist at these addresses
    console.log('\n🔍 Checking Contract Existence:');
    
    const oldCode = await signer.provider.getCode(ROUTER_OLD);
    const newCode = await signer.provider.getCode(ROUTER_NEW);
    
    console.log('📋 OLD Router has code:', oldCode !== '0x' ? 'YES' : 'NO');
    console.log('📋 NEW Router has code:', newCode !== '0x' ? 'YES' : 'NO');
    
    if (oldCode === '0x' && newCode === '0x') {
        console.log('\n❌ Both router addresses have no contract code!');
        console.log('💡 This suggests the addresses might be incorrect for testnet');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });