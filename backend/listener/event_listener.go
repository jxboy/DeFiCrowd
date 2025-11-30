package listener

import (
	"DeFiCrowd/backend/db"
	"DeFiCrowd/pkg/contracts"
	"context"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"log"
	"time"
)

func ListenStakingEvents(rpcUrl string, contractAddress common.Address) {
	client, err := ethclient.Dial(rpcUrl)
	if err != nil {
		log.Fatal("Failed to connect to Ethereum client:", err)
	}
	defer client.Close()

	// **1. 将合约实例移出循环：只需要创建一次**
	stakingContract, err := contracts.NewStaking(contractAddress, client)
	if err != nil {
		log.Fatal("Error creating contract binding:", err)
	}

	query := ethereum.FilterQuery{
		Addresses: []common.Address{contractAddress},
	}

	logs := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Fatal("Failed to subscribe logs:", err)
	}
	defer sub.Unsubscribe() // 确保在函数退出时取消订阅

	log.Printf("Listening for Staking events on address: %s", contractAddress.Hex())

	for {
		select {
		case err := <-sub.Err():
			// 订阅错误时，可以考虑重连逻辑，这里只是简单打印
			log.Println("Subscription error:", err)
			time.Sleep(5 * time.Second) // 避免错误时 CPU 狂转
		case vLog := <-logs:
			// 接收到日志，开始解析
			log.Printf("Log event received from block %d: Tx=%s", vLog.BlockNumber, vLog.TxHash.Hex())

			// **2. 使用外部创建的 stakingContract 实例来解析所有事件**

			// 尝试解析 Staked 事件
			if stakedEvent, err := stakingContract.ParseStaked(vLog); err == nil {
				// Staked事件
				e := db.StakingEvent{
					EventName:   "Staked",
					UserAddress: stakedEvent.User.Hex(),
					Amount:      stakedEvent.Amount.String(),
					BlockNumber: vLog.BlockNumber,
					TxHash:      vLog.TxHash.Hex(),
					Timestamp:   time.Now(),
				}
				db.DB.Create(&e)
				log.Printf("💰 [Staked] User=%s Amount=%s Tx=%s", e.UserAddress, e.Amount, e.TxHash)
				continue // 处理完这个事件，跳到下一次循环
			}

			// 尝试解析 Withdrawn 事件
			if withdrawnEvent, err := stakingContract.ParseWithdrawn(vLog); err == nil {
				// Withdrawn 事件
				e := db.StakingEvent{
					EventName:   "Withdrawn",
					UserAddress: withdrawnEvent.User.Hex(),
					Amount:      withdrawnEvent.Amount.String(),
					BlockNumber: vLog.BlockNumber,
					TxHash:      vLog.TxHash.Hex(),
					Timestamp:   time.Now(),
				}
				db.DB.Create(&e)
				log.Printf("💸 [Withdrawn] User=%s Amount=%s Tx=%s", e.UserAddress, e.Amount, e.TxHash)
				continue // 处理完这个事件，跳到下一次循环
			}

			// 尝试解析 RewardPaid 事件
			if rewardEvent, err := stakingContract.ParseRewardPaid(vLog); err == nil {
				// RewardPaid 事件
				e := db.StakingEvent{
					EventName:   "RewardPaid",
					UserAddress: rewardEvent.User.Hex(),
					Amount:      rewardEvent.Reward.String(),
					BlockNumber: vLog.BlockNumber,
					TxHash:      vLog.TxHash.Hex(),
					Timestamp:   time.Now(),
				}
				db.DB.Create(&e)
				log.Printf("🎁 [RewardPaid] User=%s Amount=%s Tx=%s", e.UserAddress, e.Amount, e.TxHash)
				continue // 处理完这个事件，跳到下一次循环
			}

			// 如果所有解析都失败（例如收到了一个其他合约的日志，或者一个未知的事件日志）
			// 打印一个警告，但仍然继续监听
			log.Printf("⚠️ Unknown event log received or failed to parse. Topics: %v", vLog.Topics)
		}
	}
}
