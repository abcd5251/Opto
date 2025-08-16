#!/bin/bash

# LayerZero Cross-Chain Bridge 部署和測試腳本
# 使用方法: ./scripts/deploy-and-test.sh

set -e

echo "🚀 LayerZero Cross-Chain Bridge 部署和測試"
echo "========================================"

# 加載 .env 文件
if [ -f ".env" ]; then
    echo "📄 加載 .env 文件..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  警告: 未找到 .env 文件"
fi

# 檢查環境變數
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ 錯誤: 請在 .env 文件中設置 PRIVATE_KEY"
    echo "   或者 export PRIVATE_KEY=你的私鑰"
    exit 1
fi

echo "✅ 環境變數檢查完成"

# 步驟 1: 編譯合約
echo "\n📦 步驟 1: 編譯合約"
npx hardhat compile

# 步驟 2: 部署 WETH 到 Sepolia
echo "\n🔧 步驟 2: 部署 WETH 到 Sepolia"
npx hardhat deploy --network sepolia-testnet --tags WETH

# 獲取 WETH 地址 (需要手動更新)
echo "\n⚠️  重要: 請記下 WETH 合約地址並更新 hardhat.config.ts"
echo "   在 sepolia-testnet 網路配置中設置 oftAdapter.tokenAddress"
read -p "按 Enter 繼續..."

# 步驟 3: 部署 OFTAdapter 到 Sepolia
echo "\n🔧 步驟 3: 部署 OFTAdapter 到 Sepolia"
npx hardhat deploy --network sepolia-testnet --tags MyOFTAdapter

# 步驟 4: 部署 OFT 到 Hedera
echo "\n🔧 步驟 4: 部署 OFT 到 Hedera"
npx hardhat deploy --network hedera-testnet --tags MyOFT

# 步驟 5: 配置跨鏈連接
echo "\n🔗 步驟 5: 配置跨鏈連接"
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts

echo "\n✅ 部署完成!"
echo "\n📋 下一步操作:"
echo "1. 包裝 ETH 為 WETH:"
echo "   WETH_ADDRESS=0x你的WETH地址 npx hardhat run scripts/wrap-eth.js --network sepolia-testnet"
echo ""
echo "2. 授權 OFTAdapter 使用 WETH:"
echo "   WETH_ADDRESS=0x你的WETH地址 OFT_ADAPTER_ADDRESS=0x你的OFTAdapter地址 npx hardhat run scripts/approve-weth.js --network sepolia-testnet"
echo ""
echo "3. 執行跨鏈轉移:"
echo "   npx hardhat lz:oft:send --network sepolia-testnet --src-eid 40161 --dst-eid 296 --amount 0.005 --to 你的接收地址"
echo ""
echo "📊 追蹤交易:"
echo "   LayerZero Scan: https://testnet.layerzeroscan.com/"
echo ""
echo "🎉 恭喜! 你的跨鏈橋已準備就緒!"