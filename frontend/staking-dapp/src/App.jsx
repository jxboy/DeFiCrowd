import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// 确保 constants.js 里的路径和导出是你修改后正确的
import { TOKEN_ADDRESS, TOKEN_ABI, STAKING_ADDRESS, STAKING_ABI } from './constants';
import './App.css';

// Hardhat 本地网络的配置参数
const HARDHAT_NETWORK_ID = '31337';
const HARDHAT_CHAIN_ID_HEX = '0x7a69'; // 31337 的十六进制
const LOCAL_RPC_URL = 'http://127.0.0.1:8545';

function App() {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  
  // 数据状态
  const [tokenBalance, setTokenBalance] = useState("0");
  const [stakedBalance, setStakedBalance] = useState("0");
  const [earnedReward, setEarnedReward] = useState("0");
  const [amount, setAmount] = useState("");

  // --- 核心功能：检查并切换网络 ---
  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (currentChainId !== HARDHAT_CHAIN_ID_HEX) {
      try {
        // 尝试切换网络
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
        });
      } catch (switchError) {
        // 如果网络不存在 (错误代码 4902)，则添加网络
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: HARDHAT_CHAIN_ID_HEX,
                  chainName: 'Hardhat Localhost',
                  rpcUrls: [LOCAL_RPC_URL],
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                },
              ],
            });
          } catch (addError) {
            console.error("添加网络失败", addError);
            return false;
          }
        } else {
          console.error("切换网络失败", switchError);
          return false;
        }
      }
    }
    return true;
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // 1. 先检查网络，强制切到 Localhost
        const isNetworkCorrect = await checkNetwork();
        if (!isNetworkCorrect) {
          alert("请连接到 Hardhat Localhost 网络");
          return;
        }

        // 2. 连接钱包
        const _provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await _provider.send("eth_requestAccounts", []);
        const _signer = await _provider.getSigner();

        setAccount(accounts[0]);
        setProvider(_provider);
        setSigner(_signer);
        
        console.log("钱包已连接:", accounts[0]);
      } catch (error) {
        console.error("连接失败:", error);
      }
    } else {
      alert("请安装 MetaMask!");
    }
  };

  // 处理账户切换和连接中断的逻辑
  const handleAccountsChanged = (accounts) => {
    // 检查账户是否被锁定或切换
    if (accounts.length === 0) {
      console.log('账户已断开或锁定。');
      setAccount("");
      setSigner(null);
      setProvider(null);
      setTokenBalance("0");
      setStakedBalance("0");
      setEarnedReward("0");
    } else if (accounts[0].toLowerCase() !== account.toLowerCase()) {
      // 账户地址发生变化，重新初始化连接和数据
      console.log('账户已切换。正在重新连接...');
      // 重新调用 connectWallet 来更新所有状态
      connectWallet();
    }
  };

  const fetchInfo = async () => {
    if (!signer) return;
    try {
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);

      // 读取数据
      // 注意：如果是刚部署，balanceOf 可能是 0，除非你 mint 了
      const balance = await tokenContract.balanceOf(account);
      const staked = await stakingContract.stakeBalance(account);
      const earned = await stakingContract.earned(account);

      setTokenBalance(ethers.formatEther(balance));
      setStakedBalance(ethers.formatEther(staked));
      setEarnedReward(ethers.formatEther(earned));
    } catch (error) {
      console.error("读取数据失败:", error);
    }
  };

  useEffect(() => {
    if (signer) {
      fetchInfo();
      const interval = setInterval(fetchInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [signer,account]);

    // 账户变化监听器
    useEffect(() => {
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        // Clean up listener when component unmounts
        return () => {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        };
      }
    }, [account]); // 依赖 account，以确保 handleAccountsChanged 能访问到最新的 account 状态


  // --- 交互功能 ---  
  const handleMint = async () => {
    if (!signer) return;
    try {
      debugger;
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const tx = await tokenContract.mint(account, ethers.parseEther("100"));
      await tx.wait();
      alert("Mint 成功! +100 TEST");
      fetchInfo();
    } catch (err) { console.error(err); }
  };

  const handleStake = async () => {
    if (!amount || !signer) return;
    try {
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
      const stakeAmount = ethers.parseEther(amount);

      // 1. 授权
      console.log("正在授权...");
      const approveTx = await tokenContract.approve(STAKING_ADDRESS, stakeAmount);
      await approveTx.wait();
      
      // 2. 质押
      console.log("正在质押...");
      const stakeTx = await stakingContract.stake(stakeAmount);
      await stakeTx.wait();
      
      alert("质押成功!");
      setAmount(""); // 清空输入框
      fetchInfo();
    } catch (err) { 
        console.error("质押失败:", err); 
        alert("出错: " + (err.reason || err.message));
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !signer) return;
    try {
      const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.withdraw(ethers.parseEther(amount));
      await tx.wait();
      alert("提取成功!");
      fetchInfo();
    } catch (err) { console.error(err); }
  };

  const handleClaim = async () => {
    if (!signer) return;
    try {
      const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
      const tx = await stakingContract.claimReward();
      await tx.wait();
      alert("奖励领取成功!");
      fetchInfo();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ justifyContent: "center",maxWidth: "600px", margin: "50px auto", padding: "20px", fontFamily: "sans-serif", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h1 style={{textAlign: 'center'}}>质押DApp</h1>

      <div style={{ marginBottom: "20px", padding: "15px", background: "#f9f9f9", borderRadius: "5px" }}>
        {!account ? (
          <button onClick={connectWallet} style={{ width: "100%", padding: "10px", cursor: "pointer" }}>连接本地钱包 (Hardhat)</button>
        ) : (
          <div>
            <p><strong>账户:</strong> {account}</p>
             <button onClick={connectWallet} style={{ padding: "5px 10px", background: "#303F9F", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
             切换账户
             </button>
            <p><strong>Token余额:</strong> {tokenBalance}</p>
            <button onClick={handleMint} style={{padding: "5px 10px"}}>领取 100 测试币</button>
          </div>
        )}
      </div>

      {account && (
        <>
          <div style={{ marginBottom: "20px", padding: "15px", background: "#e3f2fd", borderRadius: "5px" }}>
            <h3>质押状态</h3>
            <p>已质押: {stakedBalance}</p>
            <p>待领取奖励: {earnedReward}</p>
            <button onClick={handleClaim} disabled={earnedReward === "0.0"}>领取奖励</button>
          </div>

          <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
            <input 
              type="number" 
              placeholder="输入金额" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              style={{ padding: "10px" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleStake} style={{ flex: 1, padding: "10px", background: "#4CAF50", color: "white", border: "none", cursor: "pointer" }}>
                质押
              </button>
              <button onClick={handleWithdraw} style={{ flex: 1, padding: "10px", background: "#f44336", color: "white", border: "none", cursor: "pointer" }}>
                提取
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;