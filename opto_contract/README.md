<p align="center">
  <a href="https://layerzero.network">
    <img alt="LayerZero" style="width: 400px" src="https://docs.layerzero.network/img/LayerZero_Logo_Black.svg"/>
  </a>
</p>

<p align="center">
  <a href="https://docs.layerzero.network/" style="color: #a77dff">LayerZero Docs</a>
</p>

<h1 align="center">Omnichain Application (OApp) Example</h1>

<p align="center">Template project for creating custom omnichain applications (<a href="https://docs.layerzero.network/v2/concepts/applications/oapp-standard">OApp</a>) powered by the LayerZero protocol. This example demonstrates how to build applications that can send and receive arbitrary messages across different blockchains.</p>

## Table of Contents

- [Prerequisite Knowledge](#prerequisite-knowledge)
- [Requirements](#requirements)
- [Scaffold this example](#scaffold-this-example)
- [Helper Tasks](#helper-tasks)
- [Setup](#setup)
- [Build](#build)
  - [Compiling your contracts](#compiling-your-contracts)
- [Deploy](#deploy)
- [Enable Messaging](#enable-messaging)
- [Sending Messages](#sending-messages)
- [Next Steps](#next-steps)
- [Production Deployment Checklist](#production-deployment-checklist)
- [Appendix](#appendix)
  - [Running Tests](#running-tests)
  - [Adding other chains](#adding-other-chains)
  - [Using Multisigs](#using-multisigs)
  - [LayerZero Hardhat Helper Tasks](#layerzero-hardhat-helper-tasks)
  - [Contract Verification](#contract-verification)
  - [Troubleshooting](#troubleshooting)

## Prerequisite Knowledge

- [What is an OApp (Omnichain Application)?](https://docs.layerzero.network/v2/concepts/applications/oapp-standard)
- [How does LayerZero work?](https://docs.layerzero.network/v2/concepts/protocol/core-concepts)

## Requirements

- `Node.js` - `>=18.16.0`
- `pnpm` (recommended) - or another package manager of your choice (npm, yarn)
- `forge` (optional) - `>=0.2.0` for testing, and if not using Hardhat for compilation

## Scaffold this example

Create your local copy of this example:

```bash
pnpm dlx create-lz-oapp@latest --example oapp
```

Specify the directory, select `OApp` and proceed with the installation.

Note that `create-lz-oapp` will also automatically run the dependencies install step for you.

## Contract Address

Hedera test account:
`0xBa0Dd4142A6B7E3D836C65B21e060520D7c886d0`

OApp Hedera testnet Contract Address: `0xF6EB0F927f801c93569EB71257D4231F4C03257E`

OApp Sepolia testnet Contract Address: `0xC081e3CC49D5e4ac78486D2A40140a5cB81328de`

HBAR to HBARX swap and HBARX to Bonzo Finance Contract Address:
`0x4Cbe23c9d2c27BBcd62d8B01Ab3D9289a346B0D1`

All of the above Hedera contracts are verified on Hashscan, also can be checked on Hashscan.