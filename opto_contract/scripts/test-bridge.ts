import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

async function main() {
    // 這個腳本需要通過 hardhat 運行
    console.log('請使用以下命令來測試橋接:')
    console.log('')
    console.log('1. 首先部署合約:')
    console.log('   npx hardhat deploy --network sepolia-testnet --tags WETH')
    console.log('   npx hardhat deploy --network sepolia-testnet --tags MyOFTAdapter')
    console.log('   npx hardhat deploy --network hedera-testnet --tags MyOFT')
    console.log('')
    console.log('2. 配置跨鏈連接:')
    console.log('   npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts')
    console.log('')
    console.log('3. 發送 OFT token:')
    console.log('   npx hardhat lz:oft:send \\')
    console.log('     --network sepolia-testnet \\')
    console.log('     --src-eid 40161 \\')
    console.log('     --dst-eid 296 \\')
    console.log('     --amount 0.01 \\')
    console.log('     --to 你的接收地址')
    console.log('')
    console.log('注意事項:')
    console.log('- 確保你的錢包有足夠的 ETH 用於 gas 費用')
    console.log('- 確保 WETH 合約地址已正確設置在 hardhat.config.ts 中')
    console.log('- 在發送前需要先將 ETH 包裝為 WETH 並授權給 OFTAdapter')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })