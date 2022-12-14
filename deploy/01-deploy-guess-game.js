const { network, ethers } = require("hardhat")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const nonceHash = ethers.utils.id(process.env.GUESS_GAME_NONCE)
    const nonceNumHash = ethers.utils.id(process.env.GUESS_GAME_NONCE + process.env.GUESS_GAME_NUMBER)
    const numOfPlayers = process.env.GUESS_GAME_NUM_OF_PLAYERS

    const args = [nonceHash, nonceNumHash, numOfPlayers]

    const guessGame = await deploy("GuessGame", {
        from: deployer,
        args: args,
        log: true,
        value: ethers.utils.parseEther("1"),
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("----------------------------------------------------")
}

module.exports.tags = ["all", "GuessGame"]
