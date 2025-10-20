import { ethers } from "hardhat";
import hre from "hardhat";

async function main(): Promise<void> {
  console.log("🚀 Starting RWA Dynamic NFT Smart Contract Deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy RWADynamicNFT Contract
  console.log("📄 Deploying RWADynamicNFT Contract (with Dynamic NFT features)...");
  const RWADynamicNFTFactory = await ethers.getContractFactory("RWADynamicNFT");
  const rwaNFT = await RWADynamicNFTFactory.deploy(
    "Real World Asset Dynamic NFT",  // Name
    "RWAD"                           // Symbol
  );
  
  await rwaNFT.waitForDeployment();
  const rwaNFTAddress = await rwaNFT.getAddress();
  console.log("✅ RWADynamicNFT deployed to:", rwaNFTAddress);

  // Deploy RWAMarketplace Contract
  console.log("\n📄 Deploying RWAMarketplace Contract...");
  const RWAMarketplaceFactory = await ethers.getContractFactory("RWAMarketplace");
  const marketplace = await RWAMarketplaceFactory.deploy(
    deployer.address  // Fee receiver
  );
  
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ RWAMarketplace deployed to:", marketplaceAddress);

  // Wait for block confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  const rwaTx = rwaNFT.deploymentTransaction();
  const marketplaceTx = marketplace.deploymentTransaction();
  
  if (rwaTx) await rwaTx.wait(5);
  if (marketplaceTx) await marketplaceTx.wait(5);

  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT SUCCESSFUL - DYNAMIC NFT SYSTEM READY!");
  console.log("=".repeat(70));
  console.log("\n📋 Contract Addresses:");
  console.log("   RWADynamicNFT (dNFT):", rwaNFTAddress);
  console.log("   RWAMarketplace:", marketplaceAddress);
  console.log("\n✨ Dynamic NFT Features:");
  console.log("   ✓ Real-time metadata updates");
  console.log("   ✓ On-chain SVG generation");
  console.log("   ✓ Price history tracking");
  console.log("   ✓ Asset condition monitoring");
  console.log("   ✓ Dynamic image gallery");
  console.log("\n📝 Add these to your .env file:");
  console.log(`   RWA_NFT_ADDRESS=${rwaNFTAddress}`);
  console.log(`   MARKETPLACE_ADDRESS=${marketplaceAddress}`);

  // Verify contracts on Etherscan (if not localhost)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Waiting before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: rwaNFTAddress,
        constructorArguments: ["Real World Asset Dynamic NFT", "RWAD"],
      });
      console.log("✅ RWADynamicNFT verified on Etherscan");
    } catch (error: any) {
      console.log("⚠️  RWADynamicNFT verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: [deployer.address],
      });
      console.log("✅ RWAMarketplace verified on Etherscan");
    } catch (error: any) {
      console.log("⚠️  RWAMarketplace verification failed:", error.message);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("📚 Next Steps:");
  console.log("   1. Update .env file with contract addresses");
  console.log("   2. Grant MINTER_ROLE to authorized addresses");
  console.log("   3. Grant VERIFIER_ROLE to asset verifiers");
  console.log("   4. Grant UPDATER_ROLE for dynamic updates");
  console.log("   5. Test dynamic features (update valuation, condition, etc.)");
  console.log("   6. View on-chain SVG and metadata");
  console.log("=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

