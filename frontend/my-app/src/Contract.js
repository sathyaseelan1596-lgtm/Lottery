import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0xf951de8724aeea9b3a9d8efb15c7c1158c6205d5";

export const ABI = [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "_cakeTokenAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_randomGeneratorAddress",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "MAX_LENGTH_LOTTERY",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "MAX_TREASURY_FEE",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "MIN_DISCOUNT_DIVISOR",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "MIN_LENGTH_LOTTERY",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "buyTickets",
            "inputs": [
                {
                    "name": "_lotteryId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_ticketNumbers",
                    "type": "uint32[]",
                    "internalType": "uint32[]"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "cakeToken",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "contract IERC20"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "calculateTotalPriceForBulkTickets",
            "inputs": [
                {
                    "name": "_discountDivisor",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_priceTicket",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_numberTickets",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "pure"
        },
        {
            "type": "function",
            "name": "changeRandomGenerator",
            "inputs": [
                {
                    "name": "_randomGeneratorAddress",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "claimTickets",
            "inputs": [
                {
                    "name": "_lotteryId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_ticketIds",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                },
                {
                    "name": "_brackets",
                    "type": "uint32[]",
                    "internalType": "uint32[]"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "closeLottery",
            "inputs": [
                {
                    "name": "_lotteryId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "currentLotteryId",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "currentTicketId",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "drawFinalNumberAndMakeLotteryClaimable",
            "inputs": [
                {
                    "name": "_lotteryId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_autoInjection",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "injectFunds",
            "inputs": [
                {
                    "name": "_lotteryId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_amount",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "injectorAddress",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "maxNumberTicketsPerBuyOrClaim",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "maxPriceTicketInCake",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "minPriceTicketInCake",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "operatorAddress",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "owner",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "pendingInjectionNextLottery",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "randomGenerator",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "contract IRandomNumberGenerator"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "recoverWrongTokens",
            "inputs": [
                {
                    "name": "_tokenAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_tokenAmount",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "renounceOwnership",
            "inputs": [],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setMaxNumberTicketsPerBuy",
            "inputs": [
                {
                    "name": "_maxNumberTicketsPerBuy",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setMinAndMaxTicketPriceInCake",
            "inputs": [
                {
                    "name": "_minPriceTicketInCake",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_maxPriceTicketInCake",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setOperatorAndTreasuryAndInjectorAddresses",
            "inputs": [
                {
                    "name": "_operatorAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_treasuryAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_injectorAddress",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "startLottery",
            "inputs": [
                {
                    "name": "_endTime",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_priceTicketInCake",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_discountDivisor",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_rewardsBreakdown",
                    "type": "uint256[6]",
                    "internalType": "uint256[6]"
                },
                {
                    "name": "_treasuryFee",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "transferOwnership",
            "inputs": [
                {
                    "name": "newOwner",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "treasuryAddress",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "viewCurrentLotteryId",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "viewLottery",
            "inputs": [
                {
                    "name": "_lotteryId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "tuple",
                    "internalType": "struct PancakeSwapLottery.Lottery",
                    "components": [
                        {
                            "name": "status",
                            "type": "uint8",
                            "internalType": "enum PancakeSwapLottery.Status"
                        },
                        {
                            "name": "startTime",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "endTime",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "priceTicketInCake",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "discountDivisor",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "rewardsBreakdown",
                            "type": "uint256[6]",
                            "internalType": "uint256[6]"
                        },
                        {
                            "name": "treasuryFee",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "cakePerBracket",
                            "type": "uint256[6]",
                            "internalType": "uint256[6]"
                        },
                        {
                            "name": "countWinnersPerBracket",
                            "type": "uint256[6]",
                            "internalType": "uint256[6]"
                        },
                        {
                            "name": "firstTicketId",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "firstTicketIdNextLottery",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "amountCollectedInCake",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "finalNumber",
                            "type": "uint32",
                            "internalType": "uint32"
                        }
                    ]
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "viewNumbersAndStatusesForTicketIds",
            "inputs": [
                {
                    "name": "_ticketIds",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint32[]",
                    "internalType": "uint32[]"
                },
                {
                    "name": "",
                    "type": "bool[]",
                    "internalType": "bool[]"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "viewRewardsForTicketId",
            "inputs": [
                {
                    "name": "_lotteryId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_ticketId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_bracket",
                    "type": "uint32",
                    "internalType": "uint32"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "viewUserInfoForLotteryId",
            "inputs": [
                {
                    "name": "_user",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_lotteryId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_cursor",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_size",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                },
                {
                    "name": "",
                    "type": "uint32[]",
                    "internalType": "uint32[]"
                },
                {
                    "name": "",
                    "type": "bool[]",
                    "internalType": "bool[]"
                },
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "event",
            "name": "AdminTokenRecovery",
            "inputs": [
                {
                    "name": "token",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "amount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "LotteryClose",
            "inputs": [
                {
                    "name": "lotteryId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "firstTicketIdNextLottery",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "LotteryInjection",
            "inputs": [
                {
                    "name": "lotteryId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "injectedAmount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "LotteryNumberDrawn",
            "inputs": [
                {
                    "name": "lotteryId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "finalNumber",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "countWinningTickets",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "LotteryOpen",
            "inputs": [
                {
                    "name": "lotteryId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "startTime",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "endTime",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "priceTicketInCake",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "firstTicketId",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "injectedAmount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "NewOperatorAndTreasuryAndInjectorAddresses",
            "inputs": [
                {
                    "name": "operator",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "treasury",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "injector",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "NewRandomGenerator",
            "inputs": [
                {
                    "name": "randomGenerator",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "OwnershipTransferred",
            "inputs": [
                {
                    "name": "previousOwner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "newOwner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "TicketsClaim",
            "inputs": [
                {
                    "name": "claimer",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "amount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "lotteryId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "numberTickets",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "TicketsPurchase",
            "inputs": [
                {
                    "name": "buyer",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "lotteryId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "numberTickets",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "OwnableInvalidOwner",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "OwnableUnauthorizedAccount",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ReentrancyGuardReentrantCall",
            "inputs": []
        },
        {
            "type": "error",
            "name": "SafeERC20FailedOperation",
            "inputs": [
                {
                    "name": "token",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        }
    ];

export const RNG_ADDRESS = "0xe993de12faafda39ee3a604f13c33d8b0441b1b6";
export const RNG_ABI = [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "_vrfCoordinator",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_linkToken",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "LINK",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "contract IERC20"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "fee",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getRandomNumber",
            "inputs": [],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "keyHash",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "latestLotteryId",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "latestRequestId",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "owner",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "pancakeSwapLottery",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "randomResult",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint32",
                    "internalType": "uint32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "rawFulfillRandomness",
            "inputs": [
                {
                    "name": "requestId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "randomness",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "renounceOwnership",
            "inputs": [],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setFee",
            "inputs": [
                {
                    "name": "_fee",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setKeyHash",
            "inputs": [
                {
                    "name": "_keyHash",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setLotteryAddress",
            "inputs": [
                {
                    "name": "_pancakeSwapLottery",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "transferOwnership",
            "inputs": [
                {
                    "name": "newOwner",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "viewLatestLotteryId",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "viewRandomResult",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint32",
                    "internalType": "uint32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "vrfCoordinator",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "withdrawTokens",
            "inputs": [
                {
                    "name": "_tokenAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_tokenAmount",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "event",
            "name": "OwnershipTransferred",
            "inputs": [
                {
                    "name": "previousOwner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "newOwner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "OwnableInvalidOwner",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "OwnableUnauthorizedAccount",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "SafeERC20FailedOperation",
            "inputs": [
                {
                    "name": "token",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        }
    ];

export const VRF_MOCK_ADDRESS = "0x44127c9626a45cf0bc2163d8d2e27878f2522f4c";
export const VRF_MOCK_ABI = [
        {
            "type": "function",
            "name": "fulfill",
            "inputs": [
                {
                    "name": "consumer",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "requestId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "requestRandomness",
            "inputs": [
                {
                    "name": "",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "requestId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "stateMutability": "nonpayable"
        }
    ];