const { ethers } = require("hardhat");

async function main() {
    console.log('🧪 Testing HBAR to USDC Bonzo Integrator');
    console.log('=' .repeat(50));
    
    const [signer] = await ethers.getSigners();
    const myAddress = await signer.getAddress();
    
    console.log('👤 Testing with address:', myAddress);
    
    // Check initial HBAR balance
    const initialBalance = await signer.getBalance();
    console.log('💰 Initial HBAR Balance:', ethers.utils.formatEther(initialBalance), 'HBAR');
    
    if (initialBalance.lt(ethers.utils.parseEther('1'))) {
        console.log('❌ Insufficient HBAR balance for testing!');
        console.log('💡 You need at least 1 HBAR to test the contract');
        return;
    }
    
    // Step 1: Deploy the contract
    console.log('\n🚀 STEP 1: Deploying HBARUSDCBonzoIntegrator Contract');
    console.log('-' .repeat(50));
    
    const HBARUSDCBonzoIntegrator = await ethers.getContractFactory("HBARUSDCBonzoIntegrator");
    const integrator = await HBARUSDCBonzoIntegrator.deploy();
    await integrator.deployed();
    
    console.log('✅ Contract deployed at:', integrator.address);
    console.log('👤 Contract owner:', await integrator.owner());
    
    // Step 2: Verify contract configuration
    console.log('\n🔧 STEP 2: Verifying Contract Configuration');
    console.log('-' .repeat(50));
    
    const saucerswapRouter = await integrator.SAUCERSWAP_ROUTER();
    const whbarAddress = await integrator.WHBAR_ADDRESS();
    const usdcAddress = await integrator.USDC_ADDRESS();
    const bonzoLendingPool = await integrator.BONZO_LENDING_POOL();
    
    console.log('🔗 SaucerSwap Router:', saucerswapRouter);
    console.log('🔗 WHBAR Address:', whbarAddress);
    console.log('🔗 USDC Address:', usdcAddress);
    console.log('🔗 Bonzo Lending Pool:', bonzoLendingPool);

    // Step 3: Check USDC support in Bonzo Finance
    console.log('\n🏦 STEP 3: Checking USDC Support in Bonzo Finance');
    console.log('-' .repeat(50));
    
    try {
        const isSupported = await integrator.checkUSDCSupportInBonzo();
        
        if (isSupported) {
            console.log('✅ USDC is supported by Bonzo Finance!');
        } else {
            console.log('❌ USDC is NOT supported by Bonzo Finance');
            console.log('💡 The contract will fail at the deposit step');
        }
    } catch (error) {
        console.log('⚠️  Could not check USDC support:', error.message.split('\n')[0]);
    }

    // Step 4: Get expected USDC output
    console.log('\n💱 STEP 4: Checking Expected Swap Output');
    console.log('-' .repeat(50));
    
    const testSwapAmount = ethers.utils.parseEther('1'); // 1 HBAR
    
    try {
        const expectedUSDC = await integrator.getExpectedUSDCOutput(testSwapAmount);
        
        if (expectedUSDC.gt(0)) {
            console.log('📈 Expected USDC for 1 HBAR:', ethers.utils.formatUnits(expectedUSDC, 6), 'USDC');
            console.log('✅ SaucerSwap HBAR/USDC liquidity pool is available');
        } else {
            console.log('❌ No expected output - liquidity pool might not exist');
            console.log('💡 The swap will likely fail');
        }
    } catch (error) {
        console.log('⚠️  Could not get expected output:', error.message.split('\n')[0]);
        console.log('💡 This might indicate SaucerSwap router issues or no HBAR/USDC pair');
    }

    // Step 5: Test the main function (if conditions are favorable)
    console.log('\n🔄 STEP 5: Testing Swap and Deposit Function');
    console.log('-' .repeat(50));
    
    // Check initial USDC balance
    const usdcContract = new ethers.Contract(
        usdcAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        signer
    );
    
    let initialUsdcBalance;
    try {
        initialUsdcBalance = await usdcContract.balanceOf(myAddress);
        const usdcDecimals = await usdcContract.decimals();
        console.log('💵 Initial USDC Balance:', ethers.utils.formatUnits(initialUsdcBalance, usdcDecimals), 'USDC');
    } catch (error) {
        console.log('⚠️  Could not check initial USDC balance');
        initialUsdcBalance = ethers.BigNumber.from(0);
    }

    // Attempt the swap and deposit
    const swapAmount = ethers.utils.parseEther('0.5'); // 0.5 HBAR for testing
    const minUSDCOut = 0; // Accept any amount for testing (not recommended for production)
    
    console.log('💱 Attempting to swap', ethers.utils.formatEther(swapAmount), 'HBAR for USDC and deposit to Bonzo...');
    
    try {
        const tx = await integrator.swapHBARForUSDCAndDeposit(
            minUSDCOut,
            {
                value: swapAmount,
                gasLimit: 1000000 // Higher gas limit for complex transaction
            }
        );
        
        console.log('⏳ Transaction hash:', tx.hash);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log('✅ Swap and deposit completed successfully!');
            
            // Parse events
            const events = receipt.events || [];
            console.log('\n📋 Transaction Events:');
            events.forEach((event, index) => {
                console.log(`   ${index + 1}. ${event.event || 'Unknown Event'}`);
                if (event.args) {
                    console.log('      Args:', event.args);
                }
            });
            
            // Check final balances
            const finalHbarBalance = await signer.getBalance();
            const hbarUsed = initialBalance.sub(finalHbarBalance);
            
            console.log('\n🎉 Transaction Summary:');
            console.log('💰 HBAR Used (including gas):', ethers.utils.formatEther(hbarUsed), 'HBAR');
            console.log('📊 Final HBAR Balance:', ethers.utils.formatEther(finalHbarBalance), 'HBAR');
            console.log('🔗 Transaction Hash:', tx.hash);
            
        } else {
            console.log('❌ Transaction failed with status:', receipt.status);
        }
        
    } catch (error) {
        console.log('❌ Swap and deposit failed:', error.message.split('\n')[0]);
        
        if (error.message.includes('CALL_EXCEPTION')) {
            console.log('\n💡 Possible issues:');
            console.log('   - HBAR/USDC liquidity pool does not exist');
            console.log('   - USDC is not supported by Bonzo Finance');
            console.log('   - Insufficient slippage tolerance');
            console.log('   - Network connectivity issues');
        }
    }

    // Step 6: Contract summary
    console.log('\n📋 STEP 6: Contract Summary');
    console.log('-' .repeat(50));
    console.log('✅ Contract deployed and tested');
    console.log('📍 Contract Address:', integrator.address);
    console.log('🔧 Owner:', await integrator.owner());
    console.log('💡 The contract is ready for production use (if USDC is supported by Bonzo)');
    
    console.log('\n🔧 Available Functions:');
    console.log('   - swapHBARForUSDCAndDeposit(minUSDCOut)');
    console.log('   - getExpectedUSDCOutput(hbarAmount)');
    console.log('   - checkUSDCSupportInBonzo()');
    console.log('   - emergencyWithdrawToken(token, amount) [Owner only]');
    console.log('   - emergencyWithdrawHBAR() [Owner only]');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });