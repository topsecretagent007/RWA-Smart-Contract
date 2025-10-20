# 🚀 Complete Setup Instructions

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Local Deployment](#local-deployment)
6. [Testnet Deployment](#testnet-deployment)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

### Required Software
- ✅ **Node.js** v16 or higher ([Download](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ **Git** ([Download](https://git-scm.com/))

### Optional but Recommended
- 📱 **MetaMask** wallet extension
- 💻 **VS Code** with Solidity extension
- 🔧 **Hardhat VS Code extension**

### Check Your Installation
```bash
node --version   # Should show v16+ 
npm --version    # Should show 8+
git --version    # Any recent version
```

---

## Initial Setup

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd "d:\My Projects\smart contract\RWA-Smart-Contract"

# Install all dependencies
npm install
```

**Expected Output:**
```
added 500+ packages in 30s
```

**If you see errors:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and retry: `rm -rf node_modules && npm install`

### Step 2: Verify Installation

```bash
# Check Hardhat is installed
npx hardhat --version

# Should show: Hardhat version 2.19.5
```

---

## Configuration

### Step 1: Create Environment File

```bash
# Copy the example file
copy .env.example .env

# Or on Mac/Linux:
cp .env.example .env
```

### Step 2: Edit .env File

Open `.env` in your text editor and fill in the values:

#### For Local Development (Minimal)
```env
# Leave default values - no changes needed for local testing!
REPORT_GAS=false
```

#### For Testnet Deployment (Required)
```env
# Get Sepolia RPC URL (free from Alchemy/Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Your wallet private key (NEVER SHARE!)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Get from etherscan.io (free account)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

#### Getting API Keys:

**Alchemy (Recommended):**
1. Sign up at [alchemy.com](https://www.alchemy.com/)
2. Create new app
3. Select "Ethereum" → "Sepolia"
4. Copy the HTTPS URL

**Etherscan:**
1. Sign up at [etherscan.io](https://etherscan.io/)
2. Go to API Keys
3. Create new API key
4. Copy the key

**Private Key from MetaMask:**
1. Open MetaMask
2. Click account details
3. Export Private Key
4. ⚠️ **NEVER SHARE THIS!**

---

## Testing

### Step 1: Compile Contracts

```bash
npm run compile
```

**Expected Output:**
```
Compiled 15 Solidity files successfully
✨ Done in 5s
```

### Step 2: Run Tests

```bash
npm run test
```

**Expected Output:**
```
  RWANFT Contract
    Deployment
      ✓ Should set the right owner
      ✓ Should have correct name and symbol
      ✓ Should start with zero total supply
    Minting
      ✓ Should mint a new RWA NFT
      ✓ Should store correct metadata
      ... (more tests)

  RWAMarketplace Contract
    Deployment
      ✓ Should set the correct fee receiver
      ... (more tests)

  27 passing (5s)
```

### Step 3: Check Gas Usage (Optional)

```bash
# Set environment variable and run tests
$env:REPORT_GAS="true"  # Windows PowerShell
npm run test

# Or on Mac/Linux:
REPORT_GAS=true npm run test
```

---

## Local Deployment

Perfect for development and testing!

### Step 1: Start Local Blockchain

**Terminal 1:**
```bash
npm run node
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts:
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...
```

💡 **Keep this terminal running!**

### Step 2: Deploy Contracts

**Terminal 2 (New Terminal):**
```bash
npm run deploy
```

**Expected Output:**
```
🚀 Starting RWA NFT Smart Contract Deployment...

📍 Deploying contracts with account: 0xf39F...
💰 Account balance: 10000.0 ETH

📄 Deploying RWANFT Contract...
✅ RWANFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📄 Deploying RWAMarketplace Contract...
✅ RWAMarketplace deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

🎉 DEPLOYMENT SUCCESSFUL!
```

### Step 3: Save Contract Addresses

Copy the addresses and save them:

```env
# Add to your .env file
RWA_NFT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
MARKETPLACE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### Step 4: Test Interaction

```bash
# Update addresses in scripts/interact.js
# Then run:
node scripts/interact.js
```

---

## Testnet Deployment

### Step 1: Get Testnet ETH

1. **Visit Sepolia Faucet:**
   - [sepoliafaucet.com](https://sepoliafaucet.com/)
   - [faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)

2. **Enter your wallet address**

3. **Wait for confirmation** (usually 1-2 minutes)

4. **Verify you received ETH:**
   - Check on [sepolia.etherscan.io](https://sepolia.etherscan.io/)

### Step 2: Deploy to Sepolia

```bash
npm run deploy:testnet
```

**Expected Output:**
```
🚀 Starting RWA NFT Smart Contract Deployment...

📍 Deploying contracts with account: 0xYourAddress...
💰 Account balance: 0.5 ETH

📄 Deploying RWANFT Contract...
⏳ Waiting for confirmations...
✅ RWANFT deployed to: 0xABC...

📄 Deploying RWAMarketplace Contract...
✅ RWAMarketplace deployed to: 0xDEF...

🔍 Verifying contracts on Etherscan...
✅ RWANFT verified on Etherscan
✅ RWAMarketplace verified on Etherscan

🎉 DEPLOYMENT SUCCESSFUL!
```

### Step 3: Verify on Etherscan

1. Visit [sepolia.etherscan.io](https://sepolia.etherscan.io/)
2. Enter your contract address
3. You should see:
   - ✅ Green checkmark (verified)
   - Contract code visible
   - "Read Contract" and "Write Contract" tabs

---

## Verification

### Manual Verification (if auto-verify fails)

```bash
# Verify RWANFT
npx hardhat verify --network sepolia <RWANFT_ADDRESS> "Real World Asset NFT" "RWA"

# Verify Marketplace
npx hardhat verify --network sepolia <MARKETPLACE_ADDRESS> <YOUR_ADDRESS>
```

### Verify Deployment Success

Create a test file `test-deployment.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
    const rwaNFT = await ethers.getContractAt(
        "RWANFT", 
        "YOUR_RWANFT_ADDRESS"
    );
    
    const name = await rwaNFT.name();
    const symbol = await rwaNFT.symbol();
    const totalSupply = await rwaNFT.totalSupply();
    
    console.log("✅ Contract is live!");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Total Supply:", totalSupply.toString());
}

main();
```

Run it:
```bash
node test-deployment.js
```

---

## Troubleshooting

### Problem: "Cannot find module"

**Solution:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Problem: "Insufficient funds"

**Solution:**
- Check your wallet has enough ETH
- For testnet, get more from faucet
- For mainnet, add more ETH

### Problem: "Nonce too high"

**Solution:**
- Reset your MetaMask account:
  - Settings → Advanced → Clear activity tab data

### Problem: "Transaction underpriced"

**Solution:**
Edit `hardhat.config.js`:
```javascript
networks: {
  sepolia: {
    gasPrice: 2000000000, // 2 gwei
    // ... other settings
  }
}
```

### Problem: Compilation errors

**Solution:**
```bash
npm run clean
npm run compile
```

### Problem: Tests failing

**Solution:**
```bash
# Make sure you're using correct Node version
node --version  # Must be 16+

# Clear Hardhat cache
npx hardhat clean

# Reinstall and retry
npm install
npm run test
```

### Problem: Verification failed

**Solution:**
1. Wait 30 seconds after deployment
2. Check Etherscan API key is correct
3. Try manual verification (see above)
4. Check constructor arguments match exactly

---

## Next Steps After Setup

### 1. Grant Roles
```javascript
const MINTER_ROLE = await rwaNFT.MINTER_ROLE();
await rwaNFT.grantRole(MINTER_ROLE, minterAddress);
```

### 2. Mint Your First NFT
```javascript
await rwaNFT.mintAsset(
    ownerAddress,
    "ipfs://QmYourMetadata",
    "Real Estate",
    "New York, NY",
    50000000,
    "ipfs://QmDocs"
);
```

### 3. List on Marketplace
```javascript
await rwaNFT.approve(marketplaceAddress, tokenId);
await marketplace.listNFT(rwaNFTAddress, tokenId, ethers.parseEther("10"));
```

### 4. Build Your Frontend
- Use ethers.js to interact
- Connect with MetaMask
- Display NFTs with metadata

---

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/)
- [Ethereum Development](https://ethereum.org/developers)

---

## 🆘 Still Need Help?

1. Check [GitHub Issues](https://github.com/yourusername/RWA-Smart-Contract/issues)
2. Read the [README.md](README.md)
3. Contact: [@topsecretagent_007](https://t.me/topsecretagent_007)

---

**Happy Coding! 🚀**

