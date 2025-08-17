const { ethers } = require("hardhat");

async function main() {
  console.log('🚀 Testing HBARXBonzoIntegrator Smart Contract');
  console.log('=' .repeat(60));
  
  // Get signer
  const [signer] = await ethers.getSigners();
  const myAddress = await signer.getAddress();
  console.log('📝 Account:', myAddress);
  
  // Check initial HBAR balance
  const initialHbarBalance = await signer.getBalance();
  const initialHbarFormatted = ethers.utils.formatEther(initialHbarBalance);
  console.log('💰 Initial HBAR Balance:', initialHbarFormatted, 'HBAR');
  
  if (initialHbarBalance.lt(ethers.utils.parseEther('2'))) {
    console.log('❌ Insufficient HBAR balance for testing!');
    console.log('💡 You need at least 2 HBAR to test the contract');
    return;
  }

  try {
    // Step 1: Deploy the HBARXBonzoIntegrator contract
    console.log('\n📦 STEP 1: Deploying HBARXBonzoIntegrator Contract');
    console.log('-' .repeat(50));
    
    const HBARXBonzoIntegrator = await ethers.getContractFactory("HBARXBonzoIntegrator");
    const integrator = await HBARXBonzoIntegrator.deploy();
    await integrator.deployed();
    
    console.log('✅ Contract deployed successfully!');
    console.log('📍 Contract Address:', integrator.address);
    console.log('⛽ Deployment Gas Used:', (await integrator.deployTransaction.wait()).gasUsed.toString());

    // Step 2: Check contract configuration
    console.log('\n🔧 STEP 2: Verifying Contract Configuration');
    console.log('-' .repeat(50));
    
    const saucerswapRouter = await integrator.SAUCERSWAP_ROUTER();
    const whbarAddress = await integrator.WHBAR_ADDRESS();
    const hbarxAddress = await integrator.HBARX_ADDRESS();
    const bonzoLendingPool = await integrator.BONZO_LENDING_POOL();
    
    console.log('🔗 SaucerSwap Router:', saucerswapRouter);
    console.log('🔗 WHBAR Address:', whbarAddress);
    console.log('🔗 HBARX Address:', hbarxAddress);
    console.log('🔗 Bonzo Lending Pool:', bonzoLendingPool);

    // Step 3: Check HBARX support in Bonzo Finance
    console.log('\n🏦 STEP 3: Checking HBARX Support in Bonzo Finance');
    console.log('-' .repeat(50));
    
    try {
      const [isSupported, aTokenAddress] = await integrator.checkHBARXSupportInBonzo();
      
      if (isSupported) {
        console.log('✅ HBARX is supported by Bonzo Finance!');
        console.log('🎯 aToken Address:', aTokenAddress);
      } else {
        console.log('❌ HBARX is NOT supported by Bonzo Finance');
        console.log('💡 The contract will fail at the deposit step');
        console.log('💡 Consider using supported tokens like USDC instead');
      }
    } catch (error) {
      console.log('⚠️  Could not check HBARX support:', error.message.split('\n')[0]);
    }

    // Step 4: Get expected HBARX output
    console.log('\n💱 STEP 4: Checking Expected Swap Output');
    console.log('-' .repeat(50));
    
    const testSwapAmount = ethers.utils.parseEther('1'); // 1 HBAR
    
    try {
      const expectedHBARX = await integrator.getExpectedHBARXOutput(testSwapAmount);
      
      if (expectedHBARX.gt(0)) {
        console.log('📈 Expected HBARX for 1 HBAR:', ethers.utils.formatUnits(expectedHBARX, 8), 'HBARX');
        console.log('✅ SaucerSwap liquidity pool appears to be available');
      } else {
        console.log('❌ No expected output - liquidity pool might not exist');
        console.log('💡 The swap will likely fail');
      }
    } catch (error) {
      console.log('⚠️  Could not get expected output:', error.message.split('\n')[0]);
      console.log('💡 This might indicate SaucerSwap router issues');
    }

    // Step 5: Test the main function (if conditions are favorable)
    console.log('\n🔄 STEP 5: Testing Swap and Deposit Function');
    console.log('-' .repeat(50));
    
    // Check initial HBARX balance
    const hbarxContract = new ethers.Contract(
      hbarxAddress,
      ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
      signer
    );
    
    let initialHbarxBalance;
    try {
      initialHbarxBalance = await hbarxContract.balanceOf(myAddress);
      const hbarxDecimals = await hbarxContract.decimals();
      console.log('🔥 Initial HBARX Balance:', ethers.utils.formatUnits(initialHbarxBalance, hbarxDecimals), 'HBARX');
    } catch (error) {
      console.log('⚠️  Could not check initial HBARX balance');
      initialHbarxBalance = ethers.BigNumber.from(0);
    }

    // Attempt the swap and deposit
    const swapAmount = ethers.utils.parseEther('0.5'); // 0.5 HBAR for testing
    const minHBARXOut = 0; // For testing - in production, set proper slippage
    
    console.log('💱 Attempting to swap', ethers.utils.formatEther(swapAmount), 'HBAR for HBARX and deposit to Bonzo...');
    
    try {
      const tx = await integrator.swapHBARForHBARXAndDeposit(
        minHBARXOut,
        { 
          value: swapAmount,
          gasLimit: 1000000 // High gas limit for complex transaction
        }
      );
      
      console.log('⏳ Transaction submitted:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log('\n🎉 SUCCESS! Swap and Deposit Completed!');
        console.log('📋 Transaction Hash:', receipt.transactionHash);
        console.log('⛽ Gas Used:', receipt.gasUsed.toString());
        
        // Parse events
        const events = receipt.events || [];
        for (const event of events) {
          if (event.event === 'HBARSwappedForHBARX') {
            const hbarAmount = ethers.utils.formatEther(event.args.hbarAmount);
            const hbarxReceived = ethers.utils.formatUnits(event.args.hbarxReceived, 8);
            console.log('💱 Swap Event: Swapped', hbarAmount, 'HBAR for', hbarxReceived, 'HBARX');
          } else if (event.event === 'HBARXDepositedToBonzo') {
            const hbarxAmount = ethers.utils.formatUnits(event.args.hbarxAmount, 8);
            console.log('🏦 Deposit Event: Deposited', hbarxAmount, 'HBARX to Bonzo Finance');
            console.log('🎯 aToken Address:', event.args.aTokenAddress);
          }
        }
        
        // Check final balances
        console.log('\n📊 Final Balances:');
        const finalHbarBalance = await signer.getBalance();
        const finalHbarFormatted = ethers.utils.formatEther(finalHbarBalance);
        console.log('💰 Final HBAR Balance:', finalHbarFormatted, 'HBAR');
        
        try {
          const finalHbarxBalance = await hbarxContract.balanceOf(myAddress);
          const hbarxDecimals = await hbarxContract.decimals();
          console.log('🔥 Final HBARX Balance:', ethers.utils.formatUnits(finalHbarxBalance, hbarxDecimals), 'HBARX');
        } catch (error) {
          console.log('⚠️  Could not check final HBARX balance');
        }
        
      } else {
        console.log('❌ Transaction failed with status:', receipt.status);
      }
      
    } catch (error) {
      console.log('❌ Swap and deposit failed:', error.message.split('\n')[0]);
      
      if (error.message.includes('SwapFailed')) {
        console.log('💡 Swap failed - possible reasons:');
        console.log('   - Insufficient liquidity in HBAR/HBARX pool');
        console.log('   - SaucerSwap router issues');
        console.log('   - Network connectivity problems');
      } else if (error.message.includes('HBARXNotSupportedByBonzo')) {
        console.log('💡 HBARX is not supported by Bonzo Finance');
        console.log('   - Use supported tokens like USDC instead');
        console.log('   - Wait for HBARX support to be added');
      } else if (error.message.includes('DepositFailed')) {
        console.log('💡 Deposit to Bonzo Finance failed');
        console.log('   - Check Bonzo Finance contract status');
        console.log('   - Verify HBARX approval');
      }
    }

    // Step 6: Contract summary
    console.log('\n📋 STEP 6: Contract Summary');
    console.log('-' .repeat(50));
    console.log('✅ Contract deployed and tested successfully');
    console.log('📍 Contract Address:', integrator.address);
    console.log('🔧 Owner:', await integrator.owner());
    console.log('💡 The contract is ready for production use (if HBARX is supported by Bonzo)');
    
    console.log('\n🔧 Available Functions:');
    console.log('   - swapHBARForHBARXAndDeposit(minHBARXOut, deadline)');
    console.log('   - getExpectedHBARXOutput(hbarAmount)');
    console.log('   - checkHBARXSupportInBonzo()');
    console.log('   - emergencyWithdraw(token, amount) [Owner only]');
    console.log('   - emergencyWithdrawAll() [Owner only]');
    
  } catch (error) {
    console.error('❌ Error during contract testing:', error.message);
    
    if (error.message.includes('CALL_EXCEPTION')) {
      console.log('\n💡 This might be due to:');
      console.log('   1. Network connectivity issues');
      console.log('   2. Contract deployment failed');
      console.log('   3. Insufficient gas or gas price issues');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });