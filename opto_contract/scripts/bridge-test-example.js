// LayerZero 跨鏈橋測試示例
// 使用方法: npx hardhat run scripts/bridge-test-example.js --network sepolia-testnet

const hre = require('hardhat');

// 合約地址 (從部署結果獲取)
const WETH_ADDRESS = '0x3004BeDe146C2cf3B894642420629177fbABfD1A';
const OFT_ADAPTER_ADDRESS = '0x60c32c924739bDFCdfa93bdb64B13BE545817A62';
const HEDERA_OFT_ADDRESS = '0xe5fb5F3a25e0B04a6328560caD2be3C0DdC2b2FA';

// LayerZero Endpoint IDs
const HEDERA_EID = 296;

async function main() {
    console.log('🚀 LayerZero 跨鏈橋測試示例');
    console.log('========================================');
    
    const [signer] = await hre.ethers.getSigners();
    console.log(`📍 錢包地址: ${signer.address}`);
    
    // 獲取合約實例
    const weth = await hre.ethers.getContractAt('WETH', WETH_ADDRESS);
    const oftAdapter = await hre.ethers.getContractAt('MyOFTAdapter', OFT_ADAPTER_ADDRESS);
    
    try {
        // 步驟 1: 檢查 ETH 餘額
        const ethBalance = await signer.getBalance();
        console.log(`💰 ETH 餘額: ${hre.ethers.utils.formatEther(ethBalance)} ETH`);
        
        if (ethBalance.lt(hre.ethers.utils.parseEther('0.01'))) {
            console.log('❌ ETH 餘額不足，請先獲取測試 ETH');
            return;
        }
        
        // 步驟 2: 包裝 ETH 為 WETH
        const wrapAmount = hre.ethers.utils.parseEther('0.005');
        console.log(`\n🔄 包裝 ${hre.ethers.utils.formatEther(wrapAmount)} ETH 為 WETH...`);
        
        const wrapTx = await weth.deposit({ value: wrapAmount });
        await wrapTx.wait();
        console.log(`✅ 包裝完成，交易哈希: ${wrapTx.hash}`);
        
        // 檢查 WETH 餘額
        const wethBalance = await weth.balanceOf(signer.address);
        console.log(`💰 WETH 餘額: ${hre.ethers.utils.formatEther(wethBalance)} WETH`);
        
        // 步驟 3: 授權 OFT Adapter
        console.log(`\n🔐 授權 OFT Adapter 使用 WETH...`);
        const approveTx = await weth.approve(OFT_ADAPTER_ADDRESS, wethBalance);
        await approveTx.wait();
        console.log(`✅ 授權完成，交易哈希: ${approveTx.hash}`);
        
        // 步驟 4: 計算跨鏈費用
        const sendAmount = hre.ethers.utils.parseEther('0.003');
        const receiverAddress = hre.ethers.utils.hexZeroPad(signer.address, 32);
        
        const sendParam = {
            dstEid: HEDERA_EID,
            to: receiverAddress,
            amountLD: sendAmount,
            minAmountLD: sendAmount,
            extraOptions: '0x',
            composeMsg: '0x',
            oftCmd: '0x'
        };
        
        console.log(`\n💸 計算跨鏈費用...`);
        const quote = await oftAdapter.quoteSend(sendParam, false);
        const nativeFee = quote.nativeFee;
        
        console.log(`📊 跨鏈費用: ${hre.ethers.utils.formatEther(nativeFee)} ETH`);
        console.log(`📦 發送數量: ${hre.ethers.utils.formatEther(sendAmount)} WETH`);
        
        // 檢查是否有足夠的 ETH 支付費用
        const currentEthBalance = await signer.getBalance();
        if (currentEthBalance.lt(nativeFee)) {
            console.log('❌ ETH 餘額不足以支付跨鏈費用');
            return;
        }
        
        // 步驟 5: 執行跨鏈轉移
        console.log(`\n🌉 執行跨鏈轉移...`);
        const sendTx = await oftAdapter.send(
            sendParam,
            { nativeFee, lzTokenFee: 0 },
            signer.address,
            { value: nativeFee }
        );
        
        console.log(`🚀 跨鏈交易已發送!`);
        console.log(`📋 交易哈希: ${sendTx.hash}`);
        console.log(`🔍 在 LayerZero Scan 查看: https://testnet.layerzeroscan.com/tx/${sendTx.hash}`);
        
        // 等待交易確認
        console.log(`\n⏳ 等待交易確認...`);
        const receipt = await sendTx.wait();
        console.log(`✅ 交易已確認，區塊: ${receipt.blockNumber}`);
        
        console.log(`\n🎉 跨鏈轉移完成!`);
        console.log(`📍 目標鏈 (Hedera) 合約地址: ${HEDERA_OFT_ADDRESS}`);
        console.log(`⏰ 請等待 1-2 分鐘讓跨鏈消息處理完成`);
        
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