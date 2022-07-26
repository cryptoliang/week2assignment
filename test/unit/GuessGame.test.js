const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")

describe("GuessGame", async function () {
    describe("constructor", async function () {
        let anyHash, initFund, GuessGameFactory

        beforeEach(async function () {
            anyHash = ethers.utils.id("any")
            initFund = ethers.utils.parseEther("1")
            GuessGameFactory = await ethers.getContractFactory("GuessGame")
        })

        it("should initial the guess game correctly", async function () {
            const guessGame = await GuessGameFactory.deploy(anyHash, anyHash, 2, { value: initFund })
            expect(await guessGame.nonceHash()).to.eq(anyHash)
            expect(await guessGame.nonceNumHash()).to.eq(anyHash)
            expect(await guessGame.numOfPlayers()).to.eq(2)
            expect(await guessGame.entranceFee()).to.eq(initFund)
            expect(await guessGame.isOpen()).to.be.true
        })

        it("should revert when deployed with zero fund", async function () {
            await expect(GuessGameFactory.deploy(anyHash, anyHash, 2)).to.be.revertedWithCustomError(
                GuessGameFactory,
                `VoidFund`
            )
        })

        it("should revert when deployed with numOfPlayers less than 2", async function () {
            await expect(
                GuessGameFactory.deploy(anyHash, anyHash, 0, { value: initFund })
            ).to.be.revertedWithCustomError(GuessGameFactory, `InvalidPlayerCount`)

            await expect(
                GuessGameFactory.deploy(anyHash, anyHash, 1, { value: initFund })
            ).to.be.revertedWithCustomError(GuessGameFactory, `InvalidPlayerCount`)
        })
    })

    describe("functions", async function () {
        let guessGame, deployer, entranceFee, accounts

        beforeEach(async function () {
            accounts = await ethers.getSigners()
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            guessGame = await ethers.getContract("GuessGame", deployer)
            entranceFee = await guessGame.entranceFee()
        })

        describe("guess", async function () {
            it("should successfully add the guess nunber", async function () {
                await guessGame.guess(999, { value: entranceFee })
                expect(await guessGame.guessNumbers(0)).to.eq(999)
            })

            it("should revert if the guess num is not within the range [0, 1000)", async function () {
                await expect(guessGame.guess(1000, { value: entranceFee })).to.be.revertedWithCustomError(
                    guessGame,
                    "InvalidGuessNumber"
                )
            })

            it("should revert if the player has already submitted a number", async function () {
                await guessGame.guess(0, { value: entranceFee })
                await expect(guessGame.guess(0, { value: entranceFee })).to.be.revertedWithCustomError(
                    guessGame,
                    "PlayerAlreadyGuessed"
                )
            })

            it("should revert if the number has been guessed by another Player", async function () {
                await guessGame.guess(0, { value: entranceFee })
                guessGame = guessGame.connect(accounts[1])
                await expect(guessGame.guess(0, { value: entranceFee })).to.be.revertedWithCustomError(
                    guessGame,
                    "NumberAlreadyGuessed"
                )
            })

            it("should revert if the game has already concluded", async function () {})

            it("should revert if the player has not attached the same ETH value as the host deposited", async function () {
                const invalidEntranceFee = await entranceFee.add(1)
                await expect(guessGame.guess(0, { value: invalidEntranceFee })).to.be.revertedWithCustomError(
                    guessGame,
                    "InvalidETHAmount"
                )
            })

            it("should revert if the players count reach the limit", async function () {
                const numOfPlayers = await guessGame.numOfPlayers()
                for (let i = 0; i < numOfPlayers; i++) {
                    guessGame = guessGame.connect(accounts[i])
                    await guessGame.guess(i, { value: entranceFee })
                }

                guessGame = guessGame.connect(accounts[numOfPlayers])

                await expect(guessGame.guess(numOfPlayers, { value: entranceFee })).to.be.revertedWithCustomError(
                    guessGame,
                    "NumberOfPalyersLimitReached"
                )
            })
        })
    })
})
