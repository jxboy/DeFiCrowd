// scripts/check-network.js
import hre from "hardhat";

async function main() {
    try {
        console.log("=== 检查 Ganache 网络 ===");

        // 使用 Hardhat 的 provider
        const provider = hre.ethers.provider;

        // 获取网络信息
        const network = await provider.getNetwork();
        console.log("Network chainId:", network.chainId.toString());
        console.log("Network name:", network.name);

        // 检查账户
        const [deployer] = await hre.ethers.getSigners();
        console.log("部署账户:", deployer.address);

        const balance = await deployer.getBalance();
        console.log("账户余额:", hre.ethers.formatEther(balance), "ETH");

        // 检查区块
        const blockNumber = await provider.getBlockNumber();
        console.log("当前区块:", blockNumber);

        console.log("=== 检查完成 ===");

    } catch (error) {
        console.error("检查失败:", error.message);
    }
}

main().catch(console.error);