# LayerZero Cross-Chain Bridge 部署指南

## 概述
這個指南將幫助你部署和測試從 Sepolia 到 Hedera 測試網的跨鏈資產橋接。

## 架構說明

### 網路配置
- **Sepolia Testnet**: 使用 `MyOFTAdapter` 來包裝現有的 WETH token
- **Hedera Testnet**: 使用 `MyOFT` 作為目標鏈上的 token

### 合約類型
1. **WETH.sol**: 在 Sepolia 上的 Wrapped ETH token
2. **MyOFTAdapter.sol**: 在 Sepolia 上的 OFT Adapter，用於包裝現有 token
3. **MyOFT.sol**: 在 Hedera 上的 OFT token

## 前置準備

### 1. 環境設置
```bash
# 複製環境變數文件
cp .env.example .env

# 編輯 .env 文件，設置以下變數：
# PRIVATE_KEY=你的私鑰
# RPC_URL_SEPOLIA=Sepolia RPC URL
# RPC_URL_HEDERA_TESTNET=Hedera 測試網 RPC URL
```

### 2. 獲取測試代幣
- **Sepolia ETH**: 從 [Sepolia Faucet](https://sepoliafaucet.com/) 獲取
- **Hedera HBAR**: 從 [Hedera Portal](https://portal.hedera.com/) 獲取

### 3. 安裝依賴
```bash
npm install
# 或
pnpm install
```

## 部署步驟

### 步驟 1: 部署 WETH 到 Sepolia
```bash
# 部署 WETH token 到 Sepolia
npx hardhat deploy --network sepolia-testnet --tags WETH
```

### 步驟 2: 更新 hardhat.config.ts
部署 WETH 後，需要更新 `hardhat.config.ts` 中的 `tokenAddress`：
```typescript
'sepolia-testnet': {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    url: process.env.RPC_URL_SEPOLIA || 'https://sepolia.gateway.tenderly.co',
    accounts,
    oftAdapter: {
        tokenAddress: '0x你的WETH合約地址', // 更新為實際的 WETH 地址
    },
},
```

### 步驟 3: 部署 OFTAdapter 到 Sepolia
```bash
# 部署 OFTAdapter 到 Sepolia
npx hardhat deploy --network sepolia-testnet --tags MyOFTAdapter
```

### 步驟 4: 部署 OFT 到 Hedera
```bash
# 部署 OFT 到 Hedera
npx hardhat deploy --network hedera-testnet --tags MyOFT
```

### 步驟 5: 配置跨鏈連接
```bash
# 配置 LayerZero 連接
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

## 測試流程

### 1. 包裝 ETH 為 WETH
```bash
# 在 Sepolia 上將 ETH 包裝為 WETH
# 你可以通過合約介面或者寫一個簡單的腳本來做這件事
```

### 2. 授權 OFTAdapter
```bash
# 授權 OFTAdapter 使用你的 WETH
# WETH.approve(OFTAdapter_address, amount)
```

### 3. 執行跨鏈轉移
```bash
# 使用 LayerZero 發送 token 到 Hedera
npx hardhat lz:oft:send --network sepolia-testnet
```

## 重要注意事項

### Hedera 特殊考量
1. **小數位數**: Hedera EVM 使用 8 位小數，而 JSON RPC 使用 18 位小數
2. **Gas 費用**: 測試網使用真實的主網價格餵送
3. **HTS 整合**: 考慮使用 HTS Connector 來整合原生 Hedera Token Service

### 安全考量
1. **私鑰安全**: 永遠不要在代碼中硬編碼私鑰
2. **測試環境**: 在主網部署前充分測試
3. **Gas 限制**: 確保設置適當的 gas 限制

## 故障排除

### 常見問題
1. **交易失敗**: 檢查 gas 費用和網路連接
2. **合約驗證**: 確保所有合約都正確部署
3. **權限問題**: 確保正確設置了 peer 和授權

### 調試命令
```bash
# 檢查合約狀態
npx hardhat lz:oapp:config:get --network sepolia-testnet

# 檢查 peer 設置
npx hardhat lz:oapp:peers --network sepolia-testnet
```

## 下一步

1. 實施更複雜的 token 經濟學
2. 整合 Hedera Token Service (HTS)
3. 添加更多安全檢查
4. 優化 gas 使用
5. 實施監控和警報系統

## 資源連結

- [LayerZero V2 文檔](https://docs.layerzero.network/v2)
- [Hedera 文檔](https://docs.hedera.com/)
- [LayerZero Hedera 整合](https://docs.hedera.com/hedera/open-source-solutions/interoperability-and-bridging/layerzero)