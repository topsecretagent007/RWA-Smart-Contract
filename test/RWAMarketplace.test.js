const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("RWAMarketplace Contract", function () {
  async function deployMarketplaceFixture() {
    const [owner, seller, buyer, feeReceiver] = await ethers.getSigners();

    // Deploy NFT contract
    const RWANFT = await ethers.getContractFactory("RWANFT");
    const nft = await RWANFT.deploy("Real World Asset NFT", "RWA");

    // Deploy Marketplace
    const RWAMarketplace = await ethers.getContractFactory("RWAMarketplace");
    const marketplace = await RWAMarketplace.deploy(feeReceiver.address);

    // Mint NFT to seller
    await nft.mintAsset(
      seller.address,
      "ipfs://test",
      "Real Estate",
      "NYC",
      100000,
      "ipfs://docs"
    );

    return { nft, marketplace, owner, seller, buyer, feeReceiver };
  }

  describe("Deployment", function () {
    it("Should set the correct fee receiver", async function () {
      const { marketplace, feeReceiver } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.feeReceiver()).to.equal(feeReceiver.address);
    });

    it("Should set default platform fee", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.platformFeeBasisPoints()).to.equal(250); // 2.5%
    });
  });

  describe("NFT Listing", function () {
    it("Should list an NFT for sale", async function () {
      const { nft, marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      // Approve marketplace
      await nft.connect(seller).approve(await marketplace.getAddress(), 0);

      const price = ethers.parseEther("1");
      await expect(
        marketplace.connect(seller).listNFT(await nft.getAddress(), 0, price)
      ).to.emit(marketplace, "NFTListed");

      const listing = await marketplace.listings(0);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(price);
      expect(listing.isActive).to.be.true;
    });

    it("Should fail to list without approval", async function () {
      const { nft, marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      const price = ethers.parseEther("1");
      await expect(
        marketplace.connect(seller).listNFT(await nft.getAddress(), 0, price)
      ).to.be.revertedWith("Marketplace not approved");
    });

    it("Should fail to list with zero price", async function () {
      const { nft, marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);

      await expect(
        marketplace.connect(seller).listNFT(await nft.getAddress(), 0, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });
  });

  describe("NFT Buying", function () {
    it("Should buy a listed NFT", async function () {
      const { nft, marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const price = ethers.parseEther("1");
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, price);

      await expect(
        marketplace.connect(buyer).buyNFT(0, { value: price })
      ).to.emit(marketplace, "NFTSold");

      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should fail to buy with insufficient payment", async function () {
      const { nft, marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const price = ethers.parseEther("1");
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, price);

      await expect(
        marketplace.connect(buyer).buyNFT(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should fail for seller to buy own NFT", async function () {
      const { nft, marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const price = ethers.parseEther("1");
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, price);

      await expect(
        marketplace.connect(seller).buyNFT(0, { value: price })
      ).to.be.revertedWith("Seller cannot buy own NFT");
    });

    it("Should distribute funds correctly", async function () {
      const { nft, marketplace, seller, buyer, feeReceiver } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const price = ethers.parseEther("1");
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, price);

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const feeReceiverBalanceBefore = await ethers.provider.getBalance(feeReceiver.address);

      await marketplace.connect(buyer).buyNFT(0, { value: price });

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const feeReceiverBalanceAfter = await ethers.provider.getBalance(feeReceiver.address);

      // Platform fee is 2.5%
      const platformFee = (price * BigInt(250)) / BigInt(10000);
      const sellerProceeds = price - platformFee;

      expect(feeReceiverBalanceAfter - feeReceiverBalanceBefore).to.equal(platformFee);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerProceeds);
    });
  });

  describe("Listing Management", function () {
    it("Should cancel a listing", async function () {
      const { nft, marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const price = ethers.parseEther("1");
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, price);

      await expect(
        marketplace.connect(seller).cancelListing(0)
      ).to.emit(marketplace, "ListingCancelled");

      const listing = await marketplace.listings(0);
      expect(listing.isActive).to.be.false;
    });

    it("Should update listing price", async function () {
      const { nft, marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const oldPrice = ethers.parseEther("1");
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, oldPrice);

      const newPrice = ethers.parseEther("2");
      await expect(
        marketplace.connect(seller).updateListingPrice(0, newPrice)
      ).to.emit(marketplace, "ListingPriceUpdated");

      const listing = await marketplace.listings(0);
      expect(listing.price).to.equal(newPrice);
    });

    it("Should fail to cancel someone else's listing", async function () {
      const { nft, marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const price = ethers.parseEther("1");
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, price);

      await expect(
        marketplace.connect(buyer).cancelListing(0)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Auctions", function () {
    it("Should create an auction", async function () {
      const { nft, marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const startingPrice = ethers.parseEther("1");
      const duration = 86400; // 1 day

      await expect(
        marketplace.connect(seller).createAuction(
          await nft.getAddress(),
          0,
          startingPrice,
          duration
        )
      ).to.emit(marketplace, "AuctionCreated");

      const auction = await marketplace.auctions(0);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.startingPrice).to.equal(startingPrice);
      expect(auction.isActive).to.be.true;
    });

    it("Should place a bid", async function () {
      const { nft, marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const startingPrice = ethers.parseEther("1");
      const duration = 86400;

      await marketplace.connect(seller).createAuction(
        await nft.getAddress(),
        0,
        startingPrice,
        duration
      );

      const bidAmount = ethers.parseEther("1.5");
      await expect(
        marketplace.connect(buyer).placeBid(0, { value: bidAmount })
      ).to.emit(marketplace, "BidPlaced");

      const auction = await marketplace.auctions(0);
      expect(auction.highestBid).to.equal(bidAmount);
      expect(auction.highestBidder).to.equal(buyer.address);
    });

    it("Should refund previous bidder", async function () {
      const { nft, marketplace, seller, buyer, owner } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const startingPrice = ethers.parseEther("1");
      const duration = 86400;

      await marketplace.connect(seller).createAuction(
        await nft.getAddress(),
        0,
        startingPrice,
        duration
      );

      // First bid
      const firstBid = ethers.parseEther("1.5");
      await marketplace.connect(buyer).placeBid(0, { value: firstBid });

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      // Second bid (should refund first bidder)
      const secondBid = ethers.parseEther("2");
      await marketplace.connect(owner).placeBid(0, { value: secondBid });

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      // Buyer should have been refunded
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(firstBid);
    });

    it("Should end an auction and transfer NFT", async function () {
      const { nft, marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const startingPrice = ethers.parseEther("1");
      const duration = 3600; // 1 hour

      await marketplace.connect(seller).createAuction(
        await nft.getAddress(),
        0,
        startingPrice,
        duration
      );

      const bidAmount = ethers.parseEther("1.5");
      await marketplace.connect(buyer).placeBid(0, { value: bidAmount });

      // Fast forward time
      await time.increase(3601);

      await expect(
        marketplace.endAuction(0)
      ).to.emit(marketplace, "AuctionEnded");

      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should fail to bid after auction ends", async function () {
      const { nft, marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      await nft.connect(seller).approve(await marketplace.getAddress(), 0);
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      await marketplace.connect(seller).createAuction(
        await nft.getAddress(),
        0,
        startingPrice,
        duration
      );

      // Fast forward time
      await time.increase(3601);

      await expect(
        marketplace.connect(buyer).placeBid(0, { value: startingPrice })
      ).to.be.revertedWith("Auction ended");
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      const newFee = 500; // 5%
      await expect(
        marketplace.setPlatformFee(newFee)
      ).to.emit(marketplace, "PlatformFeeUpdated");

      expect(await marketplace.platformFeeBasisPoints()).to.equal(newFee);
    });

    it("Should fail to set fee above 10%", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.setPlatformFee(1100)
      ).to.be.revertedWith("Fee too high (max 10%)");
    });

    it("Should update fee receiver", async function () {
      const { marketplace, owner, buyer } = await loadFixture(deployMarketplaceFixture);

      await marketplace.setFeeReceiver(buyer.address);
      expect(await marketplace.feeReceiver()).to.equal(buyer.address);
    });

    it("Should pause and unpause marketplace", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);

      await marketplace.pause();
      expect(await marketplace.paused()).to.be.true;

      await marketplace.unpause();
      expect(await marketplace.paused()).to.be.false;
    });
  });
});

