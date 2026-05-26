"use client";

import { useState } from "react";
import { respondToOffer } from "@/actions/offers";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function OfferActions({ offerId }: { offerId: string }) {
  const [isProcessing, setIsProcessing] = useState<"accepted" | "rejected" | null>(null);
  const router = useRouter();

  const handleAction = async (action: "accepted" | "rejected") => {
    setIsProcessing(action);
    const result = await respondToOffer(offerId, action);
    
    if (result.error) {
      alert(result.error);
      setIsProcessing(null);
    } else {
      // Refresh the page so the accepted/declined offer disappears from the pending list
      router.refresh(); 
    }
  };

  return (
    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
      <Button 
        variant="outline" 
        disabled={isProcessing !== null}
        onClick={() => handleAction("rejected")}
        className="flex-1 md:flex-none border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
      >
        {isProcessing === "rejected" ? "Declining..." : "Decline"}
      </Button>
      
      <Button 
        disabled={isProcessing !== null}
        onClick={() => handleAction("accepted")}
        className="flex-1 md:flex-none bg-green-500 text-black hover:bg-green-400 font-bold transition-colors"
      >
        {isProcessing === "accepted" ? "Accepting..." : "Accept Swap"}
      </Button>
    </div>
  );
}