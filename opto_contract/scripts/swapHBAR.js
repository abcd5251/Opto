// swap-with-manual-gas.js
require('dotenv').config();
const { ethers } = require('ethers');

const RPC_URL = process.env.RPC_URL || 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("Set PRIVATE_KEY in .env");

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const ROUTER = '0x0000000000000000000000000000000000004b40';
const WHBAR  = '0x0000000000000000000000000000000000003ad1';
const HBARX  = '0x0000000000000000000000000000000000220ced';

const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)"
];

async function main(){
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);

  const amountInDecimal = "0.01";
  const amountInWei = ethers.utils.parseUnits(amountInDecimal, 18);

  const path = [WHBAR, HBARX];
  const to = await wallet.getAddress();
  const deadline = Math.floor(Date.now() / 1000) + 60*10;
  const amountOutMin = 0; // demo only — 設為 0 風險大

  console.log("Attempt swap with manual gasLimit. WARNING: if tx reverts you'll still pay gas.");

  try {
    const tx = await router.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      {
        value: amountInWei,
        gasLimit: 500000 // 手動設定，若仍 revert 就會花 gas，但可避免 estimateGas 失敗
      }
    );

    console.log("Tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Receipt:", receipt);
  } catch (err) {
    console.error("Swap failed:", err);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
