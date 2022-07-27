const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")

describe("GuessGame", async function () {
    describe("constructor", async function () {
        let anyHash, initFund, guessGameFactory

        beforeEach(async function () {
            anyHash = ethers.utils.id("any")
            initFund = ethers.utils.parseEther("1")
            guessGameFactory = await ethers.getContractFactory("GuessGame")
        })

        it("should initial the guess game correctly", async function () {
            const guessGame = await guessGameFactory.deploy(anyHash, anyHash, 2, { value: initFund })
            expect(await guessGame.nonceHash()).to.eq(anyHash)
            expect(await guessGame.nonceNumHash()).to.eq(anyHash)
            expect(await guessGame.numOfPlayers()).to.eq(2)
            expect(await guessGame.entranceFee()).to.eq(initFund)
            expect(await guessGame.isOpen()).to.be.true
        })

        it("should revert when deployed with zero fund", async function () {
            await expect(guessGameFactory.deploy(anyHash, anyHash, 2)).to.be.revertedWithCustomError(
                guessGameFactory,
                `VoidFund`
            )
        })

        it("should revert when deployed with numOfPlayers less than 2", async function () {
            await expect(
                guessGameFactory.deploy(anyHash, anyHash, 0, { value: initFund })
            ).to.be.revertedWithCustomError(guessGameFactory, `InvalidPlayerCount`)

            await expect(
                guessGameFactory.deploy(anyHash, anyHash, 1, { value: initFund })
            ).to.be.revertedWithCustomError(guessGameFactory, `InvalidPlayerCount`)
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

            it("should revert if the game has already concluded", async function () {
                const numOfPlayers = await guessGame.numOfPlayers()
                for (let i = 0; i < numOfPlayers; i++) {
                    const tempGuessGame = guessGame.connect(accounts[i])
                    await tempGuessGame.guess(i, { value: entranceFee })
                }

                let nonce = process.env.GUESS_GAME_NONCE
                let winNumber = parseInt(process.env.GUESS_GAME_NUMBER)
                const encodedNonce = ethers.utils.formatBytes32String(nonce)
                guessGame.reveal(encodedNonce, winNumber)

                await expect(guessGame.guess(0, { value: entranceFee })).to.be.revertedWithCustomError(
                    guessGame,
                    "GameClosed"
                )
            })

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
                    const tempGuessGame = guessGame.connect(accounts[i])
                    await tempGuessGame.guess(i, { value: entranceFee })
                }

                guessGame = guessGame.connect(accounts[numOfPlayers])

                await expect(guessGame.guess(numOfPlayers, { value: entranceFee })).to.be.revertedWithCustomError(
                    guessGame,
                    "NumberOfPalyersLimitReached"
                )
            })
        })

        describe("reveal", async function () {
            let nonce = process.env.GUESS_GAME_NONCE
            let winNumber = parseInt(process.env.GUESS_GAME_NUMBER)

            it("should revert if nonce doesn't match", async function () {
                const wrongNonce = ethers.utils.formatBytes32String(nonce + "any")
                await expect(guessGame.reveal(wrongNonce, winNumber)).to.be.revertedWithCustomError(
                    guessGame,
                    "InvalidNonce"
                )
            })

            it("should revert if number doesn't match", async function () {
                const encodedNonce = ethers.utils.formatBytes32String(nonce)
                await expect(guessGame.reveal(encodedNonce, winNumber + 1)).to.be.revertedWithCustomError(
                    guessGame,
                    "InvalidGuessNumber"
                )
            })

            it("should revert if payers are not enough", async function () {
                const encodedNonce = ethers.utils.formatBytes32String(nonce)
                await expect(guessGame.reveal(encodedNonce, winNumber)).to.be.revertedWithCustomError(
                    guessGame,
                    "NotEnoughPlayers"
                )
            })

            it("should distribute the rewards evenly to all players if the number is within [0, 1000)", async function () {
                const guessGameFactory = await ethers.getContractFactory("GuessGame")
                const entranceFee = ethers.utils.parseEther("1")
                const nonce = "HELLO"
                const invalidWinNumber = 1000
                const numOfPlayers = 2
                const nonceHash = ethers.utils.id(nonce)
                const nonceNumHash = ethers.utils.id(nonce + invalidWinNumber)
                const guessGame = await guessGameFactory.deploy(nonceHash, nonceNumHash, numOfPlayers, {
                    value: entranceFee,
                })

                await guessGame.connect(accounts[1]).guess(1, { value: entranceFee })
                await guessGame.connect(accounts[2]).guess(2, { value: entranceFee })

                const player1StartBlance = await accounts[1].getBalance()
                const player2StartBlance = await accounts[2].getBalance()

                await guessGame.reveal(ethers.utils.formatBytes32String(nonce), invalidWinNumber)

                const player1EndBlance = await accounts[1].getBalance()
                const player2EndBlance = await accounts[2].getBalance()

                expect(player1EndBlance.sub(player1StartBlance)).to.eq(ethers.utils.parseEther("1.5"))
                expect(player2EndBlance.sub(player2StartBlance)).to.eq(ethers.utils.parseEther("1.5"))
                expect(await ethers.provider.getBalance(guessGame.address)).to.eq(ethers.utils.parseEther("0"))
            })

            it("should send all reward if there is a single  winner", async function () {
                await guessGame.connect(accounts[1]).guess(winNumber + 1, { value: entranceFee })
                await guessGame.connect(accounts[2]).guess(winNumber + 2, { value: entranceFee })

                const player1StartBlance = await accounts[1].getBalance()
                const player2StartBlance = await accounts[2].getBalance()

                await guessGame.reveal(ethers.utils.formatBytes32String(nonce), winNumber)

                const player1EndBlance = await accounts[1].getBalance()
                const player2EndBlance = await accounts[2].getBalance()

                expect(player1EndBlance.sub(player1StartBlance)).to.eq(ethers.utils.parseEther("3"))
                expect(player2EndBlance.sub(player2StartBlance)).to.eq(ethers.utils.parseEther("0"))
                expect(await ethers.provider.getBalance(guessGame.address)).to.eq(ethers.utils.parseEther("0"))
            })

            it("should send reward evenly if there are two closest winners", async function () {
                await guessGame.connect(accounts[1]).guess(winNumber + 1, { value: entranceFee })
                await guessGame.connect(accounts[2]).guess(winNumber - 1, { value: entranceFee })

                const player1StartBlance = await accounts[1].getBalance()
                const player2StartBlance = await accounts[2].getBalance()

                await guessGame.reveal(ethers.utils.formatBytes32String(nonce), winNumber)

                const player1EndBlance = await accounts[1].getBalance()
                const player2EndBlance = await accounts[2].getBalance()

                expect(player1EndBlance.sub(player1StartBlance)).to.eq(ethers.utils.parseEther("1.5"))
                expect(player2EndBlance.sub(player2StartBlance)).to.eq(ethers.utils.parseEther("1.5"))
                expect(await ethers.provider.getBalance(guessGame.address)).to.eq(ethers.utils.parseEther("0"))
            })
        })
    })
})
