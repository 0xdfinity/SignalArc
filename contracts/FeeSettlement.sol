// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRegistryForSettlement {
    function ownerOf(uint256 agentId) external view returns (address);
    function feeBpsOf(uint256 agentId) external view returns (uint16);
}

interface IPolicyVaultForSettlement {
    function debitForSettlement(
        address user,
        address venue,
        address agentOwner,
        address platformTreasury,
        uint256 venueAmount,
        uint256 agentFee,
        uint256 platformRetained
    ) external;
}

contract FeeSettlement {
    IRegistryForSettlement public immutable registry;
    IPolicyVaultForSettlement public immutable vault;
    address public admin;
    address public router;
    address public platformTreasury;
    uint16 public platformShareBps = 2500;

    event Settled(
        bytes32 indexed executionId,
        address indexed user,
        uint256 indexed agentId,
        address venue,
        uint256 grossAmount,
        uint256 agentFee,
        uint256 platformRetained
    );
    event RouterUpdated(address indexed router);
    event PlatformShareUpdated(uint16 platformShareBps);
    event PlatformTreasuryUpdated(address indexed platformTreasury);

    error Unauthorized();
    error InvalidShare();
    error InvalidTreasury();

    constructor(address registry_, address vault_, address platformTreasury_) {
        if (platformTreasury_ == address(0)) revert InvalidTreasury();
        registry = IRegistryForSettlement(registry_);
        vault = IPolicyVaultForSettlement(vault_);
        admin = msg.sender;
        platformTreasury = platformTreasury_;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyRouter() {
        if (msg.sender != router) revert Unauthorized();
        _;
    }

    function setRouter(address router_) external onlyAdmin {
        router = router_;
        emit RouterUpdated(router_);
    }

    function setPlatformShare(uint16 platformShareBps_) external onlyAdmin {
        if (platformShareBps_ > 5000) revert InvalidShare();
        platformShareBps = platformShareBps_;
        emit PlatformShareUpdated(platformShareBps_);
    }

    function setPlatformTreasury(address platformTreasury_) external onlyAdmin {
        if (platformTreasury_ == address(0)) revert InvalidTreasury();
        platformTreasury = platformTreasury_;
        emit PlatformTreasuryUpdated(platformTreasury_);
    }

    function settle(
        bytes32 executionId,
        address user,
        uint256 agentId,
        address venue,
        uint256 grossAmount
    ) external onlyRouter returns (uint256 agentFee, uint256 venueAmount) {
        uint16 agentFeeBps = registry.feeBpsOf(agentId);
        address agentOwner = registry.ownerOf(agentId);

        uint256 totalFee = (grossAmount * agentFeeBps) / 10_000;
        uint256 platformRetained = (totalFee * platformShareBps) / 10_000;
        agentFee = totalFee - platformRetained;
        venueAmount = grossAmount - totalFee;

        vault.debitForSettlement(user, venue, agentOwner, platformTreasury, venueAmount, agentFee, platformRetained);

        emit Settled(executionId, user, agentId, venue, grossAmount, agentFee, platformRetained);
    }
}
