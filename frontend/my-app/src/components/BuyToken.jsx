import { useEffect, useState } from "react";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const PAIR_ADDRESS   = "0x5C5F783b8013dF12a9aDf994c41A6891295b099c";
const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
const WETH = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
const MTK  = "0x19822e1B46e5a438a95691eF51B1c2a34C153468";

const pairABI = [
  {
    inputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
      { indexed: true, internalType: "address", name: "to", type: "address" },
    ],
    name: "Burn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
    ],
    name: "Mint",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0In",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1In",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0Out",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1Out",
        type: "uint256",
      },
      { indexed: true, internalType: "address", name: "to", type: "address" },
    ],
    name: "Swap",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint112",
        name: "reserve0",
        type: "uint112",
      },
      {
        indexed: false,
        internalType: "uint112",
        name: "reserve1",
        type: "uint112",
      },
    ],
    name: "Sync",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  { payable: true, stateMutability: "payable", type: "fallback" },
  {
    constant: true,
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "MINIMUM_LIQUIDITY",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "PERMIT_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ internalType: "address", name: "to", type: "address" }],
    name: "burn",
    outputs: [
      { internalType: "uint256", name: "amount0", type: "uint256" },
      { internalType: "uint256", name: "amount1", type: "uint256" },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "factory",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "getReserves",
    outputs: [
      { internalType: "uint112", name: "_reserve0", type: "uint112" },
      { internalType: "uint112", name: "_reserve1", type: "uint112" },
      { internalType: "uint32", name: "_blockTimestampLast", type: "uint32" },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { internalType: "address", name: "_token0", type: "address" },
      { internalType: "address", name: "_token1", type: "address" },
    ],
    name: "initialize",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "kLast",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ internalType: "address", name: "to", type: "address" }],
    name: "mint",
    outputs: [{ internalType: "uint256", name: "liquidity", type: "uint256" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "permit",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "price0CumulativeLast",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "price1CumulativeLast",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ internalType: "address", name: "to", type: "address" }],
    name: "skim",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { internalType: "uint256", name: "amount0Out", type: "uint256" },
      { internalType: "uint256", name: "amount1Out", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "swap",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [],
    name: "sync",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "token0",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "token1",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

const routerABI = [
  {
    inputs: [
      { internalType: "address", name: "_factory", type: "address" },
      { internalType: "address", name: "_WETH", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "WETH",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint256", name: "amountADesired", type: "uint256" },
      { internalType: "uint256", name: "amountBDesired", type: "uint256" },
      { internalType: "uint256", name: "amountAMin", type: "uint256" },
      { internalType: "uint256", name: "amountBMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "addLiquidity",
    outputs: [
      { internalType: "uint256", name: "amountA", type: "uint256" },
      { internalType: "uint256", name: "amountB", type: "uint256" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amountTokenDesired", type: "uint256" },
      { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
      { internalType: "uint256", name: "amountETHMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "addLiquidityETH",
    outputs: [
      { internalType: "uint256", name: "amountToken", type: "uint256" },
      { internalType: "uint256", name: "amountETH", type: "uint256" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "factory",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "reserveIn", type: "uint256" },
      { internalType: "uint256", name: "reserveOut", type: "uint256" },
    ],
    name: "getAmountIn",
    outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "reserveIn", type: "uint256" },
      { internalType: "uint256", name: "reserveOut", type: "uint256" },
    ],
    name: "getAmountOut",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsIn",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountA", type: "uint256" },
      { internalType: "uint256", name: "reserveA", type: "uint256" },
      { internalType: "uint256", name: "reserveB", type: "uint256" },
    ],
    name: "quote",
    outputs: [{ internalType: "uint256", name: "amountB", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "amountAMin", type: "uint256" },
      { internalType: "uint256", name: "amountBMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "removeLiquidity",
    outputs: [
      { internalType: "uint256", name: "amountA", type: "uint256" },
      { internalType: "uint256", name: "amountB", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
      { internalType: "uint256", name: "amountETHMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "removeLiquidityETH",
    outputs: [
      { internalType: "uint256", name: "amountToken", type: "uint256" },
      { internalType: "uint256", name: "amountETH", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
      { internalType: "uint256", name: "amountETHMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "removeLiquidityETHSupportingFeeOnTransferTokens",
    outputs: [{ internalType: "uint256", name: "amountETH", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
      { internalType: "uint256", name: "amountETHMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bool", name: "approveMax", type: "bool" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "removeLiquidityETHWithPermit",
    outputs: [
      { internalType: "uint256", name: "amountToken", type: "uint256" },
      { internalType: "uint256", name: "amountETH", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
      { internalType: "uint256", name: "amountETHMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bool", name: "approveMax", type: "bool" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens",
    outputs: [{ internalType: "uint256", name: "amountETH", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "amountAMin", type: "uint256" },
      { internalType: "uint256", name: "amountBMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bool", name: "approveMax", type: "bool" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "removeLiquidityWithPermit",
    outputs: [
      { internalType: "uint256", name: "amountA", type: "uint256" },
      { internalType: "uint256", name: "amountB", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapETHForExactTokens",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactETHForTokens",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactETHForTokensSupportingFeeOnTransferTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForETH",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForETHSupportingFeeOnTransferTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokens",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "amountInMax", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapTokensForExactETH",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "amountInMax", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapTokensForExactTokens",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];

export default function SwapUI({ onClose }) {
  const [price, setPrice]         = useState(0);
  const [ethAmount, setEthAmount] = useState("");
  const [mtkOut, setMtkOut]       = useState(null);
  const [account, setAccount]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [txHash, setTxHash]       = useState(null);

  // ── Auto-detect existing wallet connection ──
  useEffect(() => {
    const detectWallet = async () => {
      if (!window.ethereum) return;
      try {
        const provider  = new ethers.BrowserProvider(window.ethereum);
        const accounts  = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address ?? accounts[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    detectWallet();
  }, []);

  // ── Fetch price ──
  const getPrice = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // If provider throws (no metaMask), handle gracefully via toast later
      const pair     = new ethers.Contract(PAIR_ADDRESS, pairABI, provider);
      const [reserve0, reserve1] = await pair.getReserves();
      const mtk   = Number(ethers.formatEther(reserve0));
      const eth   = Number(ethers.formatEther(reserve1));
      
      // Avoid NaN division
      const calculatedPrice = mtk > 0 ? eth / mtk : 0;
      setPrice(calculatedPrice);
    } catch (err) {
      console.error(err);
      // Optional: toast.error("Failed to load price data");
    }
  };

  useEffect(() => { 
    getPrice(); 
    // Interval could be added here for live prices
  }, []);

  // ── Estimate MTK output as user types ──
  useEffect(() => {
    if (!ethAmount || isNaN(ethAmount) || Number(ethAmount) <= 0) {
      setMtkOut(null);
      return;
    }
    if (price > 0) {
      setMtkOut((Number(ethAmount) / price).toFixed(4));
    }
  }, [ethAmount, price]);

  // ── Connect Wallet ──
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        return toast.error("⚠️ MetaMask not found!");
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      toast.success("🔗 Wallet Connected!");
    } catch (err) {
      console.error(err);
      toast.error("❌ Connection Rejected");
    }
  };

  // ── Buy MTK ──
  const buyToken = async () => {
    try {
      if (!ethAmount || Number(ethAmount) <= 0) return toast.error("⚠️ Enter ETH amount");
      if (!account) return toast.error("⚠️ Connect wallet first");

      setLoading(true);
      setTxHash(null);

      // Trigger loading toast
      const promise = new Promise(async (resolve, reject) => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer   = await provider.getSigner();
          const router   = new ethers.Contract(ROUTER_ADDRESS, routerABI, signer);

          const tx = await router.swapExactETHForTokens(
            0, 
            [WETH, MTK], 
            account, 
            Math.floor(Date.now() / 1000) + 600, 
            { value: ethers.parseEther(String(ethAmount)) }
          );

          const receipt = await tx.wait();
          resolve(receipt.hash);
        } catch (err) {
          reject(err);
        } finally {
          setLoading(false);
        }
      });

      toast.promise(promise, {
        loading: "⏳ Confirming Swap...",
        success: (hash) => {
          setTxHash(hash);
          setEthAmount("");
          setMtkOut(null);
          getPrice(); // Refresh prices
          return "✅ Swap Successful!";
        },
        error: (err) => {
          return err.reason || "Swap failed ❌";
        }
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Variants for Framer Motion ──
  const containerVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: 50, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.1 } }
  };

  return (
    <>
      <Toaster position="top-center" gutter={12} />
      
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        style={styles.wrapper}
      >
        {/* HEADER */}
        <div style={styles.header}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span style={styles.headerIcon}>🔄</span>
            <h2 style={styles.headerTitle}>Swap MTK</h2>
          </motion.div>
          
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            style={styles.closeBtn}
            type="button"
          >
            ✕
          </motion.button>
        </div>

        {/* PRICE CARD */}
        <motion.div 
          variants={itemVariants}
          custom={true} 
          style={styles.priceCard}
        >
          <div style={styles.priceRow}>
            <div style={styles.priceItem}>
              <span style={styles.priceLabel}>Pair</span>
              <span style={styles.priceValue}>ETH / MTK</span>
            </div>
            <div style={styles.priceDivider} />
            <div style={styles.priceItem}>
              <span style={styles.priceLabel}>Current Price</span>
              <span style={styles.priceValue}>
                {price > 0 ? `${(1/price).toFixed(6)} MTK` : "Loading..."}
              </span>
            </div>
            <div style={styles.priceDivider} />
            <div style={styles.priceItem}>
              <span style={styles.priceLabel}>Network</span>
              <span style={styles.priceValue}>Sepolia</span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode='wait'>
          {!account ? (
            // ── NOT CONNECTED STATE ──
            <motion.div
              key="connect"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={styles.connectBox}
            >
              <motion.span 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={styles.connectIcon}
              >
                🔗
              </motion.span>
              <p style={styles.connectText}>
                Connect your wallet to swap ETH for MTK tokens securely
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectWallet} 
                style={styles.connectBtn}
              >
                🦊 Connect MetaMask
              </motion.button>
            </motion.div>
          ) : (
            // ── SWAP STATE ──
            <motion.div
              key="swap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* ── SWAP BOX ── */}
              <div style={styles.swapBox}>

                {/* FROM */}
                <div style={styles.swapField}>
                  <div style={styles.swapFieldTop}>
                    <span style={styles.swapFieldLabel}>You Pay</span>
                    <span style={styles.swapFieldToken}>ETH</span>
                  </div>
                  <motion.input
                    whileFocus={{ borderColor: "#ff9800", boxShadow: "0 0 8px rgba(255,152,0,0.3)" }}
                    type="number"
                    placeholder="0.0"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    style={styles.swapInput}
                  />
                </div>

                {/* ARROW */}
                <div style={styles.swapArrow}>↓</div>

                {/* TO */}
                <div style={styles.swapField}>
                  <div style={styles.swapFieldTop}>
                    <span style={styles.swapFieldLabel}>You Receive (est.)</span>
                    <span style={styles.swapFieldToken}>MTK</span>
                  </div>
                  <div style={styles.swapOutput}>
                    {mtkOut ?? "0.0"}
                  </div>
                </div>
              </div>

              {/* WALLET INFO */}
              <div style={styles.walletInfo}>
                <motion.span 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  style={styles.walletDot} 
                />
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  style={styles.walletText}
                >
                  {account.slice(0, 6)}...{account.slice(-4)}
                </motion.span>
              </div>

              {/* SWAP BUTTON */}
              <motion.button
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                onClick={buyToken}
                disabled={loading || !ethAmount}
                style={{
                  ...styles.swapBtn,
                  opacity: loading || !ethAmount ? 0.7 : 1,
                  cursor: loading || !ethAmount ? "not-allowed" : "pointer",
                  filter: loading ? "grayscale(0.5)" : "none"
                }}
              >
                {loading ? (
                  <span role="status" aria-label="swapping">⏳ Swapping...</span>
                ) : (
                  <span>🔄 Swap ETH → MTK</span>
                )}
              </motion.button>

              {/* TX SUCCESS BOX */}
              <AnimatePresence>
                {txHash && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={styles.successBox}
                  >
                    <span style={styles.successIcon}>✅</span>
                    <div>
                      <div style={styles.successTitle}>Transaction Confirmed!</div>
                      <div style={styles.successHash}>
                        Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── INFO FOOTER ── */}
        <div style={styles.infoFooter}>
          <motion.span 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            style={styles.infoDot} 
          />
          <span style={styles.infoText}>
            Powered by Uniswap V2 • 0.3% swap fee
          </span>
        </div>
      </motion.div>
    </>
  );
}

// ==============================
// 🎨 STYLES
// ==============================
const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "400px",
    margin: "0 auto",
    background: "rgba(20, 20, 20, 0.9)",
    backdropFilter: "blur(10px)",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "white",
    fontFamily: "'Inter', sans-serif",
  },

  // HEADER
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerIcon: { fontSize: "24px" },
  headerTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffb74d",
    margin: 0,
  },
  closeBtn: {
    padding: "6px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#aaa",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    outline: "none",
  },

  // PRICE CARD
  priceCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "16px 20px",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  priceItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  priceLabel: {
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  priceValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#ffb74d",
  },
  priceDivider: {
    width: "1px",
    height: "30px",
    background: "rgba(255,255,255,0.07)",
  },

  // NOT CONNECTED
  connectBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "32px 20px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  connectIcon: { fontSize: "36px" },
  connectText: {
    fontSize: "14px",
    color: "#888",
    margin: 0,
    maxWidth: "260px",
    lineHeight: "1.5",
  },
  connectBtn: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #ff9800, #f57c00)",
    border: "none",
    borderRadius: "12px",
    color: "#000",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(255, 152, 0, 0.3)",
  },

  // SWAP BOX
  swapBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  swapField: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "14px 16px",
  },
  swapFieldTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  swapFieldLabel: {
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  swapFieldToken: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#ffb74d",
    background: "rgba(255,152,0,0.1)",
    padding: "2px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255,152,0,0.25)",
  },
  swapInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "22px",
    fontWeight: "700",
    boxSizing: "border-box",
    caretColor: "#ff9800",
  },
  swapArrow: {
    textAlign: "center",
    fontSize: "20px",
    color: "#555",
    padding: "4px 0",
  },
  swapOutput: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffcc80",
    minHeight: "33px",
  },

  // WALLET INFO
  walletInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "10px",
    marginBottom: "5px",
  },
  walletDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#00e676",
    flexShrink: 0,
    boxShadow: "0 0 5px #00e676",
  },
  walletText: {
    fontSize: "12px",
    color: "#888",
    fontFamily: "monospace",
  },

  // SWAP BUTTON
  swapBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #ff9800, #f57c00)",
    border: "none",
    borderRadius: "12px",
    color: "#000",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(255, 152, 0, 0.2)",
    transition: "all 0.2s ease",
  },

  // SUCCESS BOX
  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(0,200,100,0.1)",
    border: "1px solid rgba(0,200,100,0.2)",
    borderRadius: "12px",
    padding: "14px 16px",
    marginTop: "12px",
  },
  successIcon: { fontSize: "22px" },
  successTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#00e676",
    marginBottom: "2px",
  },
  successHash: {
    fontSize: "12px",
    color: "#888",
    wordBreak: "break-all",
  },

  // INFO FOOTER
  infoFooter: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.05)",
    opacity: 0.6,
  },
  infoDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#ff9800",
    flexShrink: 0,
  },
  infoText: {
    fontSize: "12px",
    color: "#666",
  },
};