// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is ReentrancyGuard {
    IERC20 public immutable stakingToken;
    uint256 public rewardRatePerSecond;     // 可按秒计算收益
    uint256 public totalStaked;
    mapping(address => uint256) public stakeBalance;
    mapping(address => uint256) public stakeTimestamp;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(IERC20 _stakingToken, uint256 _rewardRatePerSecond) {
        stakingToken = _stakingToken;
        rewardRatePerSecond = _rewardRatePerSecond;
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        // 先发放旧的收益
        _payReward(msg.sender);

        stakingToken.transferFrom(msg.sender, address(this), amount);
        stakeBalance[msg.sender] += amount;
        stakeTimestamp[msg.sender] = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0 && stakeBalance[msg.sender] >= amount, "Invalid amount");
        _payReward(msg.sender);

        stakeBalance[msg.sender] -= amount;
        totalStaked -= amount;
        stakingToken.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() external nonReentrant {
        _payReward(msg.sender);
    }

    function _payReward(address user) internal {
        uint256 staked = stakeBalance[user];
        if (staked > 0) {
            uint256 duration = block.timestamp - stakeTimestamp[user];
            uint256 reward = staked * rewardRatePerSecond * duration / 1e18;
            stakeTimestamp[user] = block.timestamp;
            stakingToken.transfer(user, reward);
            emit RewardPaid(user, reward);
        } else {
            stakeTimestamp[user] = block.timestamp;
        }
    }

    // 只读函数
    function earned(address user) external view returns(uint256) {
        uint256 staked = stakeBalance[user];
        if (staked == 0) return 0;
        uint256 duration = block.timestamp - stakeTimestamp[user];
        return staked * rewardRatePerSecond * duration / 1e18;
    }
}