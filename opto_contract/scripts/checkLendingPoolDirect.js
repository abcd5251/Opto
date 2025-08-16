// scripts/checkLendingPoolDirect.js
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

  // Check balance
  const balance = await signer.getBalance();
  console.log(`Account balance: ${ethers.utils.formatEther(balance)} HBAR`);

  // === Bonzo testnet addresses ===
  const ADDRESSES_PROVIDER = "0x873575d4AeeBe015AcF3BB17AAa9DD248cc76D68";
  const WETH_GATEWAY = "0x16197Ef10F26De77C9873d075f8774BdEc20A75d";

  // Get lending pool address
  const providerAbi = [
    "function getLendingPool() view returns (address)"
  ];
  
  const addressesProvider = new ethers.Contract(ADDRESSES_PROVIDER, providerAbi, signer);
  const lendingPoolAddress = await addressesProvider.getLendingPool();
  console.log("LendingPool address:", lendingPoolAddress);

  // Check what functions are available on the WETHGateway
  console.log("\n=== Checking WETHGateway contract ===");
  const wethGatewayCode = await provider.getCode(WETH_GATEWAY);
  console.log(`WETHGateway bytecode length: ${wethGatewayCode.length}`);

  // Try different function signatures that might exist
  const possibleFunctions = [
    "function depositETH(address lendingPool, address onBehalfOf, uint16 referralCode) external payable",
    "function depositETH(address onBehalfOf, uint16 referralCode) external payable", 
    "function deposit(address onBehalfOf, uint16 referralCode) external payable",
    "function depositHBAR(address onBehalfOf, uint16 referralCode) external payable",
    "function supply(address onBehalfOf, uint16 referralCode) external payable"
  ];

  for (const funcSig of possibleFunctions) {
    try {
      console.log(`\nTrying function: ${funcSig}`);
      const testContract = new ethers.Contract(WETH_GATEWAY, [funcSig], signer);
      const funcName = funcSig.split('(')[0].split(' ')[1];
      
      // Try to estimate gas for different parameter combinations
      const testAmount = ethers.utils.parseEther("0.01");
      
      if (funcName === 'depositETH' && funcSig.includes('lendingPool')) {
        // 3-parameter version
        const gasEstimate = await testContract.estimateGas[funcName](lendingPoolAddress, myAddress, 0, { value: testAmount });
        console.log(`✅ Function ${funcName} exists! Gas estimate: ${gasEstimate.toString()}`);
      } else if (funcName === 'depositETH' || funcName === 'deposit' || funcName === 'depositHBAR' || funcName === 'supply') {
        // 2-parameter version
        const gasEstimate = await testContract.estimateGas[funcName](myAddress, 0, { value: testAmount });
        console.log(`✅ Function ${funcName} exists! Gas estimate: ${gasEstimate.toString()}`);
      }
    } catch (error) {
      console.log(`❌ Function not found or failed: ${error.message.split('\n')[0]}`);
    }
  }

  // Also check if we can deposit directly to the lending pool
  console.log("\n=== Checking LendingPool direct deposit ===");
  const lendingPoolAbi = [
    "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
    "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external"
  ];

  // WHBAR token address (wrapped HBAR)
  const WHBAR_ADDRESS = "0x0000000000000000000000000000000000000000"; // Native ETH/HBAR representation
  
  try {
    const lendingPool = new ethers.Contract(lendingPoolAddress, lendingPoolAbi, signer);
    console.log("Checking if lending pool supports direct HBAR deposits...");
    
    // This won't work for native HBAR, but let's see what error we get
    const testAmount = ethers.utils.parseEther("0.01");
    
    try {
      const gasEstimate = await lendingPool.estimateGas.deposit(WHBAR_ADDRESS, testAmount, myAddress, 0);
      console.log(`✅ Direct deposit possible! Gas estimate: ${gasEstimate.toString()}`);
    } catch (error) {
      console.log(`❌ Direct deposit failed: ${error.message.split('\n')[0]}`);
    }
  } catch (error) {
    console.log(`❌ Could not check lending pool: ${error.message}`);
  }

  // Check if there's a WHBAR token we need to wrap first
  console.log("\n=== Checking for WHBAR token ===");
  const whbarCandidates = [
    "0x0000000000000000000000000000000000000000", // Zero address
    "0x00000000000000000000000000000000000000a4", // Common WHBAR address pattern
    "0x0000000000000000000000000000000000163b5a", // Another pattern
  ];

  for (const whbarAddr of whbarCandidates) {
    try {
      const code = await provider.getCode(whbarAddr);
      if (code !== '0x') {
        console.log(`✅ Found contract at ${whbarAddr}`);
        
        // Try to check if it's an ERC20
        const erc20Abi = [
          "function name() view returns (string)",
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)"
        ];
        
        try {
          const token = new ethers.Contract(whbarAddr, erc20Abi, provider);
          const name = await token.name();
          const symbol = await token.symbol();
          console.log(`Token: ${name} (${symbol})`);
        } catch (e) {
          console.log(`Contract exists but not ERC20-compatible`);
        }
      }
    } catch (error) {
      // Ignore errors for zero addresses
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});