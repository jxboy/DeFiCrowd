package main

import (
	"DeFiCrowd/backend/api"
	"DeFiCrowd/backend/config"
	"DeFiCrowd/backend/db"
	"DeFiCrowd/backend/listener"
	"github.com/ethereum/go-ethereum/common"
	"log"
)

func main() {
	// 初始化数据库
	db.InitDB()

	rpcUrl := config.RpcUrl
	contractAddress := common.HexToAddress(config.ContractAddress)

	// 并发启动事件监听
	go listener.ListenStakingEvents(rpcUrl, contractAddress)

	// 启动 HTTP 接口
	api.RunServer(":8888")

	log.Println("System started successfully.")

}
