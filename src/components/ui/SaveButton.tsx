"use client";

import { useState } from "react";
import { toggleSaveItem } from "@/actions/save";
import { useRouter } from "next/navigation";

interface SaveButtonProps {
  itemId: string;
  initialIsSaved: boolean;
  saveCount: number;
}

export default function SaveButton({ itemId, initialIsSaved, saveCount }: SaveButtonProps) {
  // We use state to instantly flip the color before the server responds
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [count, setCount] = useState(saveCount);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    // 1. Optimistic UI Update (Instant visual feedback)
    setIsSaved(!isSaved);
    setCount(prev => isSaved ? prev - 1 : prev + 1);
    setIsLoading(true);

    // 2. Actually hit the server
    const result = await toggleSaveItem(itemId);

    // 3. If the server crashes or user isn't logged in, revert the visual change
    if (result.error) {
      setIsSaved(initialIsSaved);
      setCount(saveCount);
      alert(result.error);
      if (result.error.includes("logged in")) {
        router.push("/sign-in");
      }
    }
    
    setIsLoading(false);
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all border ${
        isSaved 
          ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20' 
          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      <span className="text-xl leading-none">{isSaved ? '♥' : '♡'}</span>
      <span className="text-sm">
        {isSaved ? 'Saved' : 'Save'} <span className="opacity-50 ml-1">({count})</span>
      </span>
    </button>
  );
}