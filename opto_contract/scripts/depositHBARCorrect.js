// scripts/depositHBARCorrect.js
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

  // === Contract addresses ===
  const WHBAR_ADDRESS = "0xb1F616b8134F602c3Bb465fB5b5e6565cCAd37Ed"; // Official WHBAR testnet address
  const ADDRESSES_PROVIDER = "0x873575d4AeeBe015AcF3BB17AAa9DD248cc76D68";
  
  // WHBAR ABI (for wrapping HBAR)
  const whbarAbi = [
    "function deposit() external payable",
    "function withdraw(uint256 amount) external",
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];

  // LendingPool ABI
  const lendingPoolAbi = [
    "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external"
  ];

  // AddressesProvider ABI
  const providerAbi = [
    "function getLendingPool() view returns (address)"
  ];

  // Get lending pool address
  const addressesProvider = new ethers.Contract(ADDRESSES_PROVIDER, providerAbi, signer);
  const lendingPoolAddress = await addressesProvider.getLendingPool();
  console.log("LendingPool address:", lendingPoolAddress);

  // Connect to contracts
  const whbar = new ethers.Contract(WHBAR_ADDRESS, whbarAbi, signer);
  const lendingPool = new ethers.Contract(lendingPoolAddress, lendingPoolAbi, signer);

  // Amount to deposit (1 HBAR)
  const depositAmountHBAR = "1.0";
  const valueInWei = ethers.utils.parseEther(depositAmountHBAR); // For deposit() - uses 18 decimals
  const amountInTinybars = ethers.utils.parseUnits(depositAmountHBAR, 8); // For WHBAR operations - uses 8 decimals

  console.log("\n=== Step 1: Wrapping " + depositAmountHBAR + " HBAR to WHBAR ===");
  
  // Check current WHBAR balance
  const whbarBalanceBefore = await whbar.balanceOf(myAddress);
  console.log("WHBAR balance before: " + ethers.utils.formatUnits(whbarBalanceBefore, 8));

  try {
    // Step 1: Wrap HBAR to WHBAR
    console.log("Wrapping " + depositAmountHBAR + " HBAR to WHBAR...");
    const wrapTx = await whbar.deposit({ value: valueInWei, gasLimit: 300000 });
    console.log("Wrap transaction hash:", wrapTx.hash);
    
    const wrapReceipt = await wrapTx.wait();
    console.log("Wrap transaction confirmed. Status:", wrapReceipt.status);
    
    if (wrapReceipt.status !== 1) {
      throw new Error("Wrap transaction failed");
    }

    // Check WHBAR balance after wrapping
    const whbarBalanceAfter = await whbar.balanceOf(myAddress);
    console.log("WHBAR balance after wrapping: " + ethers.utils.formatUnits(whbarBalanceAfter, 8));
    
    console.log("\n=== Step 2: Approving WHBAR for LendingPool ===");
    
    // Step 2: Approve LendingPool to spend WHBAR
    const currentAllowance = await whbar.allowance(myAddress, lendingPoolAddress);
    console.log("Current allowance: " + ethers.utils.formatUnits(currentAllowance, 8));
    
    if (currentAllowance.lt(amountInTinybars)) {
      console.log("Approving " + depositAmountHBAR + " WHBAR for LendingPool...");
      const approveTx = await whbar.approve(lendingPoolAddress, amountInTinybars, { gasLimit: 300000 });
      console.log("Approve transaction hash:", approveTx.hash);
      
      const approveReceipt = await approveTx.wait();
      console.log("Approve transaction confirmed. Status:", approveReceipt.status);
      
      if (approveReceipt.status !== 1) {
        throw new Error("Approve transaction failed");
      }
    } else {
      console.log("Sufficient allowance already exists");
    }

    console.log("\n=== Step 3: Depositing WHBAR to Bonzo Finance ===");
    
    // Step 3: Deposit WHBAR to LendingPool
    console.log("Depositing " + depositAmountHBAR + " WHBAR to Bonzo Finance...");
    const depositTx = await lendingPool.deposit(
      WHBAR_ADDRESS,
      amountInTinybars,
      myAddress,
      0, // referral code
      { gasLimit: 500000 }
    );
    console.log("Deposit transaction hash:", depositTx.hash);
    
    const depositReceipt = await depositTx.wait();
    console.log("Deposit transaction confirmed. Status:", depositReceipt.status);
    
    if (depositReceipt.status === 1) {
      console.log("Successfully deposited HBAR to Bonzo Finance!");
      
      // Check final WHBAR balance
      const finalWhbarBalance = await whbar.balanceOf(myAddress);
      console.log("Final WHBAR balance: " + ethers.utils.formatUnits(finalWhbarBalance, 8));
      
      // Check aToken balance (if we have the address)
      const ATOKEN_WHBAR = "0x6e96a607F2F5657b39bf58293d1A006f9415aF32";
      try {
        const aTokenAbi = [
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)"
        ];
        const aToken = new ethers.Contract(ATOKEN_WHBAR, aTokenAbi, provider);
        const aBalance = await aToken.balanceOf(myAddress);
        const aDecimals = await aToken.decimals();
        const aHuman = ethers.utils.formatUnits(aBalance, aDecimals);
        console.log("aToken (aWHBAR) balance: " + aHuman);
      } catch (error) {
        console.log("Could not check aToken balance:", error.message);
      }
    } else {
      console.log("Deposit transaction failed");
    }
    
  } catch (error) {
    console.error("❌ Error during deposit process:");
    console.error("Error message:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.data) {
      console.error("Error data:", error.data);
    }
    
    // Try to decode the error if it's a revert string
    if (error.data && error.data.startsWith('0x08c379a0')) {
      try {
        const reason = ethers.utils.defaultAbiCoder.decode(['string'], '0x' + error.data.slice(10));
        console.error("Decoded error:", reason[0]);
      } catch (e) {
        console.error("Could not decode error data");
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});