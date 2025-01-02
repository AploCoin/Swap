export const ERC20_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "address", "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "recipient", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "sender", "type": "address" },
            { "internalType": "address", "name": "recipient", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "transferFrom",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export const swapperABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "wethAddress", "type": "address" },
            { "internalType": "uint256", "name": "initialMinimumLiquidity", "type": "uint256" },
            { "internalType": "uint256", "name": "initialMaxSwapFee", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "newMinimumLiquidity", "type": "uint256" }],
        "name": "setMinimumLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "newMaxSwapFee", "type": "uint256" }],
        "name": "setMaxSwapFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "token0", "type": "address" },
            { "internalType": "address", "name": "token1", "type": "address" },
            { "internalType": "uint256", "name": "amount0", "type": "uint256" },
            { "internalType": "uint256", "name": "amount1", "type": "uint256" },
            { "internalType": "uint256", "name": "swapFee", "type": "uint256" }
        ],
        "name": "createPool",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "poolId", "type": "bytes32" },
            { "internalType": "uint256", "name": "newSwapFee", "type": "uint256" }
        ],
        "name": "setPoolSwapFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "poolId", "type": "bytes32" },
            { "internalType": "uint256", "name": "amount0", "type": "uint256" },
            { "internalType": "uint256", "name": "amount1", "type": "uint256" }
        ],
        "name": "addLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "poolId", "type": "bytes32" },
            { "internalType": "uint256", "name": "amount0", "type": "uint256" },
            { "internalType": "uint256", "name": "amount1", "type": "uint256" }
        ],
        "name": "removeLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "poolId", "type": "bytes32" },
            { "internalType": "address", "name": "tokenIn", "type": "address" },
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
        ],
        "name": "swap",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "inputAmount", "type": "uint256" },
            { "internalType": "uint256", "name": "inputReserve", "type": "uint256" },
            { "internalType": "uint256", "name": "outputReserve", "type": "uint256" },
            { "internalType": "uint256", "name": "swapFee", "type": "uint256" }
        ],
        "name": "getSwapAmount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "token0", "type": "address" },
            { "internalType": "address", "name": "token1", "type": "address" }
        ],
        "name": "getPoolId",
        "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "getPoolsByOwner",
        "outputs": [{ "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    },
    {
        "inputs": [{ "internalType": "bytes32", "name": "poolId", "type": "bytes32" }],
        "name": "pools",
        "outputs": [
            { "internalType": "uint256", "name": "token0Reserve", "type": "uint256" },
            { "internalType": "uint256", "name": "token1Reserve", "type": "uint256" },
            { "internalType": "address", "name": "token0", "type": "address" },
            { "internalType": "address", "name": "token1", "type": "address" },
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "uint256", "name": "swapFee", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];