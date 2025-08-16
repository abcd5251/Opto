// 簡單的 WETH 測試腳本
// 使用方法: npx hardhat run scripts/test-weth-only.js --network sepolia-testnet

const hre = require('hardhat');

// 合約地址
const WETH_ADDRESS = '0x3004BeDe146C2cf3B894642420629177fbABfD1A';
const OFT_ADAPTER_ADDRESS = '0x60c32c924739bDFCdfa93bdb64B13BE545817A62';

async function main() {
    console.log('🧪 WETH 基本功能測試');
    console.log('========================================');
    
    const [signer] = await hre.ethers.getSigners();
    console.log(`📍 錢包地址: ${signer.address}`);
    
    // 獲取合約實例
    const weth = await hre.ethers.getContractAt('WETH', WETH_ADDRESS);
    
    try {
        // 檢查 ETH 餘額
        const ethBalance = await signer.getBalance();
        console.log(`💰 ETH 餘額: ${hre.ethers.utils.formatEther(ethBalance)} ETH`);
        
        // 檢查 WETH 餘額
        const wethBalance = await weth.balanceOf(signer.address);
        console.log(`💰 WETH 餘額: ${hre.ethers.utils.formatEther(wethBalance)} WETH`);
        
        // 如果沒有 WETH，包裝一些 ETH
        if (wethBalance.eq(0)) {
            const wrapAmount = hre.ethers.utils.parseEther('0.005');
            console.log(`\n🔄 包裝 ${hre.ethers.utils.formatEther(wrapAmount)} ETH 為 WETH...`);
            
            const wrapTx = await weth.deposit({ value: wrapAmount });
            await wrapTx.wait();
            console.log(`✅ 包裝完成，交易哈希: ${wrapTx.hash}`);
            
            const newWethBalance = await weth.balanceOf(signer.address);
            console.log(`💰 新的 WETH 餘額: ${hre.ethers.utils.formatEther(newWethBalance)} WETH`);
        }
        
        // 檢查 OFT Adapter 的授權
        const allowance = await weth.allowance(signer.address, OFT_ADAPTER_ADDRESS);
        console.log(`🔐 OFT Adapter 授權額度: ${hre.ethers.utils.formatEther(allowance)} WETH`);
        
        if (allowance.eq(0)) {
            console.log(`\n🔐 授權 OFT Adapter 使用 WETH...`);
            const currentWethBalance = await weth.balanceOf(signer.address);
            const approveTx = await weth.approve(OFT_ADAPTER_ADDRESS, currentWethBalance);
            await approveTx.wait();
            console.log(`✅ 授權完成，交易哈希: ${approveTx.hash}`);
        }
        
        console.log(`\n✅ WETH 基本功能測試完成!`);
        console.log(`\n📋 合約地址:`);
        console.log(`   WETH: ${WETH_ADDRESS}`);
        console.log(`   OFT Adapter: ${OFT_ADAPTER_ADDRESS}`);
        
        console.log(`\n🔗 下一步: 手動配置跨鏈連接`);
        console.log(`   1. 檢查 LayerZero 配置: npx hardhat lz:oapp:config:get --oapp-config layerzero.config.ts`);
        console.log(`   2. 重新配置: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts`);
        console.log(`   3. 使用 LayerZero 工具發送: npx hardhat lz:oft:send --help`);
        
    } catch (error) {
        console.error('❌ 錯誤:', error.message);
        if (error.reason) {
            console.error('📝 原因:', error.reason);
        }
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };