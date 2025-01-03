"use client";
import { useAccount } from "wagmi";
import Swap from "@/lib/web/web3Swap";
import { ProfileMenu } from "@/components/profileMenu";
import { useRef } from "react";
import Profile from "@/components/profile";

export default function Home() {
  const { isConnected } = useAccount();
  const swapRef = useRef<{ 
    setToken0: (value: string) => void;
    setToken1: (value: string) => void;
    setAmount: (value: string) => void;
    setContractAddress: (value: string) => void;
    initializeContract: (address: string) => void;
  }>(null);

  const handleUseHistory = (item: any) => {
    if (swapRef.current) {
      swapRef.current.setToken0(item.token0);
      swapRef.current.setToken1(item.token1);
      swapRef.current.setAmount(item.amount);
      swapRef.current.setContractAddress(item.contractAddress);
      swapRef.current.initializeContract(item.contractAddress);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex">
        {isConnected && <ProfileMenu onUseHistory={handleUseHistory} />}
      </div>
      
      <div className="p-6 bg-secondary rounded-lg shadow-lg relative w-4/5 md:w-2/5 overflow-hidden my-8">
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-secondary/90">
            <ProfileMenu onUseHistory={handleUseHistory} />
          </div>
        )}
        <Swap ref={swapRef} />
      </div>
      <Profile />
    </main>
  );
}
