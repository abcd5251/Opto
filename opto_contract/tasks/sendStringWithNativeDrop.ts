import { ContractTransaction } from 'ethers'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { createLogger } from '@layerzerolabs/io-devtools'
import { endpointIdToNetwork } from '@layerzerolabs/lz-definitions'

// Import LayerZero logging utilities
const logger = createLogger()

// Known error types for consistent error handling
enum KnownErrors {
    ERROR_GETTING_DEPLOYMENT = 'ERROR_GETTING_DEPLOYMENT',
    ERROR_QUOTING_GAS_COST = 'ERROR_QUOTING_GAS_COST',
    ERROR_SENDING_TRANSACTION = 'ERROR_SENDING_TRANSACTION',
}

// Known output types for consistent success messaging
enum KnownOutputs {
    SENT_VIA_OAPP = 'SENT_VIA_OAPP',
    TX_HASH = 'TX_HASH',
    EXPLORER_LINK = 'EXPLORER_LINK',
}

// Simple DebugLogger implementation for structured messaging
class DebugLogger {
    static printErrorAndFixSuggestion(errorType: KnownErrors, context: string) {
        logger.error(`❌ ${errorType}: ${context}`)
    }

    static printLayerZeroOutput(outputType: KnownOutputs, message: string) {
        logger.info(`✅ ${outputType}: ${message}`)
    }
}

// Get LayerZero scan link
function getLayerZeroScanLink(txHash: string, isTestnet = false): string {
    const baseUrl = isTestnet ? 'https://testnet.layerzeroscan.com' : 'https://layerzeroscan.com'
    return `${baseUrl}/tx/${txHash}`
}

// Get block explorer link (simplified version)
async function getBlockExplorerLink(networkName: string, txHash: string): Promise<string | undefined> {
    // This is a simplified version - in production you'd fetch from the metadata API
    const explorers: Record<string, string> = {
        'sepolia': 'https://sepolia.etherscan.io',
        'hedera-testnet': 'https://hashscan.io/testnet',
        'optimism-sepolia': 'https://sepolia-optimism.etherscan.io',
        'arbitrum-sepolia': 'https://sepolia.arbiscan.io',
        'avalanche-testnet': 'https://testnet.snowtrace.io',
    }

    const explorer = explorers[networkName]
    return explorer ? `${explorer}/tx/${txHash}` : undefined
}

task('lz:oapp:send:native-drop', 'Sends a string cross‐chain with native gas drop using MyOApp contract')
    .addParam('dstEid', 'Destination endpoint ID', undefined, types.int)
    .addParam('string', 'String to send', undefined, types.string)
    .addParam('nativeDropAmount', 'Amount of native gas to drop (in wei)', undefined, types.string)
    .addParam('receiver', 'Address to receive the native drop', undefined, types.string)
    .setAction(async (args: { dstEid: number; string: string; nativeDropAmount: string; receiver: string }, hre: HardhatRuntimeEnvironment) => {
        logger.info(`Initiating string send with native drop from ${hre.network.name} to ${endpointIdToNetwork(args.dstEid)}`)
        logger.info(`String to send: "${args.string}"`)
        logger.info(`Destination EID: ${args.dstEid}`)
        logger.info(`Native drop amount: ${args.nativeDropAmount} wei`)
        logger.info(`Receiver address: ${args.receiver}`)

        // Get the signer
        const [signer] = await hre.ethers.getSigners()
        logger.info(`Using signer: ${signer.address}`)

        // Get the deployed MyOApp contract
        let myOAppContract
        let contractAddress: string
        try {
            const myOAppDeployment = await hre.deployments.get('MyOApp')
            contractAddress = myOAppDeployment.address
            myOAppContract = await hre.ethers.getContractAt('MyOApp', contractAddress, signer)
            logger.info(`MyOApp contract found at: ${contractAddress}`)
        } catch (error) {
            DebugLogger.printErrorAndFixSuggestion(
                KnownErrors.ERROR_GETTING_DEPLOYMENT,
                `Failed to get MyOApp deployment on network: ${hre.network.name}`
            )
            throw error
        }

        // Validate receiver address
        if (!hre.ethers.utils.isAddress(args.receiver)) {
            throw new Error(`Invalid receiver address: ${args.receiver}`)
        }

        // 1️⃣ Quote the gas cost
        logger.info('Quoting gas cost for the send transaction with native drop...')
        let messagingFee
        try {
            messagingFee = await myOAppContract.quoteSendStringWithNativeDrop(
                args.dstEid,
                args.string,
                args.nativeDropAmount,
                args.receiver,
                false // payInLzToken = false (pay in native token)
            )
            logger.info(`  Native fee: ${hre.ethers.utils.formatEther(messagingFee.nativeFee)} ETH`)
            logger.info(`  LZ token fee: ${messagingFee.lzTokenFee.toString()} LZ`)
            logger.info(`  Native drop amount: ${hre.ethers.utils.formatEther(args.nativeDropAmount)} ETH`)
        } catch (error) {
            DebugLogger.printErrorAndFixSuggestion(
                KnownErrors.ERROR_QUOTING_GAS_COST,
                `For network: ${endpointIdToNetwork(args.dstEid)}, Contract: ${contractAddress}`
            )
            throw error
        }

        // 2️⃣ Send the string with native drop
        logger.info('Sending the string transaction with native drop...')
        let tx: ContractTransaction
        try {
            tx = await myOAppContract.sendStringWithNativeDrop(
                args.dstEid,
                args.string,
                args.nativeDropAmount,
                args.receiver,
                {
                    value: messagingFee.nativeFee, // Pay the native fee
                }
            )
            logger.info(`  Transaction hash: ${tx.hash}`)
        } catch (error) {
            DebugLogger.printErrorAndFixSuggestion(
                KnownErrors.ERROR_SENDING_TRANSACTION,
                `For network: ${endpointIdToNetwork(args.dstEid)}, Contract: ${contractAddress}`
            )
            throw error
        }

        // 3️⃣ Wait for confirmation
        logger.info('Waiting for transaction confirmation...')
        const receipt = await tx.wait()
        logger.info(`  Gas used: ${receipt.gasUsed.toString()}`)
        logger.info(`  Block number: ${receipt.blockNumber}`)

        // 4️⃣ Success messaging and links
        DebugLogger.printLayerZeroOutput(
            KnownOutputs.SENT_VIA_OAPP,
            `Successfully sent "${args.string}" with ${hre.ethers.utils.formatEther(args.nativeDropAmount)} ETH native drop from ${hre.network.name} to ${endpointIdToNetwork(args.dstEid)}`
        )

        // Get and display block explorer link
        const explorerLink = await getBlockExplorerLink(hre.network.name, receipt.transactionHash)
        if (explorerLink) {
            DebugLogger.printLayerZeroOutput(
                KnownOutputs.TX_HASH,
                `Block explorer link for source chain ${hre.network.name}: ${explorerLink}`
            )
        }

        // Get and display LayerZero scan link
        const scanLink = getLayerZeroScanLink(receipt.transactionHash, args.dstEid >= 40_000 && args.dstEid < 50_000)
        DebugLogger.printLayerZeroOutput(
            KnownOutputs.EXPLORER_LINK,
            `LayerZero Scan link for tracking cross-chain delivery: ${scanLink}`
        )

        return {
            txHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            scanLink: scanLink,
            explorerLink: explorerLink,
            nativeDropAmount: args.nativeDropAmount,
            receiver: args.receiver,
        }
    })