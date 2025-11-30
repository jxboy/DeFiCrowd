# DeFiCrowd

## 项目简介
演示一个简化的质押 (Staking) 协议，包含 Solidity 合约 + Go 后端服务事件监听 + HTTP API。
目标是展示你具备从链上合约开发、事件监听、后端服务构架的能力。


### contracts/
质押合约代码，用户可以质押ERC20代币并实时获取收益。合约包含质押、提取、收益计算、事件 `Staked`, `Withdrawn`, `RewardPaid`。

### deploy/
脚本用于部署合约至测试网

### backend/
- listener/ — 实时监听合约事件并将其同步至数据库或内存模型。
- api/ — 提供 HTTP 接口供前端或测试调用，如 `/stake/info?user=0x...`。
- db/ — 数据访问层，保存用户质押状态、收益历史。
- config/ — 配置模块（如 RPC 节点地址、合约地址、DB配置）。

### frontend
前端项目，目前调用合约

