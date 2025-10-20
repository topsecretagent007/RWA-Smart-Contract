import { ethers } from "hardhat";
import * as fs from "fs";

enum AssetCondition {
  EXCELLENT = 0,
  GOOD = 1,
  FAIR = 2,
  POOR = 3,
  CRITICAL = 4
}

function getConditionName(condition: number): string {
  const conditions = ["Excellent", "Good", "Fair", "Poor", "Critical"];
  return conditions[condition] || "Unknown";
}

async function main(): Promise<void> {
  console.log("🔗 Interacting with RWA Dynamic NFT Contracts...\n");

  // Contract addresses (update these with your deployed addresses)
  const RWA_NFT_ADDRESS = process.env.RWA_NFT_ADDRESS || "YOUR_RWA_NFT_ADDRESS";
  const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS || "YOUR_MARKETPLACE_ADDRESS";

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("📍 Using account:", signer.address);

  // Get contract instances
  const RWADynamicNFTFactory = await ethers.getContractFactory("RWADynamicNFT");
  const rwaNFT = RWADynamicNFTFactory.attach(RWA_NFT_ADDRESS);

  const RWAMarketplaceFactory = await ethers.getContractFactory("RWAMarketplace");
  const marketplace = RWAMarketplaceFactory.attach(MARKETPLACE_ADDRESS);

  console.log("\n📄 RWADynamicNFT Address:", await rwaNFT.getAddress());
  console.log("📄 Marketplace Address:", await marketplace.getAddress());

  // Example 1: Mint a Dynamic NFT
  console.log("\n" + "=".repeat(70));
  console.log("🎨 Example 1: Minting Dynamic RWA NFT...");
  console.log("=".repeat(70));
  
  try {
    const mintTx = await rwaNFT.mintAsset(
      signer.address,
      "Real Estate",
      "123 Main St, New York, NY",
      50000000, // $500,000.00
      "ipfs://QmYourDocumentHash",
      "ipfs://QmYourImageHash"
    );

    const receipt = await mintTx.wait();
    console.log("✅ NFT Minted! Transaction hash:", receipt?.hash);

    const tokenId = 0;
    
    // Get asset data
    console.log("\n📊 Dynamic Asset Data:");
    const asset = await rwaNFT.assetData(tokenId);
    console.log("   Asset Type:", asset.assetType);
    console.log("   Location:", asset.location);
    console.log("   Valuation: $" + (Number(asset.valuationUSD) / 100).toFixed(2));
    console.log("   Condition:", getConditionName(Number(asset.condition)));
    console.log("   Verified:", asset.isVerified);
    console.log("   Update Count:", asset.updateCount.toString());

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // Example 2: Update Asset Valuation (Dynamic Feature)
  console.log("\n" + "=".repeat(70));
  console.log("💰 Example 2: Updating Asset Valuation (Dynamic Update)...");
  console.log("=".repeat(70));

  try {
    const tokenId = 0;
    const newValuation = 60000000; // Update to $600,000

    const updateTx = await rwaNFT.updateValuation(tokenId, newValuation);
    await updateTx.wait();

    console.log("✅ Valuation updated to $" + (newValuation / 100).toFixed(2));

    // Check price history
    const history = await rwaNFT.getPriceHistory(tokenId);
    console.log("\n📈 Price History:");
    history.forEach((entry: any, index: number) => {
      const date = new Date(Number(entry.timestamp) * 1000).toLocaleString();
      console.log(`   ${index + 1}. $${(Number(entry.price) / 100).toFixed(2)} at ${date}`);
    });

    // Check price appreciation
    const appreciation = await rwaNFT.getPriceAppreciation(tokenId);
    const appreciationPercent = (Number(appreciation) / 100).toFixed(2);
    console.log(`\n📊 Price Appreciation: ${appreciationPercent}%`);

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // Example 3: Update Asset Condition (Dynamic Feature)
  console.log("\n" + "=".repeat(70));
  console.log("🔧 Example 3: Updating Asset Condition (Dynamic Update)...");
  console.log("=".repeat(70));

  try {
    const tokenId = 0;
    const newCondition = AssetCondition.GOOD;

    const conditionTx = await rwaNFT.updateCondition(tokenId, newCondition);
    await conditionTx.wait();

    console.log("✅ Condition updated to:", getConditionName(newCondition));

    const asset = await rwaNFT.assetData(tokenId);
    console.log("   Current Update Count:", asset.updateCount.toString());

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // Example 4: Get Dynamic SVG
  console.log("\n" + "=".repeat(70));
  console.log("🎨 Example 4: Generating Dynamic On-Chain SVG...");
  console.log("=".repeat(70));

  try {
    const tokenId = 0;
    const svg = await rwaNFT.generateSVG(tokenId);
    
    console.log("✅ Dynamic SVG Generated!");
    console.log("   SVG Length:", svg.length, "characters");
    console.log("   Preview (first 200 chars):", svg.substring(0, 200) + "...");
    
    // Save SVG to file
    fs.writeFileSync('dynamic-nft.svg', svg);
    console.log("   💾 Saved to dynamic-nft.svg");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // Example 5: Get Dynamic Token URI
  console.log("\n" + "=".repeat(70));
  console.log("🌐 Example 5: Getting Dynamic Token URI...");
  console.log("=".repeat(70));

  try {
    const tokenId = 0;
    const uri = await rwaNFT.tokenURI(tokenId);
    
    console.log("✅ Dynamic Token URI (on-chain metadata):");
    console.log("   URI Length:", uri.length, "characters");
    console.log("   Type: Base64 encoded JSON with embedded SVG");
    
    // Decode and display metadata
    if (uri.startsWith('data:application/json;base64,')) {
      const base64Data = uri.replace('data:application/json;base64,', '');
      const decoded = Buffer.from(base64Data, 'base64').toString();
      console.log("\n   📋 Decoded Metadata:");
      console.log("   " + decoded.substring(0, 300) + "...");
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // Example 6: Add More Images (Dynamic Feature)
  console.log("\n" + "=".repeat(70));
  console.log("🖼️  Example 6: Adding More Images (Dynamic Gallery)...");
  console.log("=".repeat(70));

  try {
    const tokenId = 0;
    
    await rwaNFT.addAssetImage(tokenId, "ipfs://QmImage2");
    await rwaNFT.addAssetImage(tokenId, "ipfs://QmImage3");
    
    const images = await rwaNFT.getAssetImages(tokenId);
    console.log("✅ Asset now has", images.length, "images:");
    images.forEach((img: string, idx: number) => {
      console.log(`   ${idx + 1}. ${img}`);
    });

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // Example 7: Verify Asset
  console.log("\n" + "=".repeat(70));
  console.log("✅ Example 7: Verifying Asset...");
  console.log("=".repeat(70));

  try {
    const tokenId = 0;
    
    const verifyTx = await rwaNFT.verifyAsset(tokenId);
    await verifyTx.wait();
    
    console.log("✅ Asset verified!");
    
    const asset = await rwaNFT.assetData(tokenId);
    console.log("   Verified:", asset.isVerified);

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  // Example 8: List on Marketplace
  console.log("\n" + "=".repeat(70));
  console.log("🏪 Example 8: Listing NFT on Marketplace...");
  console.log("=".repeat(70));

  try {
    const tokenId = 0;
    const price = ethers.parseEther("10");

    const approveTx = await rwaNFT.approve(await marketplace.getAddress(), tokenId);
    await approveTx.wait();
    console.log("✅ Marketplace approved for token #" + tokenId);

    const listTx = await marketplace.listNFT(
      await rwaNFT.getAddress(),
      tokenId,
      price
    );
    const listReceipt = await listTx.wait();
    console.log("✅ NFT listed for sale at", ethers.formatEther(price), "ETH");
    console.log("   Transaction hash:", listReceipt?.hash);

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ All Examples Completed!");
  console.log("=".repeat(70));
  console.log("\n💡 Key Dynamic Features Demonstrated:");
  console.log("   ✓ Real-time valuation updates");
  console.log("   ✓ Condition monitoring");
  console.log("   ✓ Price history tracking");
  console.log("   ✓ On-chain SVG generation");
  console.log("   ✓ Dynamic metadata");
  console.log("   ✓ Image gallery updates");
  console.log("   ✓ Asset verification");
  console.log("   ✓ Marketplace integration\n");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

