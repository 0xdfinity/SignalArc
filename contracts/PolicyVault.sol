// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IERC20.sol";

interface IAgentRegistry {
    function isActive(uint256 agentId) external view returns (bool);
}

contract PolicyVault {
    struct Policy {
        uint256 maxSpend;
        uint256 maxDailySpend;
        uint256 maxPerTrade;
        bytes32 categoryHash;
        uint16 stopLossBps;
        uint64 expiry;
        bool manualReview;
        bool active;
    }

    IERC20 public immutable usdc;
    IAgentRegistry public immutable registry;
    address public admin;
    address public router;
    address public settlement;

    mapping(address => uint256) public balances;
    mapping(address => mapping(uint256 => bool)) public subscriptions;
    mapping(address => mapping(uint256 => Policy)) public policies;
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public dailySpend;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event PolicyCreated(address indexed user, uint256 indexed agentId, uint256 maxSpend, uint256 maxPerTrade, uint64 expiry);
    event AgentSubscribed(address indexed user, uint256 indexed agentId);
    event ExecutionSpendRecorded(address indexed user, uint256 indexed agentId, uint256 indexed day, uint256 amount);
    event VaultDebited(
        address indexed user,
        address indexed venue,
        address indexed agentOwner,
        address platformTreasury,
        uint256 venueAmount,
        uint256 agentFee,
        uint256 platformRetained
    );

    error Unauthorized();
    error InvalidAmount();
    error InsufficientVaultBalance();
    error PolicyRejected();

    constructor(address usdc_, address registry_) {
        usdc = IERC20(usdc_);
        registry = IAgentRegistry(registry_);
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyRouter() {
        if (msg.sender != router) revert Unauthorized();
        _;
    }

    modifier onlySettlement() {
        if (msg.sender != settlement) revert Unauthorized();
        _;
    }

    function setRouter(address router_) external onlyAdmin {
        router = router_;
    }

    function setSettlement(address settlement_) external onlyAdmin {
        settlement = settlement_;
    }

    function depositUSDC(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        bool ok = usdc.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert InvalidAmount();
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdrawUSDC(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        if (balances[msg.sender] < amount) revert InsufficientVaultBalance();
        balances[msg.sender] -= amount;
        bool ok = usdc.transfer(msg.sender, amount);
        if (!ok) revert InvalidAmount();
        emit Withdrawn(msg.sender, amount);
    }

    function createPolicy(
        uint256 agentId,
        uint256 maxSpend,
        uint256 maxDailySpend,
        uint256 maxPerTrade,
        bytes32 categoryHash,
        uint16 stopLossBps,
        uint64 expiry,
        bool manualReview
    ) external {
        if (!registry.isActive(agentId)) revert PolicyRejected();
        if (maxSpend == 0 || maxDailySpend == 0 || maxPerTrade == 0) revert InvalidAmount();
        if (maxPerTrade > maxDailySpend || maxDailySpend > maxSpend) revert PolicyRejected();

        policies[msg.sender][agentId] = Policy({
            maxSpend: maxSpend,
            maxDailySpend: maxDailySpend,
            maxPerTrade: maxPerTrade,
            categoryHash: categoryHash,
            stopLossBps: stopLossBps,
            expiry: expiry,
            manualReview: manualReview,
            active: true
        });

        emit PolicyCreated(msg.sender, agentId, maxSpend, maxPerTrade, expiry);
    }

    function subscribeAgent(uint256 agentId) external {
        if (!registry.isActive(agentId)) revert PolicyRejected();
        subscriptions[msg.sender][agentId] = true;
        emit AgentSubscribed(msg.sender, agentId);
    }

    function authorizedSpend(
        address user,
        uint256 agentId,
        bytes32 categoryHash,
        uint256 amount
    ) public view returns (bool) {
        Policy memory policy = policies[user][agentId];
        uint256 day = block.timestamp / 1 days;

        return subscriptions[user][agentId]
            && policy.active
            && !policy.manualReview
            && policy.expiry >= block.timestamp
            && policy.categoryHash == categoryHash
            && amount <= policy.maxPerTrade
            && dailySpend[user][agentId][day] + amount <= policy.maxDailySpend
            && balances[user] >= amount;
    }

    function recordExecutionSpend(address user, uint256 agentId, uint256 amount) external onlyRouter {
        uint256 day = block.timestamp / 1 days;
        dailySpend[user][agentId][day] += amount;
        emit ExecutionSpendRecorded(user, agentId, day, amount);
    }

    function debitForSettlement(
        address user,
        address venue,
        address agentOwner,
        address platformTreasury,
        uint256 venueAmount,
        uint256 agentFee,
        uint256 platformRetained
    ) external onlySettlement {
        uint256 total = venueAmount + agentFee + platformRetained;
        if (balances[user] < total) revert InsufficientVaultBalance();
        balances[user] -= total;

        if (venueAmount > 0) {
            bool venueOk = usdc.transfer(venue, venueAmount);
            if (!venueOk) revert InvalidAmount();
        }

        if (agentFee > 0) {
            bool feeOk = usdc.transfer(agentOwner, agentFee);
            if (!feeOk) revert InvalidAmount();
        }

        if (platformRetained > 0) {
            bool platformOk = usdc.transfer(platformTreasury, platformRetained);
            if (!platformOk) revert InvalidAmount();
        }

        emit VaultDebited(user, venue, agentOwner, platformTreasury, venueAmount, agentFee, platformRetained);
    }
}
