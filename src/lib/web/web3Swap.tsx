"use client";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { ERC20_ABI, swapperABI } from "./abi";
import { useEthersSigner } from "@/hooks/useSigner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cookies } from 'next/headers';

const DEFAULT_TOKENS = {
  MANUAL: {
    address: "",
    name: "Enter manually"
  },
  WAPLO: {
    address: "0xd3F708a6aAfEDD0845928215E74a0f59cAC2D1f0",
    name: "WAPLO"
  },
  APLO: {
    address: "0x0000000000000000000000000000000000001235",
    name: "APLO"
  },
  GAPLO: {
    address: "0x0000000000000000000000000000000000001234",
    name: "GAPLO"
  }
};

interface SwapHistory {
  token0: string;
  token1: string;
  amount: string;
  token0Name: string;
  token1Name: string;
  timestamp: number;
  contractAddress: string;
  outputAmount?: string;
}

// Вспомогательная функция для безопасного отображения адреса
const formatAddress = (address: string | undefined): string => {
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Добавляем функцию для определения токена из списка
const getTokenKeyByAddress = (address: string): string => {
  const entry = Object.entries(DEFAULT_TOKENS).find(([_, token]) => 
    token.address.toLowerCase() === address.toLowerCase()
  );
  return entry ? entry[0] : 'MANUAL';
};

export default function Swap() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const signer = useEthersSigner();
  const { address: userAccount } = useAccount();
  const [contractAddress, setContractAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [token0, setToken0] = useState("");
  const [token1, setToken1] = useState("");
  const [token0Name, setToken0Name] = useState("");
  const [token1Name, setToken1Name] = useState("");
  const [estimatedOutput, setEstimatedOutput] = useState<string | null>(null);
  const [tokenPrices, setTokenPrices] = useState<{ priceToken0: number; priceToken1: number } | null>(null);
  const [swapHistory, setSwapHistory] = useState<SwapHistory[]>([]);
  const [poolExists, setPoolExists] = useState<boolean | null>(null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [token0Balance, setToken0Balance] = useState<string | null>(null);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);
  const [contractHistory, setContractHistory] = useState<SwapHistory[]>([]);
  const [token0Selected, setToken0Selected] = useState('MANUAL');
  const [token1Selected, setToken1Selected] = useState('MANUAL');

  const getTokenName = async (tokenAddress: string): Promise<string> => {
    if (!signer || !ethers.isAddress(tokenAddress)) return "";
    
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      return await tokenContract.name();
    } catch (error) {
      console.error("Error getting token name:", error);
      return tokenAddress.slice(0, 6) + "..." + tokenAddress.slice(-4);
    }
  };

  const loadTokenNames = async () => {
    if (token0) {
      const name = await getTokenName(token0);
      setToken0Name(name);
    }
    if (token1) {
      const name = await getTokenName(token1);
      setToken1Name(name);
    }
  };

  const loadSwapHistory = () => {
    const history = localStorage.getItem('swapHistory');
    if (history) {
      setSwapHistory(JSON.parse(history));
    }
  };

  const saveToLocalStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const loadFromLocalStorage = (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return null;
    }
  };

  const saveToHistory = async (outputAmount?: string) => {
    const newSwap: SwapHistory = {
      token0,
      token1,
      amount,
      token0Name,
      token1Name,
      timestamp: Date.now(),
      contractAddress,
      outputAmount
    };
    
    const updatedHistory = [newSwap, ...swapHistory].slice(0, 5);
    setSwapHistory(updatedHistory);
    saveToLocalStorage('swapHistory', updatedHistory);
  };

  const loadFromHistory = (historyItem: SwapHistory) => {
    setToken0(historyItem.token0);
    setToken1(historyItem.token1);
    setAmount(historyItem.amount);
    setContractAddress(historyItem.contractAddress);
    // Определяем токены из списка
    setToken0Selected(getTokenKeyByAddress(historyItem.token0));
    setToken1Selected(getTokenKeyByAddress(historyItem.token1));
    initializeContract(historyItem.contractAddress);
  };

  const loadContractHistory = async () => {
    if (!contract || !userAccount) return;

    try {
      // Получаем все пулы пользователя
      const userPools = await contract.getPoolsByOwner(userAccount);
      const history: SwapHistory[] = [];

      // Для каждого пула получаем информацию
      for (const poolId of userPools) {
        const pool = await contract.pools(poolId);
        if (pool) {
          history.push({
            token0: pool.token0,
            token1: pool.token1,
            amount: "0", // Здесь можно добавить логику для получения последней суммы обмена
            token0Name: await getTokenName(pool.token0),
            token1Name: await getTokenName(pool.token1),
            timestamp: Date.now(),
            contractAddress
          });
        }
      }

      setContractHistory(history);
    } catch (error) {
      console.error("Error loading contract history:", error);
    }
  };

  const handleInitializeContract = () => {
    if (!contractAddress) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid contract address.",
      });
      return;
    }
    try {
      initializeContract(contractAddress);
      toast({
        title: "Success",
        description: "Contract initialized successfully!",
      });
    } catch (error) {
      console.error("Contract initialization failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Contract initialization failed.",
        action: (
          <ToastAction onClick={handleInitializeContract} altText="Try again">
            Try again
          </ToastAction>
        ),
      });
    }
  };

  const handleSwap = async () => {
    if (insufficientBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You need ${amount} ${token0Name || token0} but have only ${token0Balance}`,
      });
      return;
    }

    try {
      await swapTokens(token0, token1, amount, contractAddress);
      await saveToHistory(estimatedOutput || undefined);
      toast({
        title: "Success",
        description: "Swap completed successfully!",
      });
    } catch (error) {
      console.error("Swap failed:", error);
      toast({
        variant: "destructive",
        title: "Swap Failed",
        description: "There was a problem with your swap request.",
        action: (
          <ToastAction onClick={handleSwap} altText="Try again">
            Try again
          </ToastAction>
        ),
      });
    }
  };

  const initializeContract = (address: string): void => {
    if (!signer) throw new Error("Signer is not initialized");

    try {
      // Check if the address is a valid Ethereum address
      if (!ethers.isAddress(address)) {
        throw new Error("Invalid contract address format");
      }

      setContract(new ethers.Contract(address, swapperABI, signer));
    } catch (error: any) {
      throw error;
    }
  };

  const getPoolId = async (token0: string, token1: string): Promise<string> => {
    if (!contract) throw new Error("Contract is not initialized");
    try {
      const poolId = await contract.getPoolId(token0, token1);
      return poolId;
    } catch (error) {
      console.error("Error getting pool ID:", error);
      throw error;
    }
  };

  const approveToken = async (
    tokenAddress: string,
    amount: string,
    contractAddress: string
  ): Promise<void> => {
    if (!signer || !userAccount) {
      throw new Error("Signer or user account is not initialized");
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

    try {
      const allowance = await tokenContract.allowance(
        userAccount,
        contractAddress
      );
      if (BigInt(allowance) < ethers.parseUnits(amount, 18)) {
        const tx = await tokenContract.approve(
          contractAddress,
          ethers.parseUnits(amount, 18)
        );
        await tx.wait();
        console.log("Token approved");
      } else {
        console.log("Allowance already sufficient");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      throw error;
    }
  };

  const swapTokens = async (
    token0: string,
    token1: string,
    amountIn: string,
    contractAddress: string
  ): Promise<void> => {
    if (!contract) throw new Error("Contract is not initialized");

    if (!ethers.isAddress(token0) || !ethers.isAddress(token1)) {
      throw new Error("Invalid token addresses");
    }

    if (parseFloat(amountIn) <= 0) {
      throw new Error("Invalid amount");
    }

    const poolId = await getPoolId(token0, token1);
    if (!poolId) {
      throw new Error("Pool does not exist!");
    }

    console.log("Swapping tokens in pool:", poolId);

    await approveToken(token0, amountIn, contractAddress);

    try {
      const tx = await contract.swap(
        poolId,
        token0,
        ethers.parseUnits(amountIn, 18)
      );
      await tx.wait();
      console.log(`Successfully swapped ${amountIn} of ${token0}`);
    } catch (error) {
      console.error("Swap failed:", error);
      throw error;
    }
  };

  const getTokenPriceInPool = async (
    token0: string,
    token1: string
  ): Promise<{ priceToken0: number; priceToken1: number }> => {
    if (!contract) throw new Error("Contract is not initialized");

    const poolId = await contract.getPoolId(token0, token1);
    const pool = await contract.pools(poolId);

    const token0Reserve = ethers.formatUnits(pool.token0Reserve, 18);
    const token1Reserve = ethers.formatUnits(pool.token1Reserve, 18);

    const priceToken0 = parseFloat(token1Reserve) / parseFloat(token0Reserve);
    const priceToken1 = parseFloat(token0Reserve) / parseFloat(token1Reserve);

    return {
      priceToken0,
      priceToken1,
    };
  };

  const checkPoolExists = async (token0: string, token1: string): Promise<boolean> => {
    if (!contract) return false;
    try {
      const poolId = await contract.getPoolId(token0, token1);
      const pool = await contract.pools(poolId);
      return pool.token0 !== ethers.ZeroAddress;
    } catch (error) {
      console.error("Error checking pool:", error);
      return false;
    }
  };

  useEffect(() => {
    const checkPool = async () => {
      if (token0 && token1 && contract) {
        try {
          const exists = await checkPoolExists(token0, token1);
          setPoolExists(exists);
          setPoolError(exists ? null : "Pool does not exist for this token pair");
        } catch (error) {
          setPoolExists(false);
          setPoolError("Error checking pool status");
        }
      } else {
        setPoolExists(null);
        setPoolError(null);
      }
    };
    checkPool();
  }, [token0, token1, contract]);

  const calculateSwapAmount = async (
    token1: string,
    token2: string,
    amountIn: string
  ): Promise<string> => {
    if (!contract) throw new Error("Contract is not initialized");
    if (!poolExists) throw new Error("Pool does not exist for this token pair");

    try {
      const poolId = await contract.getPoolId(token1, token2);
      const pool = await contract.pools(poolId);

      let inputReserve: any;
      let outputReserve: any;

      if (pool.token0.toLowerCase() === token1.toLowerCase()) {
        inputReserve = pool.token0Reserve;
        outputReserve = pool.token1Reserve;
      } else if (pool.token1.toLowerCase() === token1.toLowerCase()) {
        inputReserve = pool.token1Reserve;
        outputReserve = pool.token0Reserve;
      } else {
        throw new Error("Token pair not found in the pool");
      }

      const amountOut = await contract.getSwapAmount(
        ethers.parseUnits(amountIn, 18),
        inputReserve,
        outputReserve,
        pool.swapFee
      );

      return ethers.formatUnits(amountOut, 18);
    } catch (error) {
      console.error("Error in calculateSwapAmount:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Failed to calculate swap amount");
    }
  };

  useEffect(() => {
    const updateEstimatedOutput = async () => {
      if (amount && token0 && token1 && contract) {
        try {
          const output = await calculateSwapAmount(token0, token1, amount);
          setEstimatedOutput(output);
        } catch (error) {
          console.error("Error calculating swap amount:", error);
          setEstimatedOutput(null);
        }
      } else {
        setEstimatedOutput(null);
      }
    };
    updateEstimatedOutput();
  }, [amount, token0, token1, contract]);

  useEffect(() => {
    const updatePrices = async () => {
      if (token0 && token1 && contract) {
        try {
          const prices = await getTokenPriceInPool(token0, token1);
          setTokenPrices(prices);
        } catch (error) {
          console.error("Error calculating token prices:", error);
          setTokenPrices(null);
        }
      }
    };
    updatePrices();
  }, [token0, token1, contract]);

  useEffect(() => {
    loadTokenNames();
  }, [token0, token1]);

  useEffect(() => {
    loadSwapHistory();
  }, []);

  const getTokenBalance = async (tokenAddress: string): Promise<string> => {
    if (!signer || !userAccount || !ethers.isAddress(tokenAddress)) return "0";
    
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const balance = await tokenContract.balanceOf(userAccount);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      console.error("Error getting token balance:", error);
      return "0";
    }
  };

  const checkBalance = async () => {
    if (token0 && amount) {
      const balance = await getTokenBalance(token0);
      setToken0Balance(balance);
      setInsufficientBalance(parseFloat(balance) < parseFloat(amount));
    } else {
      setToken0Balance(null);
      setInsufficientBalance(false);
    }
  };

  useEffect(() => {
    checkBalance();
  }, [token0, amount, userAccount]);

  // Добавляем функцию очистки истории
  const clearHistory = () => {
    setSwapHistory([]);
    saveToLocalStorage('swapHistory', []);
    toast({
      title: "Success",
      description: "History cleared successfully!",
    });
  };

  return (
    <TooltipProvider>
      <div style={{ marginBottom: "1rem" }}>
        <Label htmlFor="contractAddress">Contract Address:</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              type="text"
              id="contractAddress"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Enter Contract Address"
              style={{ marginBottom: "0.5rem" }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Enter the smart contract address for token swapping</p>
          </TooltipContent>
        </Tooltip>
        <div className="flex gap-2">
          <Button onClick={handleInitializeContract} className="mt-2">
            Initialize Contract
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-2" onClick={loadContractHistory}>
                View History
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>Swap History</DialogTitle>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={clearHistory}
                  >
                    Clear History
                  </Button>
                </div>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <h4 className="mb-2 font-medium">Local History</h4>
                  {swapHistory.map((item, index) => (
                    <div
                      key={index}
                      className="mb-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-full">
                          <p>{item.token0Name || formatAddress(item.token0)} → {item.token1Name || formatAddress(item.token1)}</p>
                          <p className="text-sm text-gray-600">Amount: {item.amount}</p>
                          {item.outputAmount && (
                            <p className="text-sm text-gray-600">Output: {item.outputAmount}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadFromHistory(item);
                            setShowHistory(false);
                          }}
                        >
                          Use
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Contract: {formatAddress(item.contractAddress)}</p>
                        <p>Token0: {formatAddress(item.token0)}</p>
                        <p>Token1: {formatAddress(item.token1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Contract History</h4>
                  {contractHistory.map((item, index) => (
                    <div
                      key={index}
                      className="mb-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                      onClick={() => {
                        loadFromHistory(item);
                        setShowHistory(false);
                      }}
                    >
                      <p>{item.token0Name} → {item.token1Name}</p>
                      <Button size="sm" className="mt-1">Use</Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Label htmlFor="token0">From Token:</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-4">
              <Select 
                value={token0Selected}
                onValueChange={(value) => {
                  setToken0Selected(value);
                  if (value === 'MANUAL') {
                    setToken0("");
                  } else {
                    setToken0(DEFAULT_TOKENS[value as keyof typeof DEFAULT_TOKENS].address);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select token or enter address" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEFAULT_TOKENS).map(([key, token]) => (
                    <SelectItem key={key} value={key}>
                      {token.name} {key !== 'MANUAL' && `(${token.address.slice(0, 6)}...${token.address.slice(-4)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {token0Selected === 'MANUAL' && (
                <Input
                  type="text"
                  id="token0"
                  value={token0}
                  onChange={(e) => {
                    setToken0(e.target.value);
                    setToken0Selected('MANUAL');
                  }}
                  placeholder="Enter token address manually"
                  className="mt-4"
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select from predefined tokens or enter custom token address</p>
          </TooltipContent>
        </Tooltip>
        {token0Name && (
          <div className="text-sm mt-1">
            <p className="text-gray-600">Token: {token0Name}</p>
            {token0Balance && (
              <p className={`${insufficientBalance ? 'text-red-500' : 'text-gray-600'}`}>
                Balance: {parseFloat(token0Balance).toFixed(6)} {token0Name}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Label htmlFor="token1">To Token:</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-4">
              <Select 
                value={token1Selected}
                onValueChange={(value) => {
                  setToken1Selected(value);
                  if (value === 'MANUAL') {
                    setToken1("");
                  } else {
                    setToken1(DEFAULT_TOKENS[value as keyof typeof DEFAULT_TOKENS].address);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select token or enter address" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEFAULT_TOKENS).map(([key, token]) => (
                    <SelectItem key={key} value={key}>
                      {token.name} {key !== 'MANUAL' && `(${token.address.slice(0, 6)}...${token.address.slice(-4)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {token1Selected === 'MANUAL' && (
                <Input
                  type="text"
                  id="token1"
                  value={token1}
                  onChange={(e) => {
                    setToken1(e.target.value);
                    setToken1Selected('MANUAL');
                  }}
                  placeholder="Enter token address manually"
                  className="mt-4"
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select from predefined tokens or enter custom token address</p>
          </TooltipContent>
        </Tooltip>
        {token1Name && <p className="text-sm text-gray-600 mt-1">Token: {token1Name}</p>}
      </div>

      {token0 && token1 && (
        <div className="mb-4">
          {poolExists === false && (
            <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
              <p className="font-medium">Pool Status: Not Found</p>
              <p className="text-sm mt-1">This token pair doesn't have a liquidity pool yet.</p>
              <p className="text-sm mt-1">You can create a new pool for this pair using the contract.</p>
            </div>
          )}
          {poolError && (
            <div className="p-4 border rounded bg-red-50 text-red-800">
              <p className="font-medium">Error:</p>
              <p className="text-sm mt-1">{poolError}</p>
            </div>
          )}
        </div>
      )}

      {poolExists && tokenPrices && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="font-bold mb-2">Current Exchange Rates:</h3>
          <p>1 {token0Name || token0.slice(0, 6)} = {tokenPrices.priceToken0.toFixed(6)} {token1Name || token1.slice(0, 6)}</p>
          <p>1 {token1Name || token1.slice(0, 6)} = {tokenPrices.priceToken1.toFixed(6)} {token0Name || token0.slice(0, 6)}</p>
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <Label htmlFor="amount">Amount to Swap:</Label>
        <Input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter Amount"
          disabled={!poolExists}
        />
        {insufficientBalance && (
          <p className="text-red-500 text-sm mt-1">
            Insufficient balance. You need {amount} {token0Name || token0}
          </p>
        )}
        {amount && token0 && token1 && (
          <div className="mt-2">
            <p>You will receive:</p>
            {estimatedOutput ? (
              <>
                <p className="font-bold">
                  {parseFloat(estimatedOutput).toFixed(6)} {token1Name || token1.slice(0, 6)}
                </p>
                <p className="text-sm text-gray-600">
                  Exchange Rate: 1 {token0Name || token0.slice(0, 6)} = {
                    estimatedOutput && amount ? 
                    (parseFloat(estimatedOutput) / parseFloat(amount)).toFixed(6) : '0.00'
                  } {token1Name || token1.slice(0, 6)}
                </p>
              </>
            ) : poolExists ? (
              <p className="text-red-500">Unable to calculate exchange amount. Please check input values.</p>
            ) : (
              <p className="text-yellow-500">Pool does not exist for this token pair.</p>
            )}
          </div>
        )}
      </div>

      <Button 
        onClick={handleSwap} 
        className="mt-4"
        disabled={!poolExists || !amount || !estimatedOutput || insufficientBalance}
      >
        {insufficientBalance ? 'Insufficient Balance' : 'Swap Tokens'}
      </Button>
    </TooltipProvider>
  );
}
