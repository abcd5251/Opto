const hre = require('hardhat')

async function main() {
    const [deployer] = await hre.ethers.getSigners()
    console.log('使用帳戶:', deployer.address)

    // 獲取合約地址
    const WETH_ADDRESS = process.env.WETH_ADDRESS
    const OFT_ADAPTER_ADDRESS = process.env.OFT_ADAPTER_ADDRESS
    
    if (!WETH_ADDRESS || !OFT_ADAPTER_ADDRESS) {
        console.error('請設置環境變數:')
        console.log('WETH_ADDRESS=0x... OFT_ADAPTER_ADDRESS=0x... npx hardhat run scripts/approve-weth.js --network sepolia-testnet')
        return
    }

    // 獲取合約實例
    const weth = await hre.ethers.getContractAt('WETH', WETH_ADDRESS)
    
    // 檢查當前 WETH 餘額
    const balance = await weth.balanceOf(deployer.address)
    console.log(`當前 WETH 餘額: ${hre.ethers.utils.formatEther(balance)} WETH`)
    
    if (balance.eq(0)) {
        console.log('你沒有 WETH，請先運行 wrap-eth.js 腳本')
        return
    }
    
    // 授權 OFTAdapter 使用所有 WETH
    console.log(`授權 OFTAdapter (${OFT_ADAPTER_ADDRESS}) 使用 ${hre.ethers.utils.formatEther(balance)} WETH...`)
    
    const tx = await weth.approve(OFT_ADAPTER_ADDRESS, balance)
    console.log(`交易哈希: ${tx.hash}`)
    
    await tx.wait()
    console.log('授權交易已確認')
    
    // 檢查授權額度
    const allowance = await weth.allowance(deployer.address, OFT_ADAPTER_ADDRESS)
    console.log(`授權額度: ${hre.ethers.utils.formatEther(allowance)} WETH`)
    
    console.log('\n現在你可以使用 LayerZero 發送 WETH 到 Hedera:')
    console.log('npx hardhat lz:oft:send \\')
    console.log('  --network sepolia-testnet \\')
    console.log('  --src-eid 40161 \\')
    console.log('  --dst-eid 296 \\')
    console.log('  --amount 0.005 \\')
    console.log('  --to 你的接收地址')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })