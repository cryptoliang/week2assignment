const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");

describe("GuessGame", async function () {
  describe("constructor", async function () {
    let anyHash, initFund, GuessGameFactory;
    beforeEach(async function () {
      anyHash = ethers.utils.id("any");
      initFund = ethers.utils.parseEther("1");
      GuessGameFactory = await ethers.getContractFactory("GuessGame");
    });

    it("should initial the guess game correctly", async function () {
      const guessGame = await GuessGameFactory.deploy(anyHash, anyHash, 2, { value: initFund });
      expect(await guessGame.nonceHash()).to.eq(anyHash);
      expect(await guessGame.nonceNumHash()).to.eq(anyHash);
      expect(await guessGame.playersCount()).to.eq(2);
      expect(await guessGame.isOpen()).to.be.true;
    });

    it("should revert when deployed with zero fund", async function () {
      await expect(GuessGameFactory.deploy(anyHash, anyHash, 2)).to.be.revertedWithCustomError(
        GuessGameFactory,
        `VoidFund`
      );
    });

    it("should revert when deployed with playersCount less than 2", async function () {
      await expect(GuessGameFactory.deploy(anyHash, anyHash, 0, { value: initFund })).to.be.revertedWithCustomError(
        GuessGameFactory,
        `InvalidPlayerCount`
      );

      await expect(GuessGameFactory.deploy(anyHash, anyHash, 1, { value: initFund })).to.be.revertedWithCustomError(
        GuessGameFactory,
        `InvalidPlayerCount`
      );
    });
  });

  describe("functions", async function () {
    let guessGame, deployer;

    beforeEach(async function () {
      deployer = (await getNamedAccounts()).deployer;
      await deployments.fixture(["all"]);
      guessGame = await ethers.getContract("GuessGame", deployer);
    });

    describe("guess", async function () {
      it("should revert if the guess num is not within the range [0, 1000)", async function () {
        await expect(guessGame.guess(1000)).to.be.revertedWithCustomError(guessGame, "InvalidGuessNumber");
      });
    });
  });
});
