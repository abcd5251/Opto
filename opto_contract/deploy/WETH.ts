import assert from 'assert'

import { type DeployFunction } from 'hardhat-deploy/types'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre

    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    const { address } = await deploy('WETH', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`Deployed WETH at: ${address}`)
}

deploy.tags = ['WETH']

export default deploy