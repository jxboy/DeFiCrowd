import hre from "hardhat";
import fs from "fs/promises"; // 使用 promise 版本的 fs，配合 async/await

// 部署配置（将硬编码的值提取为配置，方便修改和维护）
const DEPLOY_CONFIG = {
    token: {
        name: "Ether",
        symbol: "ETH",
        initialSupply: hre.ethers.parseEther("1000000"), // 100万枚
    },
    staking: {
        rewardRate: hre.ethers.parseEther("0.0001"), // 奖励率
        // 如果需要指定已存在的 token 地址，可以在这里配置（默认使用新部署的 token）
        existingTokenAddress: "",
    },
    outputFile: "contract-addresses.json", // 地址输出文件
};

// 主部署函数
async function main() {
    // 1. 获取部署者信息
    const [deployer] = await hre.ethers.getSigners();
    console.log(`📤 Deploying contracts with account: ${deployer.address}`);

    // 打印部署者余额（方便调试）
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH\n`);

    // 存储部署后的地址
    const deployedAddresses = {};

    try {
        // 2. 部署 ERC20 Token（如果没有指定已存在的 token 地址）
        const tokenAddress = DEPLOY_CONFIG.staking.existingTokenAddress || (await deployToken(deployer));
        deployedAddresses.token = tokenAddress;
        console.log(`✅ Token deployed to: ${tokenAddress}\n`);

        // 3. 部署 Staking 合约
        const stakingAddress = await deployStaking(deployer, tokenAddress);
        deployedAddresses.staking = stakingAddress;
        console.log(`✅ Staking deployed to: ${stakingAddress}\n`);

        // 4. 保存地址到文件（使用 fs.promises 避免回调地狱）
        await saveDeployedAddresses(deployedAddresses);
        console.log(`✅ Addresses saved to ${DEPLOY_CONFIG.outputFile}`);

        console.log("\n🎉 Deployment completed successfully!");

    } catch (error) {
        console.error("\n❌ Deployment failed!");
        console.error("Error details:", error.message || error);

        // 如果已经部署了部分合约，尝试保存已部署的地址
        if (Object.keys(deployedAddresses).length > 0) {
            await saveDeployedAddresses(deployedAddresses, "partially-deployed-addresses.json");
            console.log(`⚠️ Partially deployed addresses saved to partially-deployed-addresses.json`);
        }

        process.exit(1); // 退出程序，标记失败
    }
}

/**
 * 部署 ERC20 Token 合约
 * @param {ethers.Signer} deployer - 部署者签名者
 * @returns {Promise<string>} - 部署后的合约地址
 */
async function deployToken(deployer) {
    console.log("📦 Deploying ERC20 Token...");
    const Token = await hre.ethers.getContractFactory("TestToken", deployer); // 指定部署者
    const token = await Token.deploy(
        DEPLOY_CONFIG.token.name,
        DEPLOY_CONFIG.token.symbol,
        DEPLOY_CONFIG.token.initialSupply
    );
    await token.waitForDeployment(); // 等待部署完成
    return await token.getAddress(); // 获取合约地址（ethers.js v6 推荐用法）
}

/**
 * 部署 Staking 合约
 * @param {ethers.Signer} deployer - 部署者签名者
 * @param {string} tokenAddress - ERC20 Token 地址
 * @returns {Promise<string>} - 部署后的合约地址
 */
async function deployStaking(deployer, tokenAddress) {
    console.log("📦 Deploying Staking Contract...");
    const Staking = await hre.ethers.getContractFactory("Staking", deployer); // 指定部署者
    const staking = await Staking.deploy(tokenAddress, DEPLOY_CONFIG.staking.rewardRate);
    await staking.waitForDeployment(); // 等待部署完成
    return await staking.getAddress(); // 获取合约地址
}

/**
 * 保存部署后的地址到 JSON 文件
 * @param {object} addresses - 部署的合约地址对象
 * @param {string} [fileName=DEPLOY_CONFIG.outputFile] - 输出文件名
 */
async function saveDeployedAddresses(addresses, fileName = DEPLOY_CONFIG.outputFile) {
    // 读取已有的地址文件（如果存在），合并新地址
    let existingAddresses = {};
    try {
        const existingData = await fs.readFile(fileName, "utf8");
        existingAddresses = JSON.parse(existingData);
    } catch (err) {
        // 如果文件不存在，直接创建
        if (err.code !== "ENOENT") throw err;
    }

    // 合并地址（新地址覆盖旧地址）
    const mergedAddresses = { ...existingAddresses, ...addresses };

    // 写入文件（格式化 JSON，便于阅读）
    await fs.writeFile(fileName, JSON.stringify(mergedAddresses, null, 2), "utf8");
}

// 执行主函数
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Unhandled error:", error);
        process.exit(1);
    });