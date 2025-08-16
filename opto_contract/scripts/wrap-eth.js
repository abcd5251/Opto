const hre = require('hardhat')

async function main() {
    const [deployer] = await hre.ethers.getSigners()
    console.log('使用帳戶:', deployer.address)

    // 獲取 WETH 合約地址 (需要根據實際部署更新)
    const WETH_ADDRESS = process.env.WETH_ADDRESS
    
    if (!WETH_ADDRESS) {
        console.error('請設置 WETH_ADDRESS 環境變數')
        console.log('例如: WETH_ADDRESS=0x... npx hardhat run scripts/wrap-eth.js --network sepolia-testnet')
        return
    }

    // 獲取 WETH 合約實例
    const weth = await hre.ethers.getContractAt('WETH', WETH_ADDRESS)
    
    // 包裝 0.01 ETH
    const wrapAmount = hre.ethers.utils.parseEther('0.01')
    
    console.log(`包裝 ${hre.ethers.utils.formatEther(wrapAmount)} ETH 為 WETH...`)
    
    const tx = await weth.deposit({ value: wrapAmount })
    console.log(`交易哈希: ${tx.hash}`)
    
    await tx.wait()
    console.log('交易已確認')
    
    // 檢查 WETH 餘額
    const balance = await weth.balanceOf(deployer.address)
    console.log(`WETH 餘額: ${hre.ethers.utils.formatEther(balance)} WETH`)
    
    console.log('\n下一步:')
    console.log('1. 記下 WETH 合約地址並更新 hardhat.config.ts')
    console.log('2. 部署 OFTAdapter 合約')
    console.log('3. 授權 OFTAdapter 使用你的 WETH')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })