# LayerZero Native Drop Feature

This document explains how to use the native drop feature that has been added to the MyOApp contract for bridging Sepolia ETH gas to Hedera testnet gas.

## Overview

The native drop feature allows you to send a cross-chain message while simultaneously dropping native gas tokens on the destination chain to a specified receiver address. This is particularly useful for bridging gas from Sepolia to Hedera testnet.

## New Functions Added

### 1. `quoteSendStringWithNativeDrop`

Estimates the fee for sending a string message with native drop.

```solidity
function quoteSendStringWithNativeDrop(
    uint32 _dstEid,
    string calldata _string,
    uint128 _nativeDropAmount,
    address _receiver,
    bool _payInLzToken
) public view returns (MessagingFee memory fee)
```

**Parameters:**
- `_dstEid`: Destination endpoint ID (e.g., 40161 for Hedera testnet)
- `_string`: Message to send
- `_nativeDropAmount`: Amount of native gas to drop (in wei)
- `_receiver`: Address to receive the native drop
- `_payInLzToken`: Whether to pay fees in LZ token

### 2. `sendStringWithNativeDrop`

Sends a string message with native drop to the destination chain.

```solidity
function sendStringWithNativeDrop(
    uint32 _dstEid,
    string calldata _string,
    uint128 _nativeDropAmount,
    address _receiver
) external payable
```

**Parameters:**
- `_dstEid`: Destination endpoint ID
- `_string`: Message to send
- `_nativeDropAmount`: Amount of native gas to drop (in wei)
- `_receiver`: Address to receive the native drop

## Usage Examples

### Using Hardhat Tasks

A new Hardhat task `lz:oapp:send:native-drop` has been created for easy testing:

```bash
# Send a message with native drop from Sepolia to Hedera
pnpm hardhat lz:oapp:send:native-drop \
  --network sepolia-testnet \
  --dst-eid 40161 \
  --message "Hello Hedera with gas drop!" \
  --native-drop-amount "100000000000000000" \
  --receiver "0x1234567890123456789012345678901234567890"
```

### Using Contract Directly

```javascript
// Quote the fee first
const fee = await myOApp.quoteSendStringWithNativeDrop(
  40161, // Hedera testnet EID
  "Hello Hedera!",
  ethers.utils.parseEther("0.1"), // 0.1 ETH worth of gas
  receiverAddress,
  false
)

// Send the message with native drop
await myOApp.sendStringWithNativeDrop(
  40161,
  "Hello Hedera!",
  ethers.utils.parseEther("0.1"),
  receiverAddress,
  { value: fee.nativeFee }
)
```

## Network Configuration

The contract is configured to work with:
- **Sepolia Testnet** (EID: 40161)
- **Hedera Testnet** (EID: 40161)

Make sure your `.env` file contains the necessary private keys and RPC URLs for both networks.

## Testing

Run the test suite to verify the native drop functionality:

```bash
pnpm test:hardhat
```

The tests include:
1. Fee quotation for native drop
2. Sending messages with native drop
3. Verification of message delivery

## Important Notes

1. **Gas Estimation**: The contract automatically includes 80,000 gas for `lzReceive` execution
2. **Fee Calculation**: Always quote fees before sending to ensure sufficient payment
3. **Native Drop Amount**: Specify the amount in wei (1 ETH = 10^18 wei)
4. **Receiver Address**: Must be a valid address on the destination chain

## Security Considerations

- Always validate the receiver address
- Ensure sufficient native fee payment
- Test on testnets before mainnet deployment
- Monitor gas costs and adjust accordingly