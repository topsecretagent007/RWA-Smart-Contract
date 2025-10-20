// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RWADynamicNFT
 * @dev Dynamic NFT for Real World Assets with evolving metadata
 * @notice NFT metadata updates automatically based on asset conditions
 * @author topsecretagent_007 (https://t.me/topsecretagent_007)
 */
contract RWADynamicNFT is 
    ERC721, 
    ERC721URIStorage,
    AccessControl, 
    ReentrancyGuard,
    Pausable 
{
    using Counters for Counters.Counter;
    using Strings for uint256;

    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Token counter
    Counters.Counter private _tokenIdCounter;

    // Asset condition levels
    enum AssetCondition { EXCELLENT, GOOD, FAIR, POOR, CRITICAL }
    
    // Asset metadata (Dynamic)
    struct DynamicAssetData {
        string assetType;           // Real Estate, Art, Vehicle, etc.
        string location;            // Physical location
        uint256 valuationUSD;       // Current valuation (cents)
        uint256 mintTimestamp;      // When minted
        uint256 lastUpdated;        // Last metadata update
        AssetCondition condition;   // Current physical condition
        bool isVerified;            // Verified by authorized party
        string documentHash;        // IPFS hash of legal docs
        uint256 updateCount;        // Number of updates (for history)
        string[] imageHashes;       // Array of IPFS image hashes
    }

    // Price history for tracking
    struct PriceHistory {
        uint256 price;
        uint256 timestamp;
    }

    // Storage
    mapping(uint256 => DynamicAssetData) public assetData;
    mapping(uint256 => PriceHistory[]) public priceHistory;
    mapping(uint256 => string) private _customMetadata; // Custom JSON metadata
    
    // Royalty
    uint96 public royaltyBasisPoints = 250; // 2.5%
    address public royaltyReceiver;

    // Events
    event AssetMinted(uint256 indexed tokenId, address indexed owner, string assetType);
    event AssetUpdated(uint256 indexed tokenId, uint256 newValuation, AssetCondition condition);
    event AssetVerified(uint256 indexed tokenId, address indexed verifier);
    event ConditionChanged(uint256 indexed tokenId, AssetCondition oldCondition, AssetCondition newCondition);
    event ValuationUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);
    event ImageAdded(uint256 indexed tokenId, string imageHash);

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        royaltyReceiver = msg.sender;
    }

    /**
     * @dev Mint a new Dynamic RWA NFT
     */
    function mintAsset(
        address to,
        string memory assetType,
        string memory location,
        uint256 valuationUSD,
        string memory documentHash,
        string memory imageHash
    ) public onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(valuationUSD > 0, "Valuation must be > 0");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);

        // Initialize dynamic asset data
        string[] memory images = new string[](1);
        images[0] = imageHash;

        assetData[tokenId] = DynamicAssetData({
            assetType: assetType,
            location: location,
            valuationUSD: valuationUSD,
            mintTimestamp: block.timestamp,
            lastUpdated: block.timestamp,
            condition: AssetCondition.EXCELLENT,
            isVerified: false,
            documentHash: documentHash,
            updateCount: 0,
            imageHashes: images
        });

        // Initialize price history
        priceHistory[tokenId].push(PriceHistory({
            price: valuationUSD,
            timestamp: block.timestamp
        }));

        emit AssetMinted(tokenId, to, assetType);
        return tokenId;
    }

    /**
     * @dev Update asset valuation (Dynamic)
     */
    function updateValuation(uint256 tokenId, uint256 newValuation) 
        public 
        onlyRole(UPDATER_ROLE) 
    {
        require(_exists(tokenId), "Token does not exist");
        require(newValuation > 0, "Valuation must be > 0");

        uint256 oldValuation = assetData[tokenId].valuationUSD;
        assetData[tokenId].valuationUSD = newValuation;
        assetData[tokenId].lastUpdated = block.timestamp;
        assetData[tokenId].updateCount++;

        // Record price history
        priceHistory[tokenId].push(PriceHistory({
            price: newValuation,
            timestamp: block.timestamp
        }));

        emit ValuationUpdated(tokenId, oldValuation, newValuation);
        emit AssetUpdated(tokenId, newValuation, assetData[tokenId].condition);
    }

    /**
     * @dev Update asset condition (Dynamic)
     */
    function updateCondition(uint256 tokenId, AssetCondition newCondition) 
        public 
        onlyRole(UPDATER_ROLE) 
    {
        require(_exists(tokenId), "Token does not exist");

        AssetCondition oldCondition = assetData[tokenId].condition;
        assetData[tokenId].condition = newCondition;
        assetData[tokenId].lastUpdated = block.timestamp;
        assetData[tokenId].updateCount++;

        emit ConditionChanged(tokenId, oldCondition, newCondition);
        emit AssetUpdated(tokenId, assetData[tokenId].valuationUSD, newCondition);
    }

    /**
     * @dev Add new image to asset (Dynamic)
     */
    function addAssetImage(uint256 tokenId, string memory imageHash) 
        public 
        onlyRole(UPDATER_ROLE) 
    {
        require(_exists(tokenId), "Token does not exist");
        
        assetData[tokenId].imageHashes.push(imageHash);
        assetData[tokenId].lastUpdated = block.timestamp;

        emit ImageAdded(tokenId, imageHash);
    }

    /**
     * @dev Verify asset
     */
    function verifyAsset(uint256 tokenId) 
        public 
        onlyRole(VERIFIER_ROLE) 
    {
        require(_exists(tokenId), "Token does not exist");
        
        assetData[tokenId].isVerified = true;
        assetData[tokenId].lastUpdated = block.timestamp;

        emit AssetVerified(tokenId, msg.sender);
    }

    /**
     * @dev Update multiple asset properties at once (Dynamic)
     */
    function updateAssetData(
        uint256 tokenId,
        uint256 newValuation,
        AssetCondition newCondition,
        string memory newDocumentHash
    ) public onlyRole(UPDATER_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        
        DynamicAssetData storage asset = assetData[tokenId];
        
        if (newValuation > 0 && newValuation != asset.valuationUSD) {
            uint256 oldVal = asset.valuationUSD;
            asset.valuationUSD = newValuation;
            priceHistory[tokenId].push(PriceHistory(newValuation, block.timestamp));
            emit ValuationUpdated(tokenId, oldVal, newValuation);
        }
        
        if (newCondition != asset.condition) {
            AssetCondition oldCond = asset.condition;
            asset.condition = newCondition;
            emit ConditionChanged(tokenId, oldCond, newCondition);
        }
        
        if (bytes(newDocumentHash).length > 0) {
            asset.documentHash = newDocumentHash;
        }
        
        asset.lastUpdated = block.timestamp;
        asset.updateCount++;
        
        emit AssetUpdated(tokenId, asset.valuationUSD, asset.condition);
    }

    /**
     * @dev Generate dynamic SVG based on asset data
     */
    function generateSVG(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        DynamicAssetData memory asset = assetData[tokenId];
        string memory conditionColor = getConditionColor(asset.condition);
        string memory verifiedBadge = asset.isVerified ? "VERIFIED" : "UNVERIFIED";
        
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" style="background:#1a1a2e">',
            '<defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#16213e;stop-opacity:1"/>',
            '<stop offset="100%" style="stop-color:#0f3460;stop-opacity:1"/>',
            '</linearGradient></defs>',
            '<rect width="400" height="400" fill="url(#grad)"/>',
            '<text x="200" y="60" text-anchor="middle" font-size="24" fill="#e94560" font-weight="bold">',
            asset.assetType, '</text>',
            '<rect x="50" y="90" width="300" height="2" fill="#533483"/>',
            '<text x="200" y="140" text-anchor="middle" font-size="18" fill="#f1f1f1">',
            'Valuation: $', formatValuation(asset.valuationUSD), '</text>',
            '<text x="200" y="180" text-anchor="middle" font-size="16" fill="', conditionColor, '">',
            'Condition: ', getConditionString(asset.condition), '</text>',
            '<text x="200" y="220" text-anchor="middle" font-size="14" fill="#a3a3a3">',
            asset.location, '</text>',
            '<rect x="140" y="240" width="120" height="30" rx="15" fill="', 
            asset.isVerified ? '#27ae60' : '#e74c3c', '"/>',
            '<text x="200" y="262" text-anchor="middle" font-size="14" fill="white" font-weight="bold">',
            verifiedBadge, '</text>',
            '<text x="200" y="320" text-anchor="middle" font-size="12" fill="#7f8c8d">',
            'Updates: ', asset.updateCount.toString(), '</text>',
            '<text x="200" y="350" text-anchor="middle" font-size="12" fill="#7f8c8d">',
            'Token #', tokenId.toString(), '</text>',
            '</svg>'
        ));
    }

    /**
     * @dev Generate dynamic JSON metadata
     */
    function generateMetadata(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        DynamicAssetData memory asset = assetData[tokenId];
        
        string memory attributes = string(abi.encodePacked(
            '{"trait_type":"Asset Type","value":"', asset.assetType, '"},',
            '{"trait_type":"Location","value":"', asset.location, '"},',
            '{"trait_type":"Valuation USD","value":', uint256(asset.valuationUSD).toString(), '},',
            '{"trait_type":"Condition","value":"', getConditionString(asset.condition), '"},',
            '{"trait_type":"Verified","value":"', asset.isVerified ? 'Yes' : 'No', '"},',
            '{"trait_type":"Updates","value":', asset.updateCount.toString(), '},',
            '{"trait_type":"Age (days)","value":', 
            ((block.timestamp - asset.mintTimestamp) / 86400).toString(), '}'
        ));

        return string(abi.encodePacked(
            '{"name":"RWA #', tokenId.toString(), '",',
            '"description":"Dynamic Real World Asset NFT",',
            '"image":"data:image/svg+xml;base64,', 
            Base64.encode(bytes(generateSVG(tokenId))), '",',
            '"attributes":[', attributes, ']}'
        ));
    }

    /**
     * @dev Override tokenURI to return dynamic metadata
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        
        // Check if custom URI is set
        string memory customURI = super.tokenURI(tokenId);
        if (bytes(customURI).length > 0) {
            return customURI;
        }
        
        // Return dynamic on-chain metadata
        return string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(generateMetadata(tokenId)))
        ));
    }

    /**
     * @dev Get price history for a token
     */
    function getPriceHistory(uint256 tokenId) 
        public 
        view 
        returns (PriceHistory[] memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        return priceHistory[tokenId];
    }

    /**
     * @dev Get all images for an asset
     */
    function getAssetImages(uint256 tokenId) 
        public 
        view 
        returns (string[] memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        return assetData[tokenId].imageHashes;
    }

    /**
     * @dev Calculate price appreciation percentage
     */
    function getPriceAppreciation(uint256 tokenId) 
        public 
        view 
        returns (int256) 
    {
        require(_exists(tokenId), "Token does not exist");
        PriceHistory[] memory history = priceHistory[tokenId];
        
        if (history.length < 2) return 0;
        
        uint256 initialPrice = history[0].price;
        uint256 currentPrice = assetData[tokenId].valuationUSD;
        
        if (initialPrice == 0) return 0;
        
        int256 change = int256(currentPrice) - int256(initialPrice);
        return (change * 10000) / int256(initialPrice); // Returns basis points
    }

    /**
     * @dev Get tokens owned by address
     */
    function tokensOfOwner(address owner) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        uint256 index = 0;

        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                tokenIds[index] = i;
                index++;
            }
        }

        return tokenIds;
    }

    /**
     * @dev Total supply
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Royalty info (EIP-2981)
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        public
        view
        returns (address, uint256)
    {
        require(_exists(tokenId), "Token does not exist");
        uint256 royaltyAmount = (salePrice * royaltyBasisPoints) / 10000;
        return (royaltyReceiver, royaltyAmount);
    }

    /**
     * @dev Set royalty info
     */
    function setRoyaltyInfo(address receiver, uint96 basisPoints) 
        public 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(receiver != address(0), "Invalid receiver");
        require(basisPoints <= 1000, "Royalty too high (max 10%)");
        royaltyReceiver = receiver;
        royaltyBasisPoints = basisPoints;
    }

    /**
     * @dev Pause/Unpause
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Helper functions
    function getConditionString(AssetCondition condition) private pure returns (string memory) {
        if (condition == AssetCondition.EXCELLENT) return "Excellent";
        if (condition == AssetCondition.GOOD) return "Good";
        if (condition == AssetCondition.FAIR) return "Fair";
        if (condition == AssetCondition.POOR) return "Poor";
        return "Critical";
    }

    function getConditionColor(AssetCondition condition) private pure returns (string memory) {
        if (condition == AssetCondition.EXCELLENT) return "#27ae60";
        if (condition == AssetCondition.GOOD) return "#2ecc71";
        if (condition == AssetCondition.FAIR) return "#f39c12";
        if (condition == AssetCondition.POOR) return "#e67e22";
        return "#e74c3c";
    }

    function formatValuation(uint256 valuationCents) private pure returns (string memory) {
        uint256 dollars = valuationCents / 100;
        uint256 cents = valuationCents % 100;
        
        return string(abi.encodePacked(
            dollars.toString(),
            ".",
            cents < 10 ? "0" : "",
            cents.toString()
        ));
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) 
        internal 
        override(ERC721, ERC721URIStorage) 
    {
        super._burn(tokenId);
        delete assetData[tokenId];
        delete priceHistory[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

