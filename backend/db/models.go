package db

/**
 * 从数据库中读取后放到redis中
 * @description: 获取用户质押信息
 * @param {string} user 用户地址
 * @return
 */
func GetUserStakeInfo(user string) (balance string, earned string) {
	// 假数据
	return "1000", "25"
}
