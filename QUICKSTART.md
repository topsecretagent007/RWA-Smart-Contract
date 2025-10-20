# ⚡ Quick Start Guide

Get up and running with RWA NFT Smart Contracts in 5 minutes!

## 1️⃣ Installation (1 minute)

```bash
# Clone the repository
git clone https://github.com/yourusername/RWA-Smart-Contract.git
cd RWA-Smart-Contract

# Install dependencies
npm install
```

## 2️⃣ Configuration (1 minute)

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your details (use any text editor)
# For testing locally, you can leave most values as-is
```

## 3️⃣ Compile Contracts (30 seconds)

```bash
npm run compile
```

Expected output:
```
✓ Compiled 15 Solidity files successfully
```

## 4️⃣ Run Tests (1 minute)

```bash
npm run test
```

Expected output:
```
✓ RWANFT Contract (15 tests passed)
✓ RWAMarketplace Contract (12 tests passed)
```

## 5️⃣ Deploy Locally (1 minute)

**Terminal 1:**
```bash
# Start local blockchain
npm run node
```

**Terminal 2:**
```bash
# Deploy contracts
npm run deploy
```

## 🎉 Success!

You now have:
- ✅ Local blockchain running
- ✅ RWANFT contract deployed
- ✅ RWAMarketplace contract deployed

## 🚀 Next Steps

### Try the Example Script

```bash
# Update contract addresses in scripts/interact.js
# Then run:
node scripts/interact.js
```

### Mint Your First RWA NFT

```javascript
const { ethers } = require("hardhat");

async function main() {
    const rwaNFT = await ethers.getContractAt("RWANFT", "YOUR_CONTRACT_ADDRESS");
    
    const tx = await rwaNFT.mintAsset(
        "YOUR_ADDRESS",
        "ipfs://QmYourMetadata",
        "Real Estate",
        "New York, NY",
        50000000, // $500,000
        "ipfs://QmYourDocs"
    );
    
    await tx.wait();
    console.log("NFT Minted!");
}

main();
```

### List on Marketplace

```javascript
const marketplace = await ethers.getContractAt("RWAMarketplace", "MARKETPLACE_ADDRESS");

// Approve
await rwaNFT.approve(marketplaceAddress, tokenId);

// List
await marketplace.listNFT(
    rwaNFTAddress,
    tokenId,
    ethers.parseEther("10") // 10 ETH
);
```

## 📚 Learn More

- [Full Documentation](README.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security Info](docs/SECURITY.md)

## ❓ Troubleshooting

### "Module not found"
```bash
rm -rf node_modules
npm install
```

### "Compilation failed"
```bash
npm run clean
npm run compile
```

### "Tests failing"
Make sure you're using Node.js v16+:
```bash
node --version  # Should be v16 or higher
```

## 💡 Pro Tips

1. **Use Sepolia testnet for real testing**
   ```bash
   # Get free testnet ETH from faucet
   # Then deploy:
   npm run deploy:testnet
   ```

2. **Enable gas reporting**
   ```bash
   REPORT_GAS=true npm test
   ```

3. **Watch mode for development**
   ```bash
   npx hardhat watch compile
   ```

## 🆘 Need Help?

- 📖 [GitHub Issues](https://github.com/yourusername/RWA-Smart-Contract/issues)
- 💬 [Telegram](https://t.me/topsecretagent_007)
- 📧 Email support

---

**Happy Building! 🚀**

