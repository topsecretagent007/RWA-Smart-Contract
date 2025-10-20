# 📚 API Documentation

Complete API reference for RWA NFT Smart Contracts.

## RWANFT Contract

### Constructor

```solidity
constructor(string memory _name, string memory _symbol)
```

Creates a new RWA NFT contract.

**Parameters:**
- `_name`: Token name (e.g., "Real World Asset NFT")
- `_symbol`: Token symbol (e.g., "RWA")

---

### Minting Functions

#### mintAsset

```solidity
function mintAsset(
    address to,
    string memory uri,
    string memory assetType,
    string memory location,
    uint256 valuationUSD,
    string memory documentHash
) public onlyRole(MINTER_ROLE) returns (uint256)
```

Mints a new RWA NFT.

**Parameters:**
- `to`: Recipient address
- `uri`: Token URI (IPFS link to metadata)
- `assetType`: Type of asset (e.g., "Real Estate", "Art")
- `location`: Physical location
- `valuationUSD`: Valuation in USD cents
- `documentHash`: IPFS hash of legal documents

**Returns:** Token ID of minted NFT

**Events:** `AssetMinted(uint256 tokenId, address owner, string assetType, uint256 valuationUSD)`

**Example:**
```javascript
const tx = await rwaNFT.mintAsset(
    "0x123...",
    "ipfs://Qm...",
    "Real Estate",
    "New York, NY",
    50000000,
    "ipfs://QmDocs..."
);
```

---

#### batchMintAssets

```solidity
function batchMintAssets(
    address to,
    string[] memory uris,
    string[] memory assetTypes,
    string[] memory locations,
    uint256[] memory valuations,
    string[] memory documentHashes
) public onlyRole(MINTER_ROLE) returns (uint256[] memory)
```

Mints multiple RWA NFTs in one transaction.

**Parameters:**
- All arrays must have the same length (max 50)
- Parameters same as `mintAsset` but as arrays

**Returns:** Array of token IDs

**Example:**
```javascript
const tokenIds = await rwaNFT.batchMintAssets(
    ownerAddress,
    ["ipfs://1", "ipfs://2", "ipfs://3"],
    ["Real Estate", "Art", "Vehicle"],
    ["NYC", "LA", "Chicago"],
    [100000, 50000, 25000],
    ["ipfs://doc1", "ipfs://doc2", "ipfs://doc3"]
);
```

---

### Verification Functions

#### verifyAsset

```solidity
function verifyAsset(uint256 tokenId) public onlyRole(VERIFIER_ROLE)
```

Verifies an asset as authentic.

**Parameters:**
- `tokenId`: Token ID to verify

**Events:** `AssetVerified(uint256 tokenId, address verifier, uint256 timestamp)`

---

#### updateAssetMetadata

```solidity
function updateAssetMetadata(
    uint256 tokenId,
    uint256 newValuation,
    string memory newDocumentHash
) public onlyRole(VERIFIER_ROLE)
```

Updates asset metadata (valuation and documents).

**Parameters:**
- `tokenId`: Token ID
- `newValuation`: New valuation in USD cents
- `newDocumentHash`: New IPFS document hash

**Events:** `AssetMetadataUpdated(uint256 tokenId, uint256 newValuation, string documentHash)`

---

### Query Functions

#### getAssetMetadata

```solidity
function getAssetMetadata(uint256 tokenId) 
    public 
    view 
    returns (AssetMetadata memory)
```

Returns complete metadata for an asset.

**Returns:**
```solidity
struct AssetMetadata {
    string assetType;
    string location;
    uint256 valuationUSD;
    uint256 mintTimestamp;
    uint256 lastVerifiedDate;
    bool isVerified;
    string documentHash;
}
```

---

#### tokensOfOwner

```solidity
function tokensOfOwner(address owner) 
    public 
    view 
    returns (uint256[] memory)
```

Returns all token IDs owned by an address.

**Example:**
```javascript
const tokens = await rwaNFT.tokensOfOwner("0x123...");
console.log("Owned tokens:", tokens);
```

---

#### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

Returns total number of minted tokens.

---

### Royalty Functions

#### setRoyaltyInfo

```solidity
function setRoyaltyInfo(address receiver, uint96 basisPoints) 
    public 
    onlyRole(DEFAULT_ADMIN_ROLE)
```

Sets royalty information.

**Parameters:**
- `receiver`: Address to receive royalties
- `basisPoints`: Percentage in basis points (250 = 2.5%, max 1000 = 10%)

---

#### royaltyInfo

```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice)
    public
    view
    returns (address, uint256)
```

EIP-2981 compliant royalty information.

**Returns:** (receiver address, royalty amount)

---

### Admin Functions

#### pause / unpause

```solidity
function pause() public onlyRole(PAUSER_ROLE)
function unpause() public onlyRole(PAUSER_ROLE)
```

Pauses/unpauses all token transfers and minting.

---

## RWAMarketplace Contract

### Constructor

```solidity
constructor(address _feeReceiver)
```

Creates marketplace contract.

**Parameters:**
- `_feeReceiver`: Address to receive platform fees

---

### Listing Functions

#### listNFT

```solidity
function listNFT(
    address nftContract,
    uint256 tokenId,
    uint256 price
) public returns (uint256)
```

Lists an NFT for sale.

**Requirements:**
- Caller must own the NFT
- Marketplace must be approved

**Returns:** Listing ID

**Events:** `NFTListed(...)`

**Example:**
```javascript
// First approve
await nft.approve(marketplaceAddress, tokenId);

// Then list
const listingId = await marketplace.listNFT(
    nftAddress,
    tokenId,
    ethers.parseEther("10")
);
```

---

#### buyNFT

```solidity
function buyNFT(uint256 listingId) public payable
```

Purchases a listed NFT.

**Parameters:**
- `listingId`: ID of the listing

**Requirements:**
- Send exact or more ETH than listing price
- Cannot buy your own NFT

**Events:** `NFTSold(...)`

**Example:**
```javascript
await marketplace.buyNFT(listingId, {
    value: ethers.parseEther("10")
});
```

---

#### cancelListing

```solidity
function cancelListing(uint256 listingId) public
```

Cancels a listing.

**Requirements:**
- Must be the seller or contract owner

---

#### updateListingPrice

```solidity
function updateListingPrice(uint256 listingId, uint256 newPrice) public
```

Updates the price of an active listing.

**Requirements:**
- Must be the seller
- Listing must be active

---

### Auction Functions

#### createAuction

```solidity
function createAuction(
    address nftContract,
    uint256 tokenId,
    uint256 startingPrice,
    uint256 duration
) public returns (uint256)
```

Creates a timed auction.

**Parameters:**
- `nftContract`: NFT contract address
- `tokenId`: Token ID
- `startingPrice`: Minimum bid
- `duration`: Auction duration in seconds (min: 1 hour, max: 30 days)

**Returns:** Listing ID

**Events:** `AuctionCreated(...)`

---

#### placeBid

```solidity
function placeBid(uint256 listingId) public payable
```

Places a bid on an auction.

**Requirements:**
- Auction must be active
- Bid must be at least 5% higher than current highest bid
- Previous bidder is automatically refunded

**Events:** `BidPlaced(...)`

**Example:**
```javascript
await marketplace.placeBid(listingId, {
    value: ethers.parseEther("15")
});
```

---

#### endAuction

```solidity
function endAuction(uint256 listingId) public
```

Ends an auction and transfers NFT to winner.

**Requirements:**
- Auction time must have elapsed

**Events:** `AuctionEnded(...)`

---

### Admin Functions

#### setPlatformFee

```solidity
function setPlatformFee(uint256 newFeeBasisPoints) public onlyOwner
```

Sets platform fee percentage.

**Parameters:**
- `newFeeBasisPoints`: Fee in basis points (250 = 2.5%, max 1000 = 10%)

---

#### setFeeReceiver

```solidity
function setFeeReceiver(address newFeeReceiver) public onlyOwner
```

Updates the address that receives platform fees.

---

### Query Functions

#### getActiveListingsCount

```solidity
function getActiveListingsCount() public view returns (uint256)
```

Returns number of active listings.

---

## Events Reference

### RWANFT Events

```solidity
event AssetMinted(
    uint256 indexed tokenId,
    address indexed owner,
    string assetType,
    uint256 valuationUSD
);

event AssetVerified(
    uint256 indexed tokenId,
    address indexed verifier,
    uint256 timestamp
);

event AssetMetadataUpdated(
    uint256 indexed tokenId,
    uint256 newValuation,
    string documentHash
);

event RoyaltyUpdated(
    address indexed newReceiver,
    uint96 newBasisPoints
);
```

### Marketplace Events

```solidity
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
```

## Error Messages

### RWANFT Errors
- `"Cannot mint to zero address"`
- `"URI cannot be empty"`
- `"Valuation must be greater than zero"`
- `"Token does not exist"`
- `"Royalty too high (max 10%)"`
- `"Invalid receiver address"`

### Marketplace Errors
- `"Price must be greater than zero"`
- `"Invalid NFT contract"`
- `"Not the owner"`
- `"Marketplace not approved"`
- `"Listing not active"`
- `"Insufficient payment"`
- `"Seller cannot buy own NFT"`
- `"Not authorized"`
- `"Auction ended"`
- `"Bid too low"`
- `"Fee too high (max 10%)"`

## Gas Estimates

| Function | Estimated Gas |
|----------|--------------|
| `mintAsset` | ~250,000 |
| `batchMintAssets(3)` | ~650,000 |
| `verifyAsset` | ~50,000 |
| `listNFT` | ~120,000 |
| `buyNFT` | ~180,000 |
| `createAuction` | ~140,000 |
| `placeBid` | ~100,000 |
| `endAuction` | ~160,000 |

*Gas estimates are approximate and may vary based on network conditions*

---

For more examples, see the test files in `/test` directory.

