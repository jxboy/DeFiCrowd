import TokenArtifact from './abi/TestToken.json'; 
import StakingArtifact from './abi/Staking.json';

// 1. 部署后的 TestToken 合约地址
export const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 替换为你部署的 Token 地址

// 2. TestToken 的 ABI (复制 Remix 里的数组内容)
export const TOKEN_ABI = TokenArtifact;

// 3. 部署后的 Staking 合约地址
export const STAKING_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // 替换为你部署的 Staking 地址

// 4. Staking 的 ABI
export const STAKING_ABI = StakingArtifact;


console.log("Token ABI type:", typeof TOKEN_ABI, Array.isArray(TOKEN_ABI));