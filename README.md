# 🏢 Real World Asset (RWA) NFT Smart Contract

> **Tokenizing Real-World Assets on the Blockchain**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow.svg)](https://hardhat.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## 📜 Overview

The **RWA NFT Smart Contract** is a comprehensive Solidity-based solution for tokenizing real-world assets as NFTs on Ethereum and EVM-compatible blockchains. This project enables the representation of physical assets like real estate, art, vehicles, and more as digital tokens with full on-chain verification and marketplace functionality.

### 🌟 Key Features

- **🎨 ERC-721 Standard**: Full compliance with ERC-721 NFT standard
- **✅ Asset Verification**: Built-in verification system for real-world assets
- **📊 Metadata Management**: Comprehensive metadata storage including valuation, location, and legal documents
- **🔐 Access Control**: Role-based permissions (Minter, Verifier, Admin)
- **💰 Royalty Support**: EIP-2981 compliant royalty system
- **🏪 Marketplace**: Integrated marketplace for listing, buying, and auctioning NFTs
- **⏱️ Auction System**: Time-based auctions with automatic bid refunds
- **🛡️ Security**: ReentrancyGuard, Pausable, and battle-tested OpenZeppelin contracts
- **📦 Batch Operations**: Efficient batch minting capabilities

## 🏗️ Architecture

### Core Contracts

1. **RWANFT.sol** - Main NFT contract
   - ERC-721 implementation for tokenizing real-world assets
   - Role-based access control (Minter, Verifier, Pauser)
   - Asset metadata and verification tracking
   - Royalty system
   - Pausable for emergency stops

2. **RWAMarketplace.sol** - Marketplace contract
   - NFT listing and buying
   - Auction creation and bidding
   - Platform fee management
   - Secure payment handling

## 📋 Smart Contract Details

### RWANFT Contract

#### Asset Metadata Structure
```solidity
struct AssetMetadata {
    string assetType;           // e.g., "Real Estate", "Art", "Vehicle"
    string location;            // Physical location
    uint256 valuationUSD;       // Valuation in USD cents
    uint256 mintTimestamp;      // Minting time
    uint256 lastVerifiedDate;   // Last verification timestamp
    bool isVerified;            // Verification status
    string documentHash;        // IPFS hash of legal documents
}
```

#### Key Functions

**Minting**
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

**Verification**
```solidity
function verifyAsset(uint256 tokenId) public onlyRole(VERIFIER_ROLE)
```

**Batch Minting**
```solidity
function batchMintAssets(...) public onlyRole(MINTER_ROLE) returns (uint256[] memory)
```

### RWAMarketplace Contract

#### Listing Structure
```solidity
struct Listing {
    uint256 listingId;
    address nftContract;
    uint256 tokenId;
    address seller;
    uint256 price;
    bool isActive;
    uint256 listedAt;
}
```

#### Key Functions

**List NFT**
```solidity
function listNFT(
    address nftContract,
    uint256 tokenId,
    uint256 price
) public returns (uint256)
```

**Buy NFT**
```solidity
function buyNFT(uint256 listingId) public payable
```

**Create Auction**
```solidity
function createAuction(
    address nftContract,
    uint256 tokenId,
    uint256 startingPrice,
    uint256 duration
) public returns (uint256)
```

## 🚀 Getting Started

### Prerequisites

- Node.js v16+ and npm/yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/topsecretagent007/RWA-Smart-Contract.git
cd RWA-Smart-Contract
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your values
```

### Configuration

Edit `.env` file with your settings:

```env
# Network RPC URLs
SEPOLIA_RPC_URL=https://rpc.sepolia.org
MAINNET_RPC_URL=https://eth.llamarpc.com

# Private Key (Never share!)
PRIVATE_KEY=

# API Keys
ETHERSCAN_API_KEY=
```

## 🔨 Usage

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy Contracts

**Local Network:**
```bash
# Start local node
npm run node

# In another terminal, deploy
npm run deploy
```

**Testnet (Sepolia):**
```bash
npm run deploy:testnet
```

### Interact with Contracts

Use the interaction script:
```bash
node scripts/interact.js
```

## 📝 Example Usage

### Minting an RWA NFT

```javascript
const RWANFT = await ethers.getContractFactory("RWANFT");
const rwaNFT = await RWANFT.attach(RWA_NFT_ADDRESS);

await rwaNFT.mintAsset(
    ownerAddress,
    "ipfs://QmYourMetadataHash",
    "Real Estate",
    "123 Main St, New York, NY",
    50000000, // $500,000.00 in cents
    "ipfs://QmYourDocumentHash"
);
```

### Listing on Marketplace

```javascript
const marketplace = await ethers.getContractAt("RWAMarketplace", MARKETPLACE_ADDRESS);

// Approve marketplace
await rwaNFT.approve(MARKETPLACE_ADDRESS, tokenId);

// List NFT
const listingId = await marketplace.listNFT(
    RWA_NFT_ADDRESS,
    tokenId,
    ethers.parseEther("10") // 10 ETH
);
```

### Buying an NFT

```javascript
await marketplace.buyNFT(listingId, {
    value: ethers.parseEther("10")
});
```

## 🧪 Testing

The project includes comprehensive test suites:

- **RWANFT.test.js** - Tests for NFT contract
  - Deployment
  - Minting (single and batch)
  - Verification
  - Royalty system
  - Token management
  - Pause functionality

- **RWAMarketplace.test.js** - Tests for marketplace
  - NFT listing and buying
  - Auction creation and bidding
  - Payment distribution
  - Admin functions

Run tests with coverage:
```bash
npm run test
npx hardhat coverage
```

## 📊 Gas Usage

Approximate gas costs (can vary based on network conditions):

| Function | Gas Cost |
|----------|----------|
| Mint Asset | ~250,000 |
| Batch Mint (3 assets) | ~650,000 |
| Verify Asset | ~50,000 |
| List NFT | ~120,000 |
| Buy NFT | ~180,000 |
| Create Auction | ~140,000 |
| Place Bid | ~100,000 |

## 🔒 Security Features

- ✅ **ReentrancyGuard**: Protection against reentrancy attacks
- ✅ **Access Control**: Role-based permissions
- ✅ **Pausable**: Emergency stop mechanism
- ✅ **SafeERC721**: Safe transfer mechanisms
- ✅ **OpenZeppelin**: Battle-tested contract libraries
- ✅ **Input Validation**: Comprehensive checks on all inputs

## 🌐 Supported Networks

- Ethereum Mainnet
- Ethereum Sepolia (Testnet)
- Polygon
- Binance Smart Chain
- Any EVM-compatible chain

## 📖 Documentation

### Roles

- **DEFAULT_ADMIN_ROLE**: Full contract control
- **MINTER_ROLE**: Can mint new RWA NFTs
- **VERIFIER_ROLE**: Can verify assets and update metadata
- **PAUSER_ROLE**: Can pause/unpause contract

### Events

**RWANFT Events:**
- `AssetMinted(uint256 tokenId, address owner, string assetType, uint256 valuationUSD)`
- `AssetVerified(uint256 tokenId, address verifier, uint256 timestamp)`
- `AssetMetadataUpdated(uint256 tokenId, uint256 newValuation, string documentHash)`
- `RoyaltyUpdated(address newReceiver, uint96 newBasisPoints)`

**Marketplace Events:**
- `NFTListed(uint256 listingId, address nftContract, uint256 tokenId, address seller, uint256 price)`
- `NFTSold(...)`
- `AuctionCreated(...)`
- `BidPlaced(...)`
- `AuctionEnded(...)`

## 🛠️ Development

### Project Structure

```
RWA-Smart-Contract/
├── contracts/              # Smart contracts
│   ├── RWANFT.sol
│   └── RWAMarketplace.sol
├── scripts/               # Deployment scripts
│   ├── deploy.js
│   └── interact.js
├── test/                  # Test files
│   ├── RWANFT.test.js
│   └── RWAMarketplace.test.js
├── hardhat.config.js      # Hardhat configuration
├── package.json
└── README.md
```

### Adding New Features

1. Write tests first (TDD approach)
2. Implement the feature
3. Run tests: `npm test`
4. Check gas usage: `REPORT_GAS=true npm test`
5. Deploy to testnet
6. Verify and test on testnet

### Contribution Guidelines

- Write comprehensive tests
- Follow Solidity style guide
- Add documentation for new features
- Ensure all tests pass
- Update README if needed

## 🐛 Known Issues & Limitations

- Maximum batch mint size is limited to 50 to prevent gas issues
- Auction minimum duration is 1 hour
- Platform fees capped at 10%

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure contract libraries
- [Hardhat](https://hardhat.org/) for development environment
- The Ethereum community

## 📞 Contact

**Developer:** topsecretagent_007

- 📱 Telegram: [@topsecretagent_007](https://t.me/topsecretagent_007)
- 🐙 GitHub: [topsecretagent007](https://github.com/topsecretagent007)
