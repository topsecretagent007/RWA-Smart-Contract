// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title RWAMarketplace
 * @dev Marketplace for trading Real World Asset NFTs
 * @notice This contract allows listing, buying, and auctioning RWA NFTs
 * @author topsecretagent_007 (https://t.me/topsecretagent_007)
 */
contract RWAMarketplace is ReentrancyGuard, Pausable, Ownable {
    using Counters for Counters.Counter;

    // Platform fee (in basis points, 10000 = 100%)
    uint256 public platformFeeBasisPoints = 250; // 2.5% default fee
    address public feeReceiver;

    // Listing counter
    Counters.Counter private _listingIdCounter;

    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 listedAt;
    }

    struct Auction {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 startingPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool isActive;
        uint256 startedAt;
    }

    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    mapping(address => mapping(uint256 => uint256)) public nftToListing; // nftContract => tokenId => listingId

    // Events
    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );

    event NFTSold(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );

    event ListingCancelled(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId
    );

    event ListingPriceUpdated(
        uint256 indexed listingId,
        uint256 oldPrice,
        uint256 newPrice
    );

    event AuctionCreated(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 startingPrice,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 bidAmount
    );

    event AuctionEnded(
        uint256 indexed listingId,
        address indexed winner,
        uint256 winningBid
    );

    event PlatformFeeUpdated(uint256 newFeeBasisPoints);

    /**
     * @dev Constructor
     * @param _feeReceiver Address to receive platform fees
     */
    constructor(address _feeReceiver) Ownable(msg.sender) {
        require(_feeReceiver != address(0), "Invalid fee receiver");
        feeReceiver = _feeReceiver;
    }

    /**
     * @dev List an NFT for sale
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param price Listing price in wei
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public whenNotPaused nonReentrant returns (uint256) {
        require(price > 0, "Price must be greater than zero");
        require(nftContract != address(0), "Invalid NFT contract");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 listingId = _listingIdCounter.current();
        _listingIdCounter.increment();

        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true,
            listedAt: block.timestamp
        });

        nftToListing[nftContract][tokenId] = listingId;

        emit NFTListed(listingId, nftContract, tokenId, msg.sender, price);

        return listingId;
    }

    /**
     * @dev Buy a listed NFT
     * @param listingId Listing ID
     */
    function buyNFT(uint256 listingId) 
        public 
        payable 
        whenNotPaused 
        nonReentrant 
    {
        Listing storage listing = listings[listingId];
        
        require(listing.isActive, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Seller cannot buy own NFT");

        IERC721 nft = IERC721(listing.nftContract);
        require(
            nft.ownerOf(listing.tokenId) == listing.seller,
            "Seller no longer owns NFT"
        );

        listing.isActive = false;

        // Calculate fees
        uint256 platformFee = (listing.price * platformFeeBasisPoints) / 10000;
        uint256 sellerProceeds = listing.price - platformFee;

        // Transfer NFT
        nft.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);

        // Transfer payments
        (bool feeSent, ) = feeReceiver.call{value: platformFee}("");
        require(feeSent, "Failed to send platform fee");

        (bool sellerPaid, ) = listing.seller.call{value: sellerProceeds}("");
        require(sellerPaid, "Failed to pay seller");

        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refunded, ) = msg.sender.call{value: msg.value - listing.price}("");
            require(refunded, "Failed to refund excess");
        }

        emit NFTSold(
            listingId,
            listing.nftContract,
            listing.tokenId,
            listing.seller,
            msg.sender,
            listing.price
        );
    }

    /**
     * @dev Cancel a listing
     * @param listingId Listing ID
     */
    function cancelListing(uint256 listingId) public nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.isActive, "Listing not active");
        require(
            msg.sender == listing.seller || msg.sender == owner(),
            "Not authorized"
        );

        listing.isActive = false;

        emit ListingCancelled(
            listingId,
            listing.nftContract,
            listing.tokenId
        );
    }

    /**
     * @dev Update listing price
     * @param listingId Listing ID
     * @param newPrice New price in wei
     */
    function updateListingPrice(uint256 listingId, uint256 newPrice) 
        public 
        nonReentrant 
    {
        Listing storage listing = listings[listingId];
        
        require(listing.isActive, "Listing not active");
        require(msg.sender == listing.seller, "Not the seller");
        require(newPrice > 0, "Price must be greater than zero");

        uint256 oldPrice = listing.price;
        listing.price = newPrice;

        emit ListingPriceUpdated(listingId, oldPrice, newPrice);
    }

    /**
     * @dev Create an auction
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to auction
     * @param startingPrice Starting bid price
     * @param duration Auction duration in seconds
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) public whenNotPaused nonReentrant returns (uint256) {
        require(startingPrice > 0, "Starting price must be greater than zero");
        require(duration >= 3600, "Minimum duration is 1 hour");
        require(duration <= 30 days, "Maximum duration is 30 days");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 listingId = _listingIdCounter.current();
        _listingIdCounter.increment();

        auctions[listingId] = Auction({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            startingPrice: startingPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            isActive: true,
            startedAt: block.timestamp
        });

        emit AuctionCreated(
            listingId,
            nftContract,
            tokenId,
            msg.sender,
            startingPrice,
            block.timestamp + duration
        );

        return listingId;
    }

    /**
     * @dev Place a bid on an auction
     * @param listingId Auction listing ID
     */
    function placeBid(uint256 listingId) 
        public 
        payable 
        whenNotPaused 
        nonReentrant 
    {
        Auction storage auction = auctions[listingId];
        
        require(auction.isActive, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");
        
        uint256 minBid = auction.highestBid > 0 
            ? auction.highestBid + (auction.highestBid * 5 / 100) // 5% increment
            : auction.startingPrice;
        
        require(msg.value >= minBid, "Bid too low");

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            (bool refunded, ) = auction.highestBidder.call{value: auction.highestBid}("");
            require(refunded, "Failed to refund previous bidder");
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(listingId, msg.sender, msg.value);
    }

    /**
     * @dev End an auction
     * @param listingId Auction listing ID
     */
    function endAuction(uint256 listingId) public nonReentrant {
        Auction storage auction = auctions[listingId];
        
        require(auction.isActive, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended yet");

        auction.isActive = false;

        if (auction.highestBidder != address(0)) {
            IERC721 nft = IERC721(auction.nftContract);

            // Calculate fees
            uint256 platformFee = (auction.highestBid * platformFeeBasisPoints) / 10000;
            uint256 sellerProceeds = auction.highestBid - platformFee;

            // Transfer NFT
            nft.safeTransferFrom(
                auction.seller,
                auction.highestBidder,
                auction.tokenId
            );

            // Transfer payments
            (bool feeSent, ) = feeReceiver.call{value: platformFee}("");
            require(feeSent, "Failed to send platform fee");

            (bool sellerPaid, ) = auction.seller.call{value: sellerProceeds}("");
            require(sellerPaid, "Failed to pay seller");

            emit AuctionEnded(listingId, auction.highestBidder, auction.highestBid);
        } else {
            emit AuctionEnded(listingId, address(0), 0);
        }
    }

    /**
     * @dev Get active listings count
     */
    function getActiveListingsCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _listingIdCounter.current(); i++) {
            if (listings[i].isActive) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Set platform fee
     * @param newFeeBasisPoints New fee in basis points
     */
    function setPlatformFee(uint256 newFeeBasisPoints) public onlyOwner {
        require(newFeeBasisPoints <= 1000, "Fee too high (max 10%)");
        platformFeeBasisPoints = newFeeBasisPoints;
        emit PlatformFeeUpdated(newFeeBasisPoints);
    }

    /**
     * @dev Set fee receiver
     * @param newFeeReceiver New fee receiver address
     */
    function setFeeReceiver(address newFeeReceiver) public onlyOwner {
        require(newFeeReceiver != address(0), "Invalid address");
        feeReceiver = newFeeReceiver;
    }

    /**
     * @dev Pause marketplace
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause marketplace
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw (only for stuck funds)
     */
    function emergencyWithdraw() public onlyOwner {
        (bool sent, ) = owner().call{value: address(this).balance}("");
        require(sent, "Failed to withdraw");
    }

    receive() external payable {}
}

