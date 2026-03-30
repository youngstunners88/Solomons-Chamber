// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GoalsProtocolNFT
 * @dev $GOALS - Dynamic NFT contract with self-regulating agent integration
 * "Every goal tells a story"
 */
contract GoalsProtocolNFT is 
    ERC721, 
    ERC721Enumerable, 
    ERC721URIStorage, 
    Pausable, 
    Ownable, 
    ERC721Burnable,
    ERC2981
{
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;

    // ============ Enums ============
    
    enum Rarity { COMMON, RARE, EPIC, LEGENDARY, MYTHIC }
    enum Position { GK, DEF, MID, FWD }
    enum AgentHealth { HEALTHY, DEGRADED, CRITICAL, RECOVERING }

    // ============ Structs ============
    
    struct PlayerStats {
        uint16 pace;
        uint16 shooting;
        uint16 passing;
        uint16 dribbling;
        uint16 defense;
        uint16 physical;
        uint16 overall;
        uint256 lastUpdate;
    }

    struct LiveStats {
        uint256 distanceCovered;
        uint16 sprints;
        uint16 topSpeed;
        uint8 fatigueLevel;
        uint16 passesCompleted;
        uint8 shotsOnTarget;
        uint8 goals;
        uint8 assists;
        uint256 lastUpdate;
    }

    struct TokenData {
        string playerName;
        Position position;
        Rarity rarity;
        PlayerStats baseStats;
        LiveStats liveStats;
        uint256 mintTimestamp;
        uint256 matchesPlayed;
        address agentWallet;
        bool agentEnabled;
        string dynamicImageURI;
        
        // Self-regulation data
        AgentHealth agentHealth;
        uint256 lastSelfCheck;
        uint256 consecutiveErrors;
    }

    struct AgentDiagnostics {
        uint256 timestamp;
        string issue;
        string resolution;
        bool autoResolved;
    }

    // ============ State Variables ============
    
    mapping(uint256 => TokenData) public tokenData;
    mapping(uint256 => AgentDiagnostics[]) public agentDiagnostics;
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public authorizedUpdaters;
    mapping(Rarity => uint256) public rarityPrices;
    mapping(Rarity => uint256) public maxSupply;
    mapping(Rarity => uint256) public currentSupply;

    uint256 public constant MAX_MINT_PER_TX = 10;
    uint256 public constant MAX_SUPPLY_LIMIT = 100000;
    uint256 public constant MIN_SELF_CHECK_INTERVAL = 1 minutes;
    uint256 public constant MAX_SELF_CHECK_INTERVAL = 24 hours;
    uint256 public constant ROYALTY_PERCENTAGE = 500;
    uint256 public constant BOOST_DURATION = 30 minutes;
    uint256 public selfCheckInterval = 1 hours;
    uint256 public constant MAX_CONSECUTIVE_ERRORS = 5;
    
    address public royaltyRecipient;
    address public dataOracle;
    address public agentRegulator;
    
    string public baseURI;
    string public baseExtension = ".json";

    // ============ Events ============
    
    event PlayerMinted(uint256 indexed tokenId, address indexed owner, string playerName, Rarity rarity, uint256 price);
    event AgentEnabled(uint256 indexed tokenId, address indexed agentWallet);
    event AgentDisabled(uint256 indexed tokenId);
    event StatsUpdated(uint256 indexed tokenId, LiveStats newStats);
    event MatchPlayed(uint256 indexed tokenId, bool won, uint256 goals, uint256 assists);
    event AchievementUnlocked(uint256 indexed tokenId, string achievement);
    event CardBoosted(uint256 indexed tokenId, uint256 boostEndTime);
    
    // Self-regulation events
    event SelfCheckPerformed(uint256 indexed tokenId, AgentHealth health, bool issuesFound);
    event AgentDegraded(uint256 indexed tokenId, string reason);
    event AgentRecovered(uint256 indexed tokenId, string resolution);
    event AutoRemediation(uint256 indexed tokenId, string issue, string action);
    event DiagnosticsReported(uint256 indexed tokenId, string issue, bool autoResolved);

    // ============ Modifiers ============
    
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    modifier onlyAuthorizedUpdater() {
        require(authorizedUpdaters[msg.sender] || msg.sender == dataOracle || msg.sender == owner(), "Not authorized to update");
        _;
    }
    
    modifier onlyAgentRegulator() {
        require(msg.sender == agentRegulator || msg.sender == owner(), "Not regulator");
        _;
    }

    modifier validRarity(Rarity _rarity) {
        require(currentSupply[_rarity] < maxSupply[_rarity], "Rarity supply exhausted");
        _;
    }

    modifier tokenExists(uint256 _tokenId) {
        require(_exists(_tokenId), "Token does not exist");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _royaltyRecipient,
        address _dataOracle,
        address _agentRegulator,
        string memory _baseURI
    ) ERC721("$GOALS Protocol", "GOALS") {
        require(_royaltyRecipient != address(0), "Invalid royalty recipient");
        require(_dataOracle != address(0), "Invalid data oracle");
        require(_agentRegulator != address(0), "Invalid agent regulator");
        
        royaltyRecipient = _royaltyRecipient;
        dataOracle = _dataOracle;
        agentRegulator = _agentRegulator;
        baseURI = _baseURI;
        
        rarityPrices[Rarity.COMMON] = 0.01 ether;
        rarityPrices[Rarity.RARE] = 0.05 ether;
        rarityPrices[Rarity.EPIC] = 0.2 ether;
        rarityPrices[Rarity.LEGENDARY] = 1 ether;
        rarityPrices[Rarity.MYTHIC] = 5 ether;
        
        maxSupply[Rarity.COMMON] = 5000;
        maxSupply[Rarity.RARE] = 2000;
        maxSupply[Rarity.EPIC] = 500;
        maxSupply[Rarity.LEGENDARY] = 100;
        maxSupply[Rarity.MYTHIC] = 20;
    }

    // ============ Self-Regulation Functions ============
    
    /**
     * @dev Perform self-check on agent health
     * Can be called by anyone (incentivized), but only affects state if issues found
     */
    function performSelfCheck(uint256 _tokenId) public tokenExists(_tokenId) returns (AgentHealth) {
        TokenData storage data = tokenData[_tokenId];
        
        // Check if agent is due for self-check
        if (block.timestamp < data.lastSelfCheck + selfCheckInterval && data.consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
            return data.agentHealth;
        }
        
        // Perform diagnostic checks
        bool hasIssues = false;
        string memory issue = "";
        
        // Check 1: No updates for too long
        if (block.timestamp > data.liveStats.lastUpdate + 2 hours) {
            hasIssues = true;
            issue = "Stale data - no updates for 2+ hours";
            data.consecutiveErrors++;
        }
        
        // Check 2: Too many consecutive errors
        if (data.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            hasIssues = true;
            issue = "Max consecutive errors reached";
            _degradeAgent(_tokenId, issue);
        }
        
        // Check 3: Agent enabled but no wallet
        if (data.agentEnabled && data.agentWallet == address(0)) {
            hasIssues = true;
            issue = "Agent enabled but no wallet configured";
            _autoRemediate(_tokenId, issue, "Disabled agent due to missing wallet");
            data.agentEnabled = false;
        }
        
        // Update health status
        if (hasIssues) {
            if (data.agentHealth == AgentHealth.HEALTHY) {
                data.agentHealth = AgentHealth.DEGRADED;
                emit AgentDegraded(_tokenId, issue);
            }
        } else {
            // All checks passed
            if (data.agentHealth != AgentHealth.HEALTHY) {
                _recoverAgent(_tokenId, "All diagnostics passed");
            }
            data.consecutiveErrors = 0;
            data.agentHealth = AgentHealth.HEALTHY;
        }
        
        data.lastSelfCheck = block.timestamp;
        emit SelfCheckPerformed(_tokenId, data.agentHealth, hasIssues);
        
        return data.agentHealth;
    }
    
    /**
     * @dev Report diagnostics from agent (off-chain monitoring)
     */
    function reportAgentDiagnostics(
        uint256 _tokenId,
        string memory _issue,
        string memory _resolution,
        bool _autoResolved
    ) public onlyAgentRegulator tokenExists(_tokenId) {
        AgentDiagnostics memory diag = AgentDiagnostics({
            timestamp: block.timestamp,
            issue: _issue,
            resolution: _resolution,
            autoResolved: _autoResolved
        });
        
        agentDiagnostics[_tokenId].push(diag);
        
        TokenData storage data = tokenData[_tokenId];
        
        if (!_autoResolved) {
            data.consecutiveErrors++;
            if (data.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                _degradeAgent(_tokenId, _issue);
            }
        } else {
            emit AutoRemediation(_tokenId, _issue, _resolution);
            if (data.consecutiveErrors > 0) {
                data.consecutiveErrors--;
            }
        }
        
        emit DiagnosticsReported(_tokenId, _issue, _autoResolved);
    }
    
    /**
     * @dev Force agent recovery (admin only)
     */
    function forceAgentRecovery(uint256 _tokenId, string memory _reason) public onlyOwner tokenExists(_tokenId) {
        _recoverAgent(_tokenId, _reason);
    }
    
    /**
     * @dev Batch self-check all agents
     */
    function batchSelfCheck(uint256[] memory _tokenIds) public {
        for (uint i = 0; i < _tokenIds.length; i++) {
            if (_exists(_tokenIds[i])) {
                performSelfCheck(_tokenIds[i]);
            }
        }
    }
    
    function _degradeAgent(uint256 _tokenId, string memory _reason) internal {
        TokenData storage data = tokenData[_tokenId];
        data.agentHealth = AgentHealth.CRITICAL;
        data.agentEnabled = false; // Auto-disable on critical
        emit AgentDegraded(_tokenId, _reason);
    }
    
    function _recoverAgent(uint256 _tokenId, string memory _resolution) internal {
        TokenData storage data = tokenData[_tokenId];
        data.agentHealth = AgentHealth.RECOVERING;
        data.consecutiveErrors = 0;
        emit AgentRecovered(_tokenId, _resolution);
        
        // After recovery period, set back to healthy
        // In production, this would be time-gated
        data.agentHealth = AgentHealth.HEALTHY;
    }
    
    function _autoRemediate(uint256 _tokenId, string memory _issue, string memory _action) internal {
        emit AutoRemediation(_tokenId, _issue, _action);
    }

    // ============ Minting Functions ============
    
    function mintPlayer(
        string memory _playerName,
        Position _position,
        Rarity _rarity,
        PlayerStats memory _baseStats,
        string memory _imageURI
    ) public payable whenNotPaused validRarity(_rarity) returns (uint256) {
        require(msg.value >= rarityPrices[_rarity], "Insufficient payment");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, tokenId);

        LiveStats memory emptyLiveStats = LiveStats({
            distanceCovered: 0,
            sprints: 0,
            topSpeed: 0,
            fatigueLevel: 0,
            passesCompleted: 0,
            shotsOnTarget: 0,
            goals: 0,
            assists: 0,
            lastUpdate: block.timestamp
        });

        tokenData[tokenId] = TokenData({
            playerName: _playerName,
            position: _position,
            rarity: _rarity,
            baseStats: _baseStats,
            liveStats: emptyLiveStats,
            mintTimestamp: block.timestamp,
            matchesPlayed: 0,
            agentWallet: address(0),
            agentEnabled: false,
            dynamicImageURI: _imageURI,
            agentHealth: AgentHealth.HEALTHY,
            lastSelfCheck: block.timestamp,
            consecutiveErrors: 0
        });

        currentSupply[_rarity]++;

        emit PlayerMinted(tokenId, msg.sender, _playerName, _rarity, msg.value);

        return tokenId;
    }

    // ============ Dynamic Updates ============
    
    function updateLiveStats(uint256 _tokenId, LiveStats memory _newStats) 
        public 
        onlyAuthorizedUpdater 
        tokenExists(_tokenId) 
    {
        // Auto-perform self-check on update
        TokenData storage data = tokenData[_tokenId];
        
        // Reset error count on successful update
        data.consecutiveErrors = 0;
        
        // Update stats
        tokenData[_tokenId].liveStats = _newStats;
        emit StatsUpdated(_tokenId, _newStats);
        
        // Check for achievements
        _checkAchievements(_tokenId);
    }

    function recordMatch(uint256 _tokenId, bool _won, uint256 _goals, uint256 _assists) 
        public 
        onlyAuthorizedUpdater 
        tokenExists(_tokenId) 
    {
        TokenData storage data = tokenData[_tokenId];
        
        data.matchesPlayed++;
        data.liveStats.goals += uint8(_goals);
        data.liveStats.assists += uint8(_assists);
        data.liveStats.lastUpdate = block.timestamp;

        emit MatchPlayed(_tokenId, _won, _goals, _assists);
        
        if (_goals > 0) {
            emit CardBoosted(_tokenId, block.timestamp + BOOST_DURATION);
        }
    }

    // ============ Agent Integration ============
    
    function enableAgent(uint256 _tokenId, address _agentWallet) public tokenExists(_tokenId) {
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        require(_agentWallet != address(0), "Invalid agent wallet");
        
        TokenData storage data = tokenData[_tokenId];
        
        // Check agent health before enabling
        require(data.agentHealth != AgentHealth.CRITICAL, "Agent in critical state");
        
        data.agentWallet = _agentWallet;
        data.agentEnabled = true;
        data.consecutiveErrors = 0;

        emit AgentEnabled(_tokenId, _agentWallet);
    }

    function disableAgent(uint256 _tokenId) public tokenExists(_tokenId) {
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        tokenData[_tokenId].agentEnabled = false;
        emit AgentDisabled(_tokenId);
    }

    // ============ View Functions ============
    
    function getTokenData(uint256 _tokenId) public view tokenExists(_tokenId) returns (TokenData memory) {
        return tokenData[_tokenId];
    }

    function getAgentDiagnostics(uint256 _tokenId) public view tokenExists(_tokenId) returns (AgentDiagnostics[] memory) {
        return agentDiagnostics[_tokenId];
    }

    function getAgentHealth(uint256 _tokenId) public view tokenExists(_tokenId) returns (AgentHealth) {
        return tokenData[_tokenId].agentHealth;
    }

    function isAgentHealthy(uint256 _tokenId) public view tokenExists(_tokenId) returns (bool) {
        return tokenData[_tokenId].agentHealth == AgentHealth.HEALTHY;
    }

    function getTokensByOwner(address _owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        
        return tokenIds;
    }

    // ============ Internal Functions ============
    
    function _checkAchievements(uint256 _tokenId) internal {
        TokenData storage data = tokenData[_tokenId];
        LiveStats memory live = data.liveStats;

        if (live.goals >= 3) {
            _unlockAchievement(_tokenId, "HAT_TRICK");
        }
        if (live.topSpeed > 350) {
            _unlockAchievement(_tokenId, "SPEED_DEMON");
        }
        if (live.assists >= 10) {
            _unlockAchievement(_tokenId, "PLAYMAKER");
        }
        if (live.distanceCovered >= 10000) {
            _unlockAchievement(_tokenId, "WORKHORSE");
        }
    }

    function _unlockAchievement(uint256 _tokenId, string memory _achievement) internal {
        emit AchievementUnlocked(_tokenId, _achievement);
    }

    // ============ Admin Functions ============
    
    function setAuthorizedMinter(address _minter, bool _authorized) public onlyOwner {
        authorizedMinters[_minter] = _authorized;
    }

    function setAuthorizedUpdater(address _updater, bool _authorized) public onlyOwner {
        authorizedUpdaters[_updater] = _authorized;
    }
    
    function setAgentRegulator(address _regulator) public onlyOwner {
        require(_regulator != address(0), "Invalid regulator address");
        agentRegulator = _regulator;
    }
    
    function setRarityPrice(Rarity _rarity, uint256 _price) public onlyOwner {
        rarityPrices[_rarity] = _price;
    }
    
    function setMaxSupply(Rarity _rarity, uint256 _supply) public onlyOwner {
        require(_supply <= MAX_SUPPLY_LIMIT, "Supply exceeds maximum limit");
        require(_supply >= currentSupply[_rarity], "Supply below current minted");
        maxSupply[_rarity] = _supply;
    }
    
    function setSelfCheckInterval(uint256 _interval) public onlyOwner {
        require(_interval >= MIN_SELF_CHECK_INTERVAL && _interval <= MAX_SELF_CHECK_INTERVAL, "Invalid interval");
        selfCheckInterval = _interval;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }

    // ============ Royalty Info ============
    
    function royaltyInfo(uint256, uint256 _salePrice) public view override returns (address receiver, uint256 royaltyAmount) {
        return (royaltyRecipient, (_salePrice * ROYALTY_PERCENTAGE) / 10000);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        string memory dynamicURI = tokenData[tokenId].dynamicImageURI;
        if (bytes(dynamicURI).length > 0) {
            return dynamicURI;
        }
        
        return string(abi.encodePacked(baseURI, tokenId.toString(), baseExtension));
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) 
        internal 
        override(ERC721, ERC721Enumerable) 
        whenNotPaused 
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
