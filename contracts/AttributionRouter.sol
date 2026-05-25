// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPolicyVaultForRouter {
    function authorizedSpend(address user, uint256 agentId, bytes32 categoryHash, uint256 amount) external view returns (bool);
    function recordExecutionSpend(address user, uint256 agentId, uint256 amount) external;
}

interface IFeeSettlementForRouter {
    function settle(
        bytes32 executionId,
        address user,
        uint256 agentId,
        address venue,
        uint256 grossAmount
    ) external returns (uint256 agentFee, uint256 venueAmount);
}

contract AttributionRouter {
    struct ActionIntent {
        uint256 agentId;
        string marketId;
        address venue;
        bytes32 categoryHash;
        bytes32 actionHash;
        uint256 amount;
        uint16 confidenceBps;
        string rationaleURI;
        uint64 expiry;
        bytes signature;
        address publisher;
        bool executed;
    }

    IPolicyVaultForRouter public immutable vault;
    IFeeSettlementForRouter public immutable settlement;
    address public admin;
    mapping(address => bool) public executors;
    mapping(bytes32 => ActionIntent) private actions;

    event ActionPublished(
        bytes32 indexed actionId,
        uint256 indexed agentId,
        string marketId,
        address indexed publisher,
        uint256 amount,
        uint16 confidenceBps
    );
    event ActionExecuted(
        bytes32 indexed executionId,
        bytes32 indexed actionId,
        address indexed user,
        address venue,
        uint256 grossAmount,
        uint256 agentFee,
        uint256 venueAmount
    );
    event ExecutorUpdated(address indexed executor, bool allowed);

    error Unauthorized();
    error ActionExpired();
    error AlreadyExecuted();
    error PolicyRejected();
    error ActionNotFound();

    constructor(address vault_, address settlement_) {
        vault = IPolicyVaultForRouter(vault_);
        settlement = IFeeSettlementForRouter(settlement_);
        admin = msg.sender;
        executors[msg.sender] = true;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyExecutor() {
        if (!executors[msg.sender]) revert Unauthorized();
        _;
    }

    function setExecutor(address executor, bool allowed) external onlyAdmin {
        executors[executor] = allowed;
        emit ExecutorUpdated(executor, allowed);
    }

    function publishAction(
        uint256 agentId,
        string calldata marketId,
        address venue,
        bytes32 categoryHash,
        bytes32 actionHash,
        uint256 amount,
        uint16 confidenceBps,
        string calldata rationaleURI,
        uint64 expiry,
        bytes calldata signature
    ) external returns (bytes32 actionId) {
        actionId = keccak256(abi.encode(agentId, marketId, venue, amount, expiry, msg.sender));
        actions[actionId] = ActionIntent({
            agentId: agentId,
            marketId: marketId,
            venue: venue,
            categoryHash: categoryHash,
            actionHash: actionHash,
            amount: amount,
            confidenceBps: confidenceBps,
            rationaleURI: rationaleURI,
            expiry: expiry,
            signature: signature,
            publisher: msg.sender,
            executed: false
        });

        emit ActionPublished(actionId, agentId, marketId, msg.sender, amount, confidenceBps);
    }

    function executeAction(bytes32 actionId, address user) external onlyExecutor returns (bytes32 executionId) {
        ActionIntent storage intent = actions[actionId];
        if (intent.publisher == address(0)) revert ActionNotFound();
        if (intent.executed) revert AlreadyExecuted();
        if (intent.expiry < block.timestamp) revert ActionExpired();
        if (!vault.authorizedSpend(user, intent.agentId, intent.categoryHash, intent.amount)) revert PolicyRejected();

        intent.executed = true;
        executionId = keccak256(abi.encode(actionId, user, block.number, block.timestamp));
        vault.recordExecutionSpend(user, intent.agentId, intent.amount);
        (uint256 agentFee, uint256 venueAmount) = settlement.settle(
            executionId,
            user,
            intent.agentId,
            intent.venue,
            intent.amount
        );

        emit ActionExecuted(executionId, actionId, user, intent.venue, intent.amount, agentFee, venueAmount);
    }

    function getAction(bytes32 actionId) external view returns (ActionIntent memory) {
        ActionIntent memory intent = actions[actionId];
        if (intent.publisher == address(0)) revert ActionNotFound();
        return intent;
    }
}
