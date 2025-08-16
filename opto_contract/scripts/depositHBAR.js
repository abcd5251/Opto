// scripts/depositHBAR.js
require('dotenv').config();
const { ethers } = require("hardhat");

async function main() {
  const rpc = process.env.HEDERA_RPC || "https://testnet.hashio.io/api";
  const provider = new ethers.providers.JsonRpcProvider(rpc, { name: "hederaTestnet", chainId: 296 });

  if (!process.env.PRIVATE_KEY) {
    throw new Error("Please set PRIVATE_KEY in .env");
  }
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const myAddress = await signer.getAddress();
  console.log("Using address:", myAddress);

  // === Bonzo testnet addresses (來自 Bonzo docs: Protocol Contracts) ===
  const WETH_GATEWAY = "0x16197Ef10F26De77C9873d075f8774BdEc20A75d"; // Bonzo testnet WETHGateway (from docs)
  const ADDRESSES_PROVIDER = "0x873575d4AeeBe015AcF3BB17AAa9DD248cc76D68"; // LendingPoolAddressesProvider (testnet)
  // aToken (WHBAR) testnet aToken address (optional check)
  const ATOKEN_WHBAR = "0x6e96a607F2F5657b39bf58293d1A006f9415aF32";

  // Minimal ABIs
  const providerAbi = [
    "function getLendingPool() view returns (address)"
  ];

  // WETHGateway ABI (Aave-like): depositETH/onBehalfOf/referralCode payable
  const wethGatewayAbi = [
    "function depositETH(address onBehalfOf, uint16 referralCode) external payable"
  ];

  const aTokenAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  // Connect to provider contract to get lendingPool address
  const addressesProvider = new ethers.Contract(ADDRESSES_PROVIDER, providerAbi, signer);
  const lendingPoolAddress = await addressesProvider.getLendingPool();
  console.log("LendingPool address:", lendingPoolAddress);

  // Connect to WETHGateway
  const gateway = new ethers.Contract(WETH_GATEWAY, wethGatewayAbi, signer);

  // 指定要 deposit 的 HBAR 金額（以 ETH-like wei 表示；Hedera JSON-RPC 使用 18 decimals for msg.value）
  const depositAmountHBAR = "1.0"; // 你要 deposit 幾個 HBAR（範例用 1 HBAR）
  const value = ethers.utils.parseEther(depositAmountHBAR); // 1 HBAR => 1 * 10^18 in msg.value

  console.log(`Depositing ${depositAmountHBAR} HBAR (msg.value = ${value.toString()}) via WETHGateway...`);

  // Call depositETH(onBehalfOf, referralCode) payable
  const tx = await gateway.depositETH(myAddress, 0, { value: value, gasLimit: 6000000 });
  console.log("Sent deposit tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Deposit tx mined. status:", receipt.status);

  // Check resulting aToken (aWHBAR) balance
  const aToken = new ethers.Contract(ATOKEN_WHBAR, aTokenAbi, provider);
  const aBalance = await aToken.balanceOf(myAddress);
  const decimals = await aToken.decimals();
  // aTokens usually follow same decimals as underlying (but we convert using decimals)
  const human = ethers.utils.formatUnits(aBalance, decimals);
  console.log(`aToken (aWHBAR) balance: ${human} (raw: ${aBalance.toString()})`);

  console.log("Done. You have supplied HBAR to Bonzo lending pool.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
