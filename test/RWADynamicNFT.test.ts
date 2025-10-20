import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { RWADynamicNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RWADynamicNFT Contract", function () {
  interface Fixture {
    nft: RWADynamicNFT;
    owner: SignerWithAddress;
    addr1: SignerWithAddress;
    addr2: SignerWithAddress;
    verifier: SignerWithAddress;
    updater: SignerWithAddress;
    MINTER_ROLE: string;
    VERIFIER_ROLE: string;
    UPDATER_ROLE: string;
  }

  async function deployDynamicNFTFixture(): Promise<Fixture> {
    const [owner, addr1, addr2, verifier, updater] = await ethers.getSigners();

    const RWADynamicNFTFactory = await ethers.getContractFactory("RWADynamicNFT");
    const nft = await RWADynamicNFTFactory.deploy("Real World Asset Dynamic NFT", "RWAD");

    // Grant roles
    const MINTER_ROLE = await nft.MINTER_ROLE();
    const VERIFIER_ROLE = await nft.VERIFIER_ROLE();
    const UPDATER_ROLE = await nft.UPDATER_ROLE();
    
    await nft.grantRole(VERIFIER_ROLE, verifier.address);
    await nft.grantRole(UPDATER_ROLE, updater.address);

    return { nft, owner, addr1, addr2, verifier, updater, MINTER_ROLE, VERIFIER_ROLE, UPDATER_ROLE };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { nft, owner } = await loadFixture(deployDynamicNFTFixture);
      const DEFAULT_ADMIN_ROLE = await nft.DEFAULT_ADMIN_ROLE();
      expect(await nft.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should have correct name and symbol", async function () {
      const { nft } = await loadFixture(deployDynamicNFTFixture);
      expect(await nft.name()).to.equal("Real World Asset Dynamic NFT");
      expect(await nft.symbol()).to.equal("RWAD");
    });

    it("Should start with zero total supply", async function () {
      const { nft } = await loadFixture(deployDynamicNFTFixture);
      expect(await nft.totalSupply()).to.equal(0);
    });
  });

  describe("Dynamic Minting", function () {
    it("Should mint a new Dynamic NFT", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await expect(
        nft.mintAsset(
          addr1.address,
          "Real Estate",
          "New York",
          50000000,
          "ipfs://docs",
          "ipfs://image1"
        )
      ).to.emit(nft, "AssetMinted");

      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.totalSupply()).to.equal(1);
    });

    it("Should store correct dynamic asset data", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(
        addr1.address,
        "Real Estate",
        "New York",
        50000000,
        "ipfs://docs",
        "ipfs://image1"
      );

      const asset = await nft.assetData(0);
      expect(asset.assetType).to.equal("Real Estate");
      expect(asset.location).to.equal("New York");
      expect(asset.valuationUSD).to.equal(50000000);
      expect(asset.condition).to.equal(0); // EXCELLENT
      expect(asset.isVerified).to.be.false;
      expect(asset.updateCount).to.equal(0);
    });

    it("Should initialize price history", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(
        addr1.address,
        "Real Estate",
        "New York",
        50000000,
        "ipfs://docs",
        "ipfs://image1"
      );

      const history = await nft.getPriceHistory(0);
      expect(history.length).to.equal(1);
      expect(history[0].price).to.equal(50000000);
    });
  });

  describe("Dynamic Updates", function () {
    it("Should update valuation and track history", async function () {
      const { nft, addr1, updater } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img");

      await expect(
        nft.connect(updater).updateValuation(0, 150000)
      ).to.emit(nft, "ValuationUpdated")
        .withArgs(0, 100000, 150000);

      const asset = await nft.assetData(0);
      expect(asset.valuationUSD).to.equal(150000);
      expect(asset.updateCount).to.equal(1);

      const history = await nft.getPriceHistory(0);
      expect(history.length).to.equal(2);
      expect(history[1].price).to.equal(150000);
    });

    it("Should update asset condition", async function () {
      const { nft, addr1, updater } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Vehicle", "LA", 3000000, "ipfs://docs", "ipfs://img");

      await expect(
        nft.connect(updater).updateCondition(0, 2) // FAIR
      ).to.emit(nft, "ConditionChanged")
        .withArgs(0, 0, 2);

      const asset = await nft.assetData(0);
      expect(asset.condition).to.equal(2);
    });

    it("Should update multiple properties at once", async function () {
      const { nft, addr1, updater } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Real Estate", "NYC", 100000, "ipfs://docs", "ipfs://img");

      await nft.connect(updater).updateAssetData(
        0,
        200000,
        3,
        "ipfs://newdocs"
      );

      const asset = await nft.assetData(0);
      expect(asset.valuationUSD).to.equal(200000);
      expect(asset.condition).to.equal(3);
      expect(asset.documentHash).to.equal("ipfs://newdocs");
      expect(asset.updateCount).to.equal(1);
    });

    it("Should add new images to asset", async function () {
      const { nft, addr1, updater } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img1");

      await nft.connect(updater).addAssetImage(0, "ipfs://img2");
      await nft.connect(updater).addAssetImage(0, "ipfs://img3");

      const images = await nft.getAssetImages(0);
      expect(images.length).to.equal(3);
      expect(images[0]).to.equal("ipfs://img1");
      expect(images[1]).to.equal("ipfs://img2");
      expect(images[2]).to.equal("ipfs://img3");
    });
  });

  describe("Verification", function () {
    it("Should verify an asset", async function () {
      const { nft, addr1, verifier } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Real Estate", "NYC", 100000, "ipfs://docs", "ipfs://img");

      await expect(
        nft.connect(verifier).verifyAsset(0)
      ).to.emit(nft, "AssetVerified")
        .withArgs(0, verifier.address);

      const asset = await nft.assetData(0);
      expect(asset.isVerified).to.be.true;
    });

    it("Should fail to verify without VERIFIER_ROLE", async function () {
      const { nft, addr1, addr2 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img");

      await expect(
        nft.connect(addr2).verifyAsset(0)
      ).to.be.reverted;
    });
  });

  describe("Dynamic Metadata & SVG", function () {
    it("Should generate dynamic SVG", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Real Estate", "New York", 50000000, "ipfs://docs", "ipfs://img");

      const svg = await nft.generateSVG(0);
      
      expect(svg).to.include("<svg");
      expect(svg).to.include("Real Estate");
      expect(svg).to.include("New York");
      expect(svg).to.include("UNVERIFIED");
    });

    it("Should show VERIFIED in SVG after verification", async function () {
      const { nft, addr1, verifier } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img");
      await nft.connect(verifier).verifyAsset(0);

      const svg = await nft.generateSVG(0);
      expect(svg).to.include("VERIFIED");
    });

    it("Should generate dynamic JSON metadata", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Vehicle", "LA", 3000000, "ipfs://docs", "ipfs://img");

      const metadata = await nft.generateMetadata(0);
      
      expect(metadata).to.include("RWA #0");
      expect(metadata).to.include("Vehicle");
      expect(metadata).to.include("LA");
      expect(metadata).to.include("3000000");
    });

    it("Should return dynamic tokenURI", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Real Estate", "NYC", 100000, "ipfs://docs", "ipfs://img");

      const uri = await nft.tokenURI(0);
      expect(uri).to.include("data:application/json;base64,");
    });

    it("Should update metadata when asset is updated", async function () {
      const { nft, addr1, updater } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img");

      const uriBeforeUpdate = await nft.tokenURI(0);
      
      await nft.connect(updater).updateValuation(0, 200000);
      
      const uriAfterUpdate = await nft.tokenURI(0);
      
      expect(uriBeforeUpdate).to.not.equal(uriAfterUpdate);
    });
  });

  describe("Price Analytics", function () {
    it("Should calculate price appreciation", async function () {
      const { nft, addr1, updater } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Real Estate", "NYC", 100000, "ipfs://docs", "ipfs://img");

      await nft.connect(updater).updateValuation(0, 150000);

      const appreciation = await nft.getPriceAppreciation(0);
      expect(appreciation).to.equal(5000);
    });

    it("Should calculate price depreciation", async function () {
      const { nft, addr1, updater } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Vehicle", "LA", 200000, "ipfs://docs", "ipfs://img");

      await nft.connect(updater).updateValuation(0, 150000);

      const appreciation = await nft.getPriceAppreciation(0);
      expect(appreciation).to.equal(-2500);
    });

    it("Should track multiple price changes", async function () {
      const { nft, addr1, updater } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img");

      await nft.connect(updater).updateValuation(0, 120000);
      await nft.connect(updater).updateValuation(0, 150000);
      await nft.connect(updater).updateValuation(0, 140000);

      const history = await nft.getPriceHistory(0);
      expect(history.length).to.equal(4);
      expect(history[0].price).to.equal(100000);
      expect(history[1].price).to.equal(120000);
      expect(history[2].price).to.equal(150000);
      expect(history[3].price).to.equal(140000);
    });
  });

  describe("Token Management", function () {
    it("Should return tokens of owner", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Real Estate", "NYC", 100000, "ipfs://docs", "ipfs://img1");
      await nft.mintAsset(addr1.address, "Art", "Paris", 50000, "ipfs://docs", "ipfs://img2");

      const tokens = await nft.tokensOfOwner(addr1.address);
      expect(tokens.length).to.equal(2);
      expect(tokens[0]).to.equal(0);
      expect(tokens[1]).to.equal(1);
    });

    it("Should handle transfers correctly", async function () {
      const { nft, addr1, addr2 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Vehicle", "LA", 100000, "ipfs://docs", "ipfs://img");

      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0);

      expect(await nft.ownerOf(0)).to.equal(addr2.address);
      expect(await nft.balanceOf(addr1.address)).to.equal(0);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
    });
  });

  describe("Royalty System", function () {
    it("Should calculate royalty correctly", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img");

      const salePrice = ethers.parseEther("1");
      const [receiver, amount] = await nft.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(await nft.royaltyReceiver());
      expect(amount).to.equal(salePrice * BigInt(250) / BigInt(10000));
    });

    it("Should update royalty info", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await nft.setRoyaltyInfo(addr1.address, 500);

      expect(await nft.royaltyReceiver()).to.equal(addr1.address);
      expect(await nft.royaltyBasisPoints()).to.equal(500);
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause", async function () {
      const { nft } = await loadFixture(deployDynamicNFTFixture);

      await nft.pause();
      expect(await nft.paused()).to.be.true;

      await nft.unpause();
      expect(await nft.paused()).to.be.false;
    });

    it("Should not allow minting when paused", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await nft.pause();

      await expect(
        nft.mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img")
      ).to.be.reverted;
    });

    it("Should not allow transfers when paused", async function () {
      const { nft, addr1, addr2 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img");

      await nft.pause();

      await expect(
        nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
      ).to.be.reverted;
    });
  });

  describe("Access Control", function () {
    it("Should fail to update without UPDATER_ROLE", async function () {
      const { nft, addr1, addr2 } = await loadFixture(deployDynamicNFTFixture);

      await nft.mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img");

      await expect(
        nft.connect(addr2).updateValuation(0, 150000)
      ).to.be.reverted;
    });

    it("Should fail to mint without MINTER_ROLE", async function () {
      const { nft, addr1 } = await loadFixture(deployDynamicNFTFixture);

      await expect(
        nft.connect(addr1).mintAsset(addr1.address, "Art", "Paris", 100000, "ipfs://docs", "ipfs://img")
      ).to.be.reverted;
    });
  });
});

