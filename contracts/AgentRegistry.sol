// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentRegistry {
    struct Agent {
        address owner;
        string metadataURI;
        string category;
        uint16 feeBps;
        bool active;
        uint64 createdAt;
        uint64 updatedAt;
    }

    uint256 public nextAgentId = 1;
    address public admin;
    mapping(uint256 => Agent) private agents;
    mapping(address => uint256[]) private ownedAgents;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string metadataURI, string category, uint16 feeBps);
    event AgentUpdated(uint256 indexed agentId, string metadataURI, string category, uint16 feeBps, bool active);

    error NotAgentOwner();
    error InvalidFee();
    error AgentNotFound();

    constructor() {
        admin = msg.sender;
    }

    function registerAgent(string calldata metadataURI, string calldata category, uint16 feeBps) external returns (uint256 agentId) {
        if (feeBps > 3000) revert InvalidFee();

        agentId = nextAgentId++;
        agents[agentId] = Agent({
            owner: msg.sender,
            metadataURI: metadataURI,
            category: category,
            feeBps: feeBps,
            active: true,
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp)
        });
        ownedAgents[msg.sender].push(agentId);

        emit AgentRegistered(agentId, msg.sender, metadataURI, category, feeBps);
    }

    function updateAgent(
        uint256 agentId,
        string calldata metadataURI,
        string calldata category,
        uint16 feeBps,
        bool active
    ) external {
        Agent storage agent = agents[agentId];
        if (agent.owner == address(0)) revert AgentNotFound();
        if (agent.owner != msg.sender) revert NotAgentOwner();
        if (feeBps > 3000) revert InvalidFee();

        agent.metadataURI = metadataURI;
        agent.category = category;
        agent.feeBps = feeBps;
        agent.active = active;
        agent.updatedAt = uint64(block.timestamp);

        emit AgentUpdated(agentId, metadataURI, category, feeBps, active);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        Agent memory agent = agents[agentId];
        if (agent.owner == address(0)) revert AgentNotFound();
        return agent;
    }

    function ownerOf(uint256 agentId) external view returns (address) {
        Agent memory agent = agents[agentId];
        if (agent.owner == address(0)) revert AgentNotFound();
        return agent.owner;
    }

    function feeBpsOf(uint256 agentId) external view returns (uint16) {
        Agent memory agent = agents[agentId];
        if (agent.owner == address(0)) revert AgentNotFound();
        return agent.feeBps;
    }

    function isActive(uint256 agentId) external view returns (bool) {
        return agents[agentId].active;
    }

    function agentsOf(address owner) external view returns (uint256[] memory) {
        return ownedAgents[owner];
    }
}
