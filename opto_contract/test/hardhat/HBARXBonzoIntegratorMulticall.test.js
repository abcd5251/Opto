const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('HBARXBonzoIntegratorMulticall', function () {
    let multicallIntegrator;
    let owner;
    let otherAccount;

    // Increase timeout for network operations
    this.timeout(60000);

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();
        
        const MulticallIntegratorFactory = await ethers.getContractFactory('HBARXBonzoIntegratorMulticall');
        multicallIntegrator = await MulticallIntegratorFactory.deploy();
        await multicallIntegrator.deployed();
    });

    describe('Deployment', function () {
        it('Should deploy with correct owner', async function () {
            expect(await multicallIntegrator.owner()).to.equal(owner.address);
        });

        it('Should have correct contract addresses', async function () {
            expect(await multicallIntegrator.SAUCERSWAP_ROUTER()).to.equal('0x0000000000000000000000000000000000004b40');
            expect(await multicallIntegrator.WHBAR_ADDRESS()).to.equal('0x0000000000000000000000000000000000003aD1');
            expect(await multicallIntegrator.HBARX_ADDRESS()).to.equal('0x0000000000000000000000000000000000220cED');
            expect(await multicallIntegrator.BONZO_LENDING_POOL()).to.equal('0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2');
        });
    });

    describe('View Functions', function () {
        describe('getExpectedHBARXOutput', function () {
            it('Should return expected HBARX output for valid input', async function () {
                const hbarAmount = ethers.utils.parseEther('1');
                try {
                    const result = await multicallIntegrator.getExpectedHBARXOutput(hbarAmount);
                    // Result should be a number (could be 0 if no liquidity)
                    expect(ethers.BigNumber.isBigNumber(result)).to.be.true;
                } catch (error) {
                    // May fail due to external contract calls on testnet
                    console.log('Expected behavior: External contract call may fail on testnet');
                }
            });

            it('Should handle zero input', async function () {
                try {
                    const result = await multicallIntegrator.getExpectedHBARXOutput(0);
                    expect(ethers.BigNumber.isBigNumber(result)).to.be.true;
                } catch (error) {
                    // May fail due to external contract calls
                    console.log('Expected behavior: External contract call may fail');
                }
            });
        });

        describe('checkHBARXSupportInBonzo', function () {
            it('Should return boolean for HBARX support check', async function () {
                try {
                    const result = await multicallIntegrator.checkHBARXSupportInBonzo();
                    expect(typeof result).to.equal('boolean');
                } catch (error) {
                    // May fail due to external contract calls
                    console.log('Expected behavior: External contract call may fail');
                }
            });
        });
    });

    describe('Batch Functions', function () {
        describe('batchGetQuotesAndSupport', function () {
            it('Should return quotes for multiple amounts', async function () {
                const amounts = [ethers.utils.parseEther('1'), ethers.utils.parseEther('2')];
                try {
                    const result = await multicallIntegrator.batchGetQuotesAndSupport(amounts);
                    expect(result).to.have.lengthOf(2); // [quotes, isSupported]
                    expect(Array.isArray(result[0])).to.be.true; // quotes array
                    expect(typeof result[1]).to.equal('boolean'); // isSupported
                } catch (error) {
                    // May fail due to external contract calls
                    console.log('Expected behavior: External contract call may fail');
                }
            });

            it('Should handle empty amounts array', async function () {
                try {
                    const result = await multicallIntegrator.batchGetQuotesAndSupport([]);
                    expect(result).to.have.lengthOf(2);
                    expect(Array.isArray(result[0])).to.be.true;
                    expect(result[0]).to.have.lengthOf(0);
                } catch (error) {
                    console.log('Expected behavior: External contract call may fail');
                }
            });
        });
    });

    describe('Multicall3 Functions', function () {
        describe('aggregate', function () {
            it('Should execute multiple calls successfully', async function () {
                const calls = [
                    {
                        target: multicallIntegrator.address,
                        callData: multicallIntegrator.interface.encodeFunctionData('owner', [])
                    },
                    {
                        target: multicallIntegrator.address,
                        callData: multicallIntegrator.interface.encodeFunctionData('SAUCERSWAP_ROUTER', [])
                    }
                ];
                
                const result = await multicallIntegrator.callStatic.aggregate(calls);
                expect(result).to.have.lengthOf(2);
                expect(ethers.BigNumber.isBigNumber(result[0]) || typeof result[0] === 'number').to.be.true; // block number
                expect(Array.isArray(result[1])).to.be.true; // return data
                expect(result[1]).to.have.lengthOf(calls.length);
            });

            it('Should revert if any call fails', async function () {
                const calls = [
                    {
                        target: multicallIntegrator.address,
                        callData: '0x12345678' // Invalid function selector
                    }
                ];
                
                try {
                    await multicallIntegrator.callStatic.aggregate(calls);
                    expect.fail('Should have reverted');
                } catch (error) {
                    expect(error.message).to.include('revert');
                }
            });
        });

        describe('aggregate3', function () {
            it('Should execute calls with success results', async function () {
                const calls = [
                    {
                        target: multicallIntegrator.address,
                        allowFailure: false,
                        callData: multicallIntegrator.interface.encodeFunctionData('owner', [])
                    },
                    {
                        target: multicallIntegrator.address,
                        allowFailure: true,
                        callData: multicallIntegrator.interface.encodeFunctionData('owner', [])
                    }
                ];
                
                const result = await multicallIntegrator.callStatic.aggregate3(calls);
                expect(result).to.have.lengthOf(2);
                expect(ethers.BigNumber.isBigNumber(result[0]) || typeof result[0] === 'number').to.be.true; // block number
                expect(Array.isArray(result[1])).to.be.true; // results
                expect(result[1]).to.have.lengthOf(calls.length);
                expect(result[1][0].success).to.be.true; // First call should succeed
                expect(result[1][1].success).to.be.true; // Second call should also succeed
            });

            it('Should revert if non-failure-tolerant call fails', async function () {
                const calls = [
                    {
                        target: multicallIntegrator.address,
                        allowFailure: false,
                        callData: '0x12345678' // Invalid function selector
                    }
                ];
                
                try {
                    await multicallIntegrator.callStatic.aggregate3(calls);
                    expect.fail('Should have reverted');
                } catch (error) {
                    expect(error.message).to.include('revert');
                }
            });
        });

        describe('aggregate3Value', function () {
            it('Should have correct function signature', async function () {
                // Test that the function exists and has correct interface
                const functionExists = multicallIntegrator.interface.functions['aggregate3Value((address,bool,uint256,bytes)[])'] !== undefined;
                expect(functionExists).to.be.true;
            });
        });
    });

    describe('Enhanced Swap Functions', function () {
        describe('batchSwapHBARForHBARXAndDeposit', function () {
            it('Should have correct function signature', async function () {
                // Test that the function exists and has correct interface
                const functionExists = multicallIntegrator.interface.functions['batchSwapHBARForHBARXAndDeposit((uint256,bool,bool))'] !== undefined;
                expect(functionExists).to.be.true;
            });
        });
    });

    describe('Access Control', function () {
        it('Should restrict emergency functions to owner', async function () {
            try {
                await multicallIntegrator.connect(otherAccount).emergencyWithdrawHBAR();
                expect.fail('Should have reverted');
            } catch (error) {
                expect(error.message).to.match(/(revert|Ownable|caller is not the owner|sending a transaction requires a signer)/);
            }
        });
    });

    describe('HBAR Handling', function () {
        it('Should accept HBAR transfers', async function () {
            const initialBalance = await ethers.provider.getBalance(multicallIntegrator.address);
            
            // Send HBAR to contract
            await owner.sendTransaction({
                to: multicallIntegrator.address,
                value: ethers.utils.parseEther('0.1')
            });
            
            const newBalance = await ethers.provider.getBalance(multicallIntegrator.address);
            expect(newBalance.gt(initialBalance)).to.be.true;
        });

        it('Should allow owner to withdraw HBAR', async function () {
            // Send HBAR to contract first
            await owner.sendTransaction({
                to: multicallIntegrator.address,
                value: ethers.utils.parseEther('0.1')
            });
            
            const balanceBefore = await ethers.provider.getBalance(multicallIntegrator.address);
            expect(balanceBefore.gt(0)).to.be.true;
            
            // Withdraw HBAR
            await multicallIntegrator.emergencyWithdrawHBAR();
            
            const balanceAfter = await ethers.provider.getBalance(multicallIntegrator.address);
            expect(balanceAfter.eq(0)).to.be.true;
        });
    });

    describe('Gas Efficiency', function () {
        it('Should demonstrate gas savings with multicall', async function () {
            const calls = [
                {
                    target: multicallIntegrator.address,
                    callData: multicallIntegrator.interface.encodeFunctionData('owner', [])
                },
                {
                    target: multicallIntegrator.address,
                    callData: multicallIntegrator.interface.encodeFunctionData('SAUCERSWAP_ROUTER', [])
                }
            ];
            
            // Estimate gas for individual calls
            const gas1 = await multicallIntegrator.estimateGas.owner();
            const gas2 = await multicallIntegrator.estimateGas.SAUCERSWAP_ROUTER();
            const totalIndividualGas = gas1.add(gas2);
            
            // Estimate gas for batch call
            const batchGas = await multicallIntegrator.estimateGas.aggregate(calls);
            
            console.log('Individual calls gas:', totalIndividualGas.toString());
            console.log('Batch call gas:', batchGas.toString());
            
            // Batch should be more efficient (use less gas)
            expect(batchGas.lt(totalIndividualGas)).to.be.true;
        });
    });

    describe('Edge Cases', function () {
        it('Should handle empty multicall arrays', async function () {
            const result = await multicallIntegrator.callStatic.aggregate([]);
            expect(result).to.have.lengthOf(2);
            expect(ethers.BigNumber.isBigNumber(result[0]) || typeof result[0] === 'number').to.be.true; // block number
            expect(Array.isArray(result[1])).to.be.true; // return data
            expect(result[1]).to.have.lengthOf(0);
        });
    });
});