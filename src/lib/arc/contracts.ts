export const ERC20_USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
] as const;

export const POLICY_VAULT_ABI = [
  "function depositUSDC(uint256 amount) external",
  "function withdrawUSDC(uint256 amount) external",
  "function balances(address user) external view returns (uint256)",
] as const;
