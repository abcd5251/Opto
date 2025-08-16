// scripts/debugDepositHBAR.js
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
  const WETH_GATEWAY = "0x16197Ef10F26De77C9873d075f8774BdEc20A75d";
  const ADDRESSES_PROVIDER = "0x873575d4AeeBe015AcF3BB17AAa9DD248cc76D68";
  const ATOKEN_WHBAR = "0x6e96a607F2F5657b39bf58293d1A006f9415aF32";

  // Check if contracts exist
  console.log("\n=== Contract Verification ===");
  
  const addressesProviderCode = await provider.getCode(ADDRESSES_PROVIDER);
  console.log(`AddressesProvider exists: ${addressesProviderCode !== '0x'}`);
  
  const wethGatewayCode = await provider.getCode(WETH_GATEWAY);
  console.log(`WETHGateway exists: ${wethGatewayCode !== '0x'}`);
  
  const aTokenCode = await provider.getCode(ATOKEN_WHBAR);
  console.log(`aToken exists: ${aTokenCode !== '0x'}`);

  if (addressesProviderCode === '0x') {
    console.log("❌ AddressesProvider contract not found at the specified address");
    return;
  }

  if (wethGatewayCode === '0x') {
    console.log("❌ WETHGateway contract not found at the specified address");
    return;
  }

  // Test AddressesProvider
  console.log("\n=== Testing AddressesProvider ===");
  const providerAbi = [
    "function getLendingPool() view returns (address)"
  ];
  
  try {
    const addressesProvider = new ethers.Contract(ADDRESSES_PROVIDER, providerAbi, signer);
    const lendingPoolAddress = await addressesProvider.getLendingPool();
    console.log("✅ LendingPool address:", lendingPoolAddress);
    
    // Check if lending pool exists
    const lendingPoolCode = await provider.getCode(lendingPoolAddress);
    console.log(`LendingPool exists: ${lendingPoolCode !== '0x'}`);
  } catch (error) {
    console.log("❌ Failed to get lending pool address:", error.message);
    return;
  }

  // Test WETHGateway with a smaller amount first
  console.log("\n=== Testing WETHGateway ===");
  const wethGatewayAbi = [
    "function depositETH(address onBehalfOf, uint16 referralCode) external payable"
  ];
  
  const gateway = new ethers.Contract(WETH_GATEWAY, wethGatewayAbi, signer);
  
  // Try with a very small amount first (0.1 HBAR)
  const testAmount = ethers.utils.parseEther("0.1");
  console.log(`Testing deposit with ${ethers.utils.formatEther(testAmount)} HBAR...`);
  
  try {
    // Estimate gas first
    const gasEstimate = await gateway.estimateGas.depositETH(myAddress, 0, { value: testAmount });
    console.log(`✅ Gas estimate: ${gasEstimate.toString()}`);
    
    // Try the actual transaction with estimated gas
    console.log("Attempting deposit...");
    const tx = await gateway.depositETH(myAddress, 0, { 
      value: testAmount, 
      gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
    });
    console.log("✅ Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed. Status: ${receipt.status}`);
    
    if (receipt.status === 1) {
      console.log("🎉 Deposit successful!");
      
      // Check aToken balance
      if (aTokenCode !== '0x') {
        const aTokenAbi = [
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)"
        ];
        const aToken = new ethers.Contract(ATOKEN_WHBAR, aTokenAbi, provider);
        const aBalance = await aToken.balanceOf(myAddress);
        const decimals = await aToken.decimals();
        const human = ethers.utils.formatUnits(aBalance, decimals);
        console.log(`aToken balance: ${human}`);
      }
    } else {
      console.log("❌ Transaction failed");
    }
    
  } catch (error) {
    console.log("❌ Transaction failed:");
    console.log("Error message:", error.message);
    if (error.reason) {
      console.log("Reason:", error.reason);
    }
    if (error.data) {
      console.log("Error data:", error.data);
    }
    
    // Try to decode the error
    if (error.data && error.data.startsWith('0x08c379a0')) {
      try {
        const reason = ethers.utils.defaultAbiCoder.decode(['string'], '0x' + error.data.slice(10));
        console.log("Decoded error:", reason[0]);
      } catch (e) {
        console.log("Could not decode error data");
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});