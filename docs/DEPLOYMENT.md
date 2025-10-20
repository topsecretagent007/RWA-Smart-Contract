# 🚀 Deployment Guide

This guide will walk you through deploying the RWA NFT Smart Contracts to various networks.

## Prerequisites

Before deploying, ensure you have:

1. ✅ Node.js v16+ installed
2. ✅ Dependencies installed (`npm install`)
3. ✅ `.env` file configured with necessary values
4. ✅ ETH/tokens for gas fees on target network
5. ✅ Contracts compiled (`npm run compile`)

## Configuration

### 1. Set up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
```env
# Network RPC URL
SEPOLIA_RPC_URL=https://rpc.sepolia.org
MAINNET_RPC_URL=https://eth.llamarpc.com

# Private Key (KEEP SECRET!)
PRIVATE_KEY=0x...

# Etherscan API Key (for verification)
ETHERSCAN_API_KEY=...
```

### 2. Verify Configuration

Check your Hardhat configuration in `hardhat.config.js` to ensure the network you want to deploy to is properly configured.

## Deployment Steps

### Local Development Network

1. **Start a local Hardhat node:**
```bash
npm run node
```

2. **Deploy contracts (in another terminal):**
```bash
npm run deploy
```

This will deploy to the local network running on `http://localhost:8545`.

### Sepolia Testnet

1. **Get Sepolia ETH:**
   - Visit a Sepolia faucet (e.g., https://sepoliafaucet.com/)
   - Enter your wallet address
   - Wait for testnet ETH

2. **Deploy to Sepolia:**
```bash
npm run deploy:testnet
```

3. **Save Contract Addresses:**
   - Copy the deployed addresses from the console
   - Add them to your `.env` file:
```env
RWA_NFT_ADDRESS=0x...
MARKETPLACE_ADDRESS=0x...
```

### Ethereum Mainnet

⚠️ **WARNING**: Deploying to mainnet costs real ETH. Double-check everything!

1. **Ensure you have enough ETH:**
   - Check gas prices: https://etherscan.io/gastracker
   - Estimate cost: ~0.05-0.1 ETH for both contracts

2. **Final checks:**
   - ✅ All tests passing
   - ✅ Security audit completed (recommended)
   - ✅ Code reviewed
   - ✅ Deployment script tested on testnet

3. **Deploy:**
```bash
hardhat run scripts/deploy.js --network mainnet
```

## Post-Deployment Steps

### 1. Verify Contracts on Etherscan

The deploy script will attempt automatic verification. If it fails:

```bash
# Verify RWANFT
npx hardhat verify --network sepolia <RWANFT_ADDRESS> "Real World Asset NFT" "RWA"

# Verify Marketplace
npx hardhat verify --network sepolia <MARKETPLACE_ADDRESS> <FEE_RECEIVER_ADDRESS>
```

### 2. Grant Roles

After deployment, grant necessary roles:

```javascript
// Grant MINTER_ROLE
const MINTER_ROLE = await rwaNFT.MINTER_ROLE();
await rwaNFT.grantRole(MINTER_ROLE, minterAddress);

// Grant VERIFIER_ROLE
const VERIFIER_ROLE = await rwaNFT.VERIFIER_ROLE();
await rwaNFT.grantRole(VERIFIER_ROLE, verifierAddress);
```

### 3. Configure Marketplace

```javascript
// Set platform fee (if different from default 2.5%)
await marketplace.setPlatformFee(250); // 2.5% in basis points

// Update fee receiver if needed
await marketplace.setFeeReceiver(newFeeReceiverAddress);
```

### 4. Test Deployment

Run basic tests to ensure everything works:

```bash
# Update ADDRESSES in scripts/interact.js
node scripts/interact.js
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Gas optimization reviewed
- [ ] Security audit completed (for mainnet)
- [ ] Environment variables set
- [ ] Sufficient ETH for gas
- [ ] Deployment script tested on testnet

### During Deployment
- [ ] Deployment transaction confirmed
- [ ] Contract addresses saved
- [ ] Verification successful

### Post-Deployment
- [ ] Roles granted to appropriate addresses
- [ ] Platform fee configured
- [ ] Fee receiver set
- [ ] Basic functionality tested
- [ ] Contract addresses added to frontend
- [ ] Documentation updated

## Network-Specific Notes

### Ethereum Mainnet
- High gas fees
- Use gas price optimization
- Consider deploying during low-traffic hours
- Irreversible - triple check everything

### Polygon
- Lower gas fees
- Faster confirmations
- Good for production testing
- Bridge required for MATIC

### BSC (Binance Smart Chain)
- Very low gas fees
- Fast confirmations
- Different ecosystem

### Optimism/Arbitrum (L2s)
- Much lower gas fees
- Near-instant confirmations
- Growing ecosystem

## Troubleshooting

### "Insufficient funds"
- Check your wallet balance
- Ensure you have enough ETH for gas

### "Nonce too low"
- Reset your account in MetaMask
- Or specify nonce manually in deployment script

### "Contract verification failed"
- Wait 30 seconds after deployment
- Check constructor arguments match exactly
- Try manual verification

### "Transaction underpriced"
- Increase gas price in hardhat.config.js
- Check current network gas prices

## Gas Optimization Tips

1. **Deploy during low-traffic periods**
   - Check gas prices: https://etherscan.io/gastracker
   - Early morning UTC often has lower fees

2. **Use gas price tools**
   ```javascript
   // In hardhat.config.js
   networks: {
     mainnet: {
       gasPrice: "auto", // Or specify manually
     }
   }
   ```

3. **Batch operations**
   - Deploy both contracts in same transaction if possible
   - Grant multiple roles in one transaction

## Security Considerations

### Private Key Safety
- ⚠️ NEVER commit private keys to git
- Use hardware wallets for mainnet
- Consider multi-sig for admin functions
- Use .env files (never tracked in git)

### Admin Keys
- Use different addresses for different roles
- Consider time-locks for sensitive functions
- Implement multi-sig for DEFAULT_ADMIN_ROLE

### Initial Configuration
- Set appropriate royalty percentages
- Configure reasonable platform fees
- Test pause functionality
- Verify role assignments

## Monitoring

After deployment, monitor:

1. **Transaction Activity**
   - Etherscan for transaction history
   - Set up alerts for large transactions

2. **Contract Balance**
   - Monitor marketplace balance
   - Ensure fees are being collected

3. **Gas Usage**
   - Track average gas per function
   - Optimize if needed

4. **Security**
   - Monitor for unusual activity
   - Set up alerts for role changes
   - Watch for failed transactions

## Support

If you encounter issues:

1. Check [GitHub Issues](https://github.com/yourusername/RWA-Smart-Contract/issues)
2. Review [Hardhat Documentation](https://hardhat.org/docs)
3. Contact developer: [@topsecretagent_007](https://t.me/topsecretagent_007)

---

**Remember**: Always test thoroughly on testnet before mainnet deployment!

