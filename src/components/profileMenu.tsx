"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { emojiAvatarForAddress } from "@/lib/emojiAvatarForAddress";
import { formatUnits } from "viem";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

const tokenAddresses: `0x${string}`[] = [
  "0x0000000000000000000000000000000000001235", // APLO
  "0x0000000000000000000000000000000000001234", // GAPLO
  "0xd3F708a6aAfEDD0845928215E74a0f59cAC2D1f0", // WAPLO
];

interface SwapProps {
  onUseHistory: (item: SwapHistory) => void;
}

export function ProfileMenu({ onUseHistory }: SwapProps) {
  const { setTheme } = useTheme();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { color: backgroundColor, emoji } = emojiAvatarForAddress(address ?? "");
  const [swapHistory, setSwapHistory] = useState<SwapHistory[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const history = localStorage.getItem('swapHistory');
    if (history) {
      setSwapHistory(JSON.parse(history));
    }
  }, []);

  const clearHistory = () => {
    setSwapHistory([]);
    localStorage.setItem('swapHistory', JSON.stringify([]));
    toast({
      title: "Success",
      description: "History cleared successfully!",
    });
  };

  const handleUseHistory = (item: SwapHistory) => {
    onUseHistory(item);
    toast({
      title: "Success",
      description: "History item loaded successfully!",
    });
  };

  if (!isConnected) {
    return (
      <Button onClick={openConnectModal}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor }}
          >
            {emoji}
          </div>
          <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Address: {address?.slice(0, 6)}...{address?.slice(-4)}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {tokenAddresses.map((token) => {
            const { data } = useBalance({
              address,
              token,
            });
            
            return data ? (
              <DropdownMenuItem key={token}>
                {Number(formatUnits(data.value, data.decimals)).toFixed(4)} {data.symbol}
              </DropdownMenuItem>
            ) : null;
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Swap History
            </DropdownMenuItem>
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
            <div className="mt-4">
              {swapHistory.length === 0 ? (
                <p className="text-center text-muted-foreground">No swap history yet</p>
              ) : (
                swapHistory.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "mb-2 p-2 rounded relative",
                      "bg-secondary hover:bg-secondary/80",
                      "flex justify-between items-center"
                    )}
                  >
                    <div className="flex flex-col flex-grow">
                      <p>{item.token0Name || item.token0.slice(0, 6)} → {item.token1Name || item.token1.slice(0, 6)}</p>
                      <p className="text-sm text-muted-foreground">Amount: {item.amount}</p>
                      {item.outputAmount && (
                        <p className="text-sm text-muted-foreground">Output: {item.outputAmount}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>Contract: {item.contractAddress.slice(0, 6)}...{item.contractAddress.slice(-4)}</p>
                      </div>
                    </div>
                    <div className="flex items-center ml-4">
                      <Button 
                        size="sm"
                        onClick={() => handleUseHistory(item)}
                        className="h-8"
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => disconnect()}>
          Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 