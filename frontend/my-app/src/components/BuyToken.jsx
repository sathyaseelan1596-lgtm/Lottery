import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const POOL_ADDRESS   = "0x813D0cE4d144500B9D668e718210322E4890F25C";
const SWAP_ROUTER_ADDRESS = "0xAd4B479a199a44424888601D3B2F92453010e35D";
const USDC = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";
const yvUSDC  = "0x4fa10b7721d1e98f5ed992382ca59890cb70f5c5";

const POOL_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount","type":"uint128"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount0","type":"uint128"},{"indexed":false,"internalType":"uint128","name":"amount1","type":"uint128"}],"name":"Collect","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint128","name":"amount0","type":"uint128"},{"indexed":false,"internalType":"uint128","name":"amount1","type":"uint128"}],"name":"CollectProtocol","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"paid0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"paid1","type":"uint256"}],"name":"Flash","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"observationCardinalityNextOld","type":"uint16"},{"indexed":false,"internalType":"uint16","name":"observationCardinalityNextNew","type":"uint16"}],"name":"IncreaseObservationCardinalityNext","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"indexed":false,"internalType":"int24","name":"tick","type":"int24"}],"name":"Initialize","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount","type":"uint128"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"feeProtocol0Old","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"feeProtocol1Old","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"feeProtocol0New","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"feeProtocol1New","type":"uint8"}],"name":"SetFeeProtocol","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"int256","name":"amount0","type":"int256"},{"indexed":false,"internalType":"int256","name":"amount1","type":"int256"},{"indexed":false,"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"indexed":false,"internalType":"uint128","name":"liquidity","type":"uint128"},{"indexed":false,"internalType":"int24","name":"tick","type":"int24"}],"name":"Swap","type":"event"},{"inputs":[{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"amount","type":"uint128"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"amount0Requested","type":"uint128"},{"internalType":"uint128","name":"amount1Requested","type":"uint128"}],"name":"collect","outputs":[{"internalType":"uint128","name":"amount0","type":"uint128"},{"internalType":"uint128","name":"amount1","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint128","name":"amount0Requested","type":"uint128"},{"internalType":"uint128","name":"amount1Requested","type":"uint128"}],"name":"collectProtocol","outputs":[{"internalType":"uint128","name":"amount0","type":"uint128"},{"internalType":"uint128","name":"amount1","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"fee","outputs":[{"internalType":"uint24","name":"","type":"uint24"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeGrowthGlobal0X128","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeGrowthGlobal1X128","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"flash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"}],"name":"increaseObservationCardinalityNext","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"liquidity","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxLiquidityPerTick","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"amount","type":"uint128"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"mint","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"observations","outputs":[{"internalType":"uint32","name":"blockTimestamp","type":"uint32"},{"internalType":"int56","name":"tickCumulative","type":"int56"},{"internalType":"uint160","name":"secondsPerLiquidityCumulativeX128","type":"uint160"},{"internalType":"bool","name":"initialized","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32[]","name":"secondsAgos","type":"uint32[]"}],"name":"observe","outputs":[{"internalType":"int56[]","name":"tickCumulatives","type":"int56[]"},{"internalType":"uint160[]","name":"secondsPerLiquidityCumulativeX128s","type":"uint160[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"positions","outputs":[{"internalType":"uint128","name":"liquidity","type":"uint128"},{"internalType":"uint256","name":"feeGrowthInside0LastX128","type":"uint256"},{"internalType":"uint256","name":"feeGrowthInside1LastX128","type":"uint256"},{"internalType":"uint128","name":"tokensOwed0","type":"uint128"},{"internalType":"uint128","name":"tokensOwed1","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"protocolFees","outputs":[{"internalType":"uint128","name":"token0","type":"uint128"},{"internalType":"uint128","name":"token1","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"feeProtocol0","type":"uint8"},{"internalType":"uint8","name":"feeProtocol1","type":"uint8"}],"name":"setFeeProtocol","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"slot0","outputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"uint16","name":"observationIndex","type":"uint16"},{"internalType":"uint16","name":"observationCardinality","type":"uint16"},{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"},{"internalType":"uint8","name":"feeProtocol","type":"uint8"},{"internalType":"bool","name":"unlocked","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"}],"name":"snapshotCumulativesInside","outputs":[{"internalType":"int56","name":"tickCumulativeInside","type":"int56"},{"internalType":"uint160","name":"secondsPerLiquidityInsideX128","type":"uint160"},{"internalType":"uint32","name":"secondsInside","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"bool","name":"zeroForOne","type":"bool"},{"internalType":"int256","name":"amountSpecified","type":"int256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[{"internalType":"int256","name":"amount0","type":"int256"},{"internalType":"int256","name":"amount1","type":"int256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"int16","name":"","type":"int16"}],"name":"tickBitmap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tickSpacing","outputs":[{"internalType":"int24","name":"","type":"int24"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"int24","name":"","type":"int24"}],"name":"ticks","outputs":[{"internalType":"uint128","name":"liquidityGross","type":"uint128"},{"internalType":"int128","name":"liquidityNet","type":"int128"},{"internalType":"uint256","name":"feeGrowthOutside0X128","type":"uint256"},{"internalType":"uint256","name":"feeGrowthOutside1X128","type":"uint256"},{"internalType":"int56","name":"tickCumulativeOutside","type":"int56"},{"internalType":"uint160","name":"secondsPerLiquidityOutsideX128","type":"uint160"},{"internalType":"uint32","name":"secondsOutside","type":"uint32"},{"internalType":"bool","name":"initialized","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}
];

const SWAP_ROUTER_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH9","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMinimum","type":"uint256"}],"internalType":"struct ISwapRouter.ExactInputParams","name":"params","type":"tuple"}],"name":"exactInput","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMinimum","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct ISwapRouter.ExactInputSingleParams","name":"params","type":"tuple"}],"name":"exactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMaximum","type":"uint256"}],"internalType":"struct ISwapRouter.ExactOutputParams","name":"params","type":"tuple"}],"name":"exactOutput","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMaximum","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct ISwapRouter.ExactOutputSingleParams","name":"params","type":"tuple"}],"name":"exactOutputSingle","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes[]","name":"data","type":"bytes[]"}],"name":"multicall","outputs":[{"internalType":"bytes[]","name":"results","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"refundETH","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitAllowed","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitAllowedIfNecessary","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitIfNecessary","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"}],"name":"sweepToken","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"feeBips","type":"uint256"},{"internalType":"address","name":"feeRecipient","type":"address"}],"name":"sweepTokenWithFee","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"int256","name":"amount0Delta","type":"int256"},{"internalType":"int256","name":"amount1Delta","type":"int256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"uniswapV3SwapCallback","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"}],"name":"unwrapWETH9","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"feeBips","type":"uint256"},{"internalType":"address","name":"feeRecipient","type":"address"}],"name":"unwrapWETH9WithFee","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
];

function sqrtPriceX96ToPrice(sqrtPriceX96, dec0, dec1) {
  const Q96 = BigInt("0x1000000000000000000000000");
  const sq = BigInt(sqrtPriceX96.toString());
  const numerator   = sq * sq;
  const denominator = Q96 * Q96;
  const priceRaw = Number(numerator) / Number(denominator);
  return priceRaw * 10 ** (dec0 - dec1);
}

function useWindowSize() {
  const [size, setSize] = useState({
    width:  typeof window !== "undefined" ? window.innerWidth  : 420,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  useEffect(() => {
    const handle = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return size;
}

export default function SwapUI({ onClose }) {
  const { width } = useWindowSize();
  const isMobile = width < 480;
  const [account, setAccount]   = useState(null);
  const [chainId, setChainId]   = useState(null);
  const [poolFee,        setPoolFee]        = useState(null);
  const [token0,         setToken0]         = useState(null);
  const [token1,         setToken1]         = useState(null);
  const [token0Symbol,   setToken0Symbol]   = useState("...");
  const [token1Symbol,   setToken1Symbol]   = useState("...");
  const [token0Decimals, setToken0Decimals] = useState(6);
  const [token1Decimals, setToken1Decimals] = useState(6);
  const [price,          setPrice]          = useState(0);
  const [priceInverse,   setPriceInverse]   = useState(0);
  const [balance0, setBalance0] = useState("0");
  const [balance1, setBalance1] = useState("0");
  const [swapDirection,   setSwapDirection]   = useState("0to1");
  const [inputAmount,     setInputAmount]     = useState("");
  const [estimatedOutput, setEstimatedOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txHash,  setTxHash]  = useState(null);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

  useEffect(() => {
    const detect = async () => {
      if (!window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const addr = accounts[0].address ?? accounts[0];
          setAccount(addr);
          const net = await provider.getNetwork();
          setChainId(Number(net.chainId));
        }
      } catch (e) { console.error(e); }
    };
    detect();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accs) => setAccount(accs[0] ?? null));
      window.ethereum.on("chainChanged",    ()     => window.location.reload());
    }
  }, []);

  const fetchPoolData = useCallback(async () => {
  if (!window.ethereum) return;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

    const slot0data = await pool.slot0();
    const sqrtPriceX96 = slot0data[0];

    if (!isMetadataLoaded) {
      const t0 = await pool.token0();
      const t1 = await pool.token1();
      setToken0(t0);
      setToken1(t1);

      const t0c = new ethers.Contract(t0, ERC20_ABI, provider);
      const t1c = new ethers.Contract(t1, ERC20_ABI, provider);
      
      const [sym0, sym1, dec0, dec1, fee] = await Promise.all([
        t0c.symbol(),
        t1c.symbol(),
        t0c.decimals(),
        t1c.decimals(),
        pool.fee()
      ]);

      setToken0Symbol(sym0);
      setToken1Symbol(sym1);
      setToken0Decimals(Number(dec0));
      setToken1Decimals(Number(dec1));
      setPoolFee(Number(fee));
      setIsMetadataLoaded(true);
    }

    if (token0Decimals && token1Decimals) {
       const p = sqrtPriceX96ToPrice(sqrtPriceX96, token0Decimals, token1Decimals);
       setPrice(p);
       setPriceInverse(p > 0 ? 1 / p : 0);
    }

  } catch (e) {
    console.warn("RPC Syncing..."); 
  }
}, [isMetadataLoaded, token0Decimals, token1Decimals]);

  useEffect(() => {
    fetchPoolData();
    const id = setInterval(fetchPoolData, 15_000);
    return () => clearInterval(id);
  }, [fetchPoolData]);

  const fetchBalances = useCallback(async () => {
    if (!account || !token0 || !token1) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const c0 = new ethers.Contract(token0, ERC20_ABI, provider);
      const c1 = new ethers.Contract(token1, ERC20_ABI, provider);
      const [b0, b1] = await Promise.all([
        c0.balanceOf(account),
        c1.balanceOf(account),
      ]);
      setBalance0(ethers.formatUnits(b0, token0Decimals));
      setBalance1(ethers.formatUnits(b1, token1Decimals));
    } catch (e) {
      console.error("Balance fetch error:", e);
    }
  }, [account, token0, token1, token0Decimals, token1Decimals]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  useEffect(() => {
    const amt = Number(inputAmount);
    if (!inputAmount || isNaN(amt) || amt <= 0 || price <= 0) {
      setEstimatedOutput(null);
      return;
    }
    const raw = swapDirection === "0to1" ? amt * price : amt * priceInverse;
    setEstimatedOutput(raw.toFixed(6));
  }, [inputAmount, price, priceInverse, swapDirection]);

  const connectWallet = async () => {
    if (!window.ethereum) return toast.error("⚠️ MetaMask not found!");
    try {
      const provider  = new ethers.BrowserProvider(window.ethereum);
      const accounts  = await provider.send("eth_requestAccounts", []);
      const net       = await provider.getNetwork();
      setAccount(accounts[0]);
      setChainId(Number(net.chainId));
      toast.success("🔗 Wallet Connected!");
    } catch (e) {
      toast.error("❌ Connection Rejected");
    }
  };

  const executeSwap = async () => {
    if (!inputAmount || Number(inputAmount) <= 0)
      return toast.error("⚠️ Enter an amount");
    if (!account)
      return toast.error("⚠️ Connect your wallet first");
    if (!poolFee || !token0 || !token1)
      return toast.error("⚠️ Pool data not loaded yet — please wait");
    if (price <= 0)
      return toast.error("⚠️ Price not available yet");

    setLoading(true);
    setTxHash(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();

      const tokenIn    = swapDirection === "0to1" ? token0 : token1;
      const tokenOut   = swapDirection === "0to1" ? token1 : token0;
      const decimalsIn = swapDirection === "0to1" ? token0Decimals : token1Decimals;
      const decimalsOut= swapDirection === "0to1" ? token1Decimals : token0Decimals;

      let amountIn;
      try {
        amountIn = ethers.parseUnits(String(inputAmount), decimalsIn);
      } catch {
        toast.error("Invalid amount");
        setLoading(false);
        return;
      }

      const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, signer);
      const allowance = await tokenInContract.allowance(account, SWAP_ROUTER_ADDRESS);

      if (allowance < amountIn) {
        const tid = toast.loading("🔓 Approving token spend…");
        try {
          const tx = await tokenInContract.approve(SWAP_ROUTER_ADDRESS, ethers.MaxUint256);
          await tx.wait();
          toast.dismiss(tid);
          toast.success("Approval confirmed!");
        } catch (e) {
          toast.dismiss(tid);
          toast.error("Approval rejected");
          setLoading(false);
          return;
        }
      }

      let amountOutMin = 0n;
      if (estimatedOutput && Number(estimatedOutput) > 0) {
        try {
          const minOutFloat = Number(estimatedOutput) * 0.995;
          const minOutStr   = minOutFloat.toFixed(Math.min(decimalsOut, 6));
          amountOutMin      = ethers.parseUnits(minOutStr, decimalsOut);
        } catch {
          amountOutMin = 0n;
        }
      }

      const deadline = Math.floor(Date.now() / 1000) + 600;
      const params   = {
        tokenIn,
        tokenOut,
        fee:              poolFee,
        recipient:        account,
        deadline,
        amountIn,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: 0n,
      };

      console.log("Swap params:", {
        tokenIn,
        tokenOut,
        fee: poolFee,
        recipient: account,
        deadline,
        amountIn: amountIn.toString(),
        amountOutMinimum: amountOutMin.toString(),
      });

      const router  = new ethers.Contract(SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI, signer);
      const tid2    = toast.loading("⏳ Confirm in wallet…");
      let tx;
      try {
        tx = await router.exactInputSingle(params);
      } catch (e) {
        toast.dismiss(tid2);
        const msg = e?.reason ?? e?.data?.message ?? e?.message ?? "Swap failed";
        toast.error(`❌ ${msg}`);
        setLoading(false);
        return;
      }

      toast.dismiss(tid2);
      const tid3 = toast.loading("Waiting for confirmation…");
      let receipt;
      try {
        receipt = await tx.wait();
      } catch (e) {
        toast.dismiss(tid3);
        toast.error("❌ Transaction failed on-chain");
        setLoading(false);
        return;
      }

      toast.dismiss(tid3);
      toast.success("Swap Successful!");
      setTxHash(receipt.hash);
      setInputAmount("");
      setEstimatedOutput(null);
      fetchPoolData();
      fetchBalances();

    } catch (e) {
      console.error("Swap error:", e);
      toast.error(e?.reason ?? e?.message ?? "❌ Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const toggleDirection = () => {
    setSwapDirection(d => d === "0to1" ? "1to0" : "0to1");
    setInputAmount("");
    setEstimatedOutput(null);
  };

  const inputSymbol   = swapDirection === "0to1" ? token0Symbol : token1Symbol;
  const outputSymbol  = swapDirection === "0to1" ? token1Symbol : token0Symbol;
  const inputBalance  = swapDirection === "0to1" ? balance0     : balance1;
  const outputBalance = swapDirection === "0to1" ? balance1     : balance0;
  const feePercent    = poolFee ? (poolFee / 10_000).toFixed(2) : "...";

  const priceLabel = price > 0
    ? swapDirection === "0to1"
      ? `1 ${token0Symbol} = ${price.toFixed(6)} ${token1Symbol}`
      : `1 ${token1Symbol} = ${priceInverse.toFixed(6)} ${token0Symbol}`
    : "Loading…";

  const cardVariants = {
    hidden:  { opacity: 0, y: 30, scale: 0.97 },
    visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
    exit:    { opacity: 0, y: 20,            transition: { duration: 0.25 } },
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }

        .sw-overlay {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(5px);
          z-index: 9999;
          padding: 12px;
        }
        .sw-scroll {
          width: 100%;
          max-width: 440px;
          max-height: calc(100dvh - 24px);
          max-height: calc(100vh  - 24px);
          overflow-y: auto;
          overflow-x: hidden;
          border-radius: 20px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .sw-scroll::-webkit-scrollbar { display: none; }

        @media (max-width: 479px) {
          .sw-overlay { padding: 8px; align-items: flex-end; }
          .sw-scroll  {
            max-width: 100%;
            max-height: calc(100dvh - 16px);
            max-height: calc(100vh  - 16px);
            border-radius: 20px 20px 12px 12px;
          }
        }
      `}</style>

      <Toaster
        position="top-center"
        gutter={8}
        toastOptions={{
          style: {
            fontSize: isMobile ? "13px" : "14px",
            maxWidth: isMobile ? "92vw" : "380px",
            zIndex: 10000,
          },
        }}
      />

      <div className="sw-overlay">
        <div className="sw-scroll">
          <motion.div
            initial="hidden" animate="visible" exit="exit"
            variants={cardVariants}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? "10px" : "14px",
              width: "100%",
              background: "rgba(15,15,15,0.98)",
              backdropFilter: "blur(12px)",
              padding: isMobile ? "14px 12px" : "20px",
              borderRadius: "inherit",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* ══ HEADER ══ */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <span style={{ fontSize: isMobile ? "20px" : "24px" }}>🦄</span>
                <h2 style={{ fontSize: isMobile ? "17px":"20px", fontWeight:800, color:"#ffb74d", margin:0 }}>
                  Swap
                </h2>
                <span style={{
                  fontSize:"10px", fontWeight:800, color:"#ff9800",
                  background:"rgba(255,152,0,0.15)", border:"1px solid rgba(255,152,0,0.3)",
                  padding:"2px 8px", borderRadius:"6px", letterSpacing:"1px",
                }}>V3</span>
              </div>

              <motion.button
                onClick={onClose}
                whileHover={{ scale:1.08 }} whileTap={{ scale:0.9 }}
                style={{
                  padding: isMobile ? "5px 10px" : "6px 14px",
                  background:"rgba(255,255,255,0.06)",
                  border:"1px solid rgba(255,255,255,0.12)",
                  borderRadius:"8px", color:"#aaa",
                  fontSize: isMobile ? "12px":"13px",
                  fontWeight:700, cursor:"pointer", outline:"none",
                }}
              >✕ Close</motion.button>
            </div>

            {/* ══ POOL INFO ══ */}
            <div style={{
              background:"rgba(255,255,255,0.03)",
              border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:"14px",
              padding: isMobile ? "10px":"14px 18px",
            }}>
              <div style={{
                display:"flex", justifyContent:"space-around",
                alignItems:"center", flexWrap:"wrap", gap:"8px",
              }}>
                {[
                  // { label:"Pair",     value:`${token0Symbol} / ${token1Symbol}` },
                  { label:"Price",    value: priceLabel },
                  { label:"Fee Tier", value:`${feePercent}%` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display:"flex", flexDirection:"column",
                    alignItems:"center", gap:"3px", minWidth:"80px",
                  }}>
                    <span style={{
                      fontSize: isMobile ? "10px":"11px", color:"#888",
                      textTransform:"uppercase", letterSpacing:"1px",
                    }}>{label}</span>
                    <span style={{
                      fontSize: isMobile ? "11px":"13px", fontWeight:700,
                      color:"#ffb74d", textAlign:"center",
                    }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ MAIN ══ */}
            <AnimatePresence mode="wait">
              {!account ? (
                <motion.div
                  key="connect"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  style={{
                    background:"rgba(255,255,255,0.03)",
                    border:"1px solid rgba(255,255,255,0.07)",
                    borderRadius:"14px",
                    padding: isMobile ? "28px 16px":"36px 20px",
                    textAlign:"center",
                    display:"flex", flexDirection:"column",
                    alignItems:"center", gap:"14px",
                  }}
                >
                  <motion.span
                    animate={{ y:[0,-8,0] }}
                    transition={{ repeat:Infinity, duration:2 }}
                    style={{ fontSize: isMobile ? "32px":"40px" }}
                  >🔗</motion.span>

                  <p style={{
                    fontSize: isMobile ? "13px":"14px", color:"#888",
                    maxWidth:"260px", lineHeight:1.55,
                  }}>
                    Connect your wallet to swap {token0Symbol} ↔ {token1Symbol} via Uniswap V3
                  </p>

                  <motion.button
                    whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={connectWallet}
                    style={{
                      padding: isMobile ? "12px 24px":"13px 32px",
                      background:"linear-gradient(135deg,#ff9800,#f57c00)",
                      border:"none", borderRadius:"12px",
                      color:"#000", fontWeight:800,
                      fontSize: isMobile ? "14px":"15px",
                      cursor:"pointer",
                      boxShadow:"0 4px 18px rgba(255,152,0,0.35)",
                      width: isMobile ? "100%":"auto",
                    }}
                  >🦊 Connect MetaMask</motion.button>
                </motion.div>

              ) : (
                <motion.div
                  key="swap"
                  initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0 }}
                  style={{ display:"flex", flexDirection:"column", gap:"10px" }}
                >
                  {/* swap box */}
                  <div style={{
                    background:"rgba(255,255,255,0.03)",
                    border:"1px solid rgba(255,255,255,0.07)",
                    borderRadius:"16px",
                    padding: isMobile ? "12px":"16px",
                    display:"flex", flexDirection:"column", gap:"4px",
                  }}>

                    {/* FROM */}
                    <TokenBox
                      label="You Pay"
                      symbol={inputSymbol}
                      balance={inputBalance}
                      value={inputAmount}
                      onChange={setInputAmount}
                      onMax={() => setInputAmount(inputBalance)}
                      isMobile={isMobile}
                      editable
                    />

                    {/* toggle */}
                    <div style={{ display:"flex", justifyContent:"center", padding:"3px 0" }}>
                      <motion.button
                        whileHover={{ scale:1.15, rotate:180 }}
                        whileTap={{ scale:0.9 }}
                        onClick={toggleDirection}
                        style={{
                          width: isMobile ? "32px":"36px",
                          height: isMobile ? "32px":"36px",
                          borderRadius:"10px",
                          background:"rgba(255,152,0,0.1)",
                          border:"1px solid rgba(255,152,0,0.25)",
                          color:"#ff9800", fontSize:"18px",
                          cursor:"pointer", outline:"none",
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}
                      >↕</motion.button>
                    </div>

                    {/* TO */}
                    <TokenBox
                      label="You Receive (est.)"
                      symbol={outputSymbol}
                      balance={outputBalance}
                      value={estimatedOutput ?? "0.0"}
                      isMobile={isMobile}
                      editable={false}
                    />
                  </div>

                  {/* SWAP BUTTON */}
                  <motion.button
                    whileHover={!loading ? { scale:1.02 } : {}}
                    whileTap={!loading ? { scale:0.98 } : {}}
                    onClick={executeSwap}
                    disabled={loading || !inputAmount || Number(inputAmount) <= 0}
                    style={{
                      width:"100%",
                      padding: isMobile ? "13px":"15px",
                      background: loading
                        ? "rgba(255,152,0,0.4)"
                        : "linear-gradient(135deg,#ff9800,#f57c00)",
                      border:"none", borderRadius:"12px",
                      color:"#000", fontWeight:800,
                      fontSize: isMobile ? "14px":"15px",
                      cursor: loading || !inputAmount ? "not-allowed":"pointer",
                      opacity: !inputAmount || Number(inputAmount) <= 0 ? 0.55 : 1,
                      boxShadow:"0 4px 15px rgba(255,152,0,0.25)",
                      transition:"all 0.2s ease",
                    }}
                  >
                    {loading
                      ? "⏳ Swapping…"
                      : `🔄 Swap ${inputSymbol} → ${outputSymbol}`}
                  </motion.button>

                  {/* TX SUCCESS */}
                  <AnimatePresence>
                    {txHash && (
                      <motion.div
                        initial={{ height:0, opacity:0 }}
                        animate={{ height:"auto", opacity:1 }}
                        exit={{ height:0, opacity:0 }}
                        style={{
                          display:"flex", alignItems:"flex-start", gap:"12px",
                          background:"rgba(0,200,100,0.1)",
                          border:"1px solid rgba(0,200,100,0.2)",
                          borderRadius:"12px",
                          padding: isMobile ? "12px 14px":"14px 16px",
                          overflow:"hidden",
                        }}
                      >
                        <span style={{ fontSize:"20px", flexShrink:0 }}>✅</span>
                        <div>
                          <div style={{
                            fontSize: isMobile ? "13px":"14px",
                            fontWeight:700, color:"#00e676", marginBottom:"2px",
                          }}>Transaction Confirmed!</div>
                          <div style={{
                            fontSize: isMobile ? "11px":"12px",
                            color:"#888", wordBreak:"break-all",
                          }}>
                            Tx: {txHash.slice(0,10)}…{txHash.slice(-8)}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* DETAILS */}
                  <div style={{
                    background:"rgba(255,255,255,0.02)",
                    border:"1px solid rgba(255,255,255,0.06)",
                    borderRadius:"12px",
                    padding: isMobile ? "10px 12px":"13px 15px",
                    display:"flex", flexDirection:"column",
                    gap: isMobile ? "5px":"7px",
                  }}>
                    {[
                      { label:"Fee Tier",           value:`${feePercent}%` },
                      { label:"Slippage Tolerance", value:"0.5%" },
                      {
                        label:"Min. Received",
                        value: estimatedOutput
                          ? `${(Number(estimatedOutput)*0.995).toFixed(6)} ${outputSymbol}`
                          : `— ${outputSymbol}`,
                      },
                      { label:"Route", value:`${inputSymbol} → ${outputSymbol}` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        display:"flex", justifyContent:"space-between",
                        alignItems:"center", gap:"8px",
                      }}>
                        <span style={{ fontSize: isMobile ? "11px":"12px", color:"#666" }}>
                          {label}
                        </span>
                        <span style={{
                          fontSize: isMobile ? "11px":"12px", color:"#aaa",
                          fontWeight:600, textAlign:"right", wordBreak:"break-all",
                        }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* WALLET STATUS */}
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{
                      width:"8px", height:"8px", borderRadius:"50%",
                      background:"#00e676", flexShrink:0,
                      boxShadow:"0 0 6px #00e676", display:"block",
                    }}/>
                    <span style={{
                      fontSize: isMobile ? "11px":"12px",
                      color:"#888", fontFamily:"monospace",
                    }}>
                      {account.slice(0,6)}…{account.slice(-4)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ══ FOOTER ══ */}
            <div style={{
              display:"flex", alignItems:"center", gap:"8px",
              padding: isMobile ? "7px 10px":"9px 13px",
              background:"rgba(255,255,255,0.02)",
              borderRadius:"10px", border:"1px solid rgba(255,255,255,0.05)",
              opacity:0.65,
            }}>
              <motion.span
                animate={{ scale:[1,1.4,1] }}
                transition={{ repeat:Infinity, duration:2 }}
                style={{
                  width:"6px", height:"6px", borderRadius:"50%",
                  background:"#ff9800", flexShrink:0, display:"block",
                }}
              />
              <span style={{ fontSize: isMobile ? "10px":"11px", color:"#666", lineHeight:1.4 }}>
                {isMobile
                  ? `Uniswap V3 · ${feePercent}% fee`
                  : `Powered by Uniswap V3 · Concentrated Liquidity · ${feePercent}% fee tier`}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function TokenBox({ label, symbol, balance, value, onChange, onMax, isMobile, editable }) {
  return (
    <div style={{
      background:"rgba(255,255,255,0.04)",
      border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:"12px",
      padding: isMobile ? "10px 12px":"13px 15px",
    }}>
      {/* top row */}
      <div style={{
        display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:"6px",
      }}>
        <span style={{
          fontSize: isMobile ? "10px":"11px", color:"#888",
          textTransform:"uppercase", letterSpacing:"1px",
        }}>{label}</span>
        <span style={{
          fontSize: isMobile ? "11px":"12px", fontWeight:700, color:"#ffb74d",
          background:"rgba(255,152,0,0.1)", padding:"2px 10px",
          borderRadius:"20px", border:"1px solid rgba(255,152,0,0.25)",
        }}>{symbol}</span>
      </div>

      {/* amount */}
      {editable ? (
        <input
          type="number"
          placeholder="0.0"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width:"100%", background:"transparent",
            border:"none", outline:"none", color:"#fff",
            fontSize: isMobile ? "20px":"22px",
            fontWeight:700, caretColor:"#ff9800",
          }}
        />
      ) : (
        <div style={{
          fontSize: isMobile ? "20px":"22px", fontWeight:700,
          color:"#ffcc80", minHeight: isMobile ? "28px":"33px",
          wordBreak:"break-all",
        }}>{value}</div>
      )}

      {/* bottom row */}
      <div style={{
        display:"flex", justifyContent:"space-between",
        alignItems:"center", marginTop:"6px",
      }}>
        <span style={{ fontSize: isMobile ? "11px":"12px", color:"#666" }}>
          Balance: {Number(balance).toFixed(4)}
        </span>
        {editable && onMax && (
          <motion.button
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            onClick={onMax}
            style={{
              padding:"3px 10px",
              background:"rgba(255,152,0,0.15)",
              border:"1px solid rgba(255,152,0,0.3)",
              borderRadius:"6px", color:"#ff9800",
              fontSize:"11px", fontWeight:800,
              cursor:"pointer", outline:"none", letterSpacing:"1px",
            }}
          >MAX</motion.button>
        )}
      </div>
    </div>
  );
}