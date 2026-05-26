"use client";

import { useState } from "react";
import { submitOffer } from "@/actions/offers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

// Define the types for the props we will pass in
interface OfferModalProps {
  targetItemId: string;
  receiverId: string;
  myItems: any[]; // The items from the user's own closet
}

export default function OfferModal({ targetItemId, receiverId, myItems }: OfferModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  // Interactive State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [cashAmount, setCashAmount] = useState("");
  const [message, setMessage] = useState("");

  const toggleSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Determine offer type mathematically
    let offerType = "swap_only";
    if (selectedItemIds.length > 0 && Number(cashAmount) > 0) offerType = "cash_and_swap";
    if (selectedItemIds.length === 0 && Number(cashAmount) > 0) offerType = "cash_only";

    const formData = new FormData();
    formData.set("targetItemId", targetItemId);
    formData.set("receiverId", receiverId);
    formData.set("offerType", offerType);
    formData.set("offeredItemIds", JSON.stringify(selectedItemIds));
    formData.set("cashAmount", cashAmount);
    formData.set("message", message);

    try {
      // Wait for the server action to return our object
      const result = await submitOffer(formData);
      
      // If the server sent back an error, show the REAL error
      if (result?.error) {
        alert(result.error);
        setIsSubmitting(false);
        return;
      }

      // Success! Route the user to their closet
      router.push("/closet?success=offer_sent");
      
    } catch (error) {
      console.error(error);
      alert("A critical network error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* The Trigger Button */}
      <Button 
        onClick={() => setIsOpen(true)}
        className="flex-1 h-14 text-lg font-bold bg-white text-black hover:bg-gray-200"
      >
        Offer a Swap
      </Button>

      {/* The Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 relative">
            
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 rounded-full p-2"
            >
              ✕
            </button>

            <h2 className="text-2xl font-extrabold mb-2">Construct Your Offer</h2>
            <p className="text-gray-400 text-sm mb-6">Select items from your closet to trade, add cash to sweeten the deal, or both.</p>

            <form onSubmit={handleMakeOffer} className="space-y-8">
              
              {/* Closet Selection Section */}
              <div className="space-y-3">
                <Label className="text-md font-semibold text-primary">1. Select Items to Trade</Label>
                {myItems.length === 0 ? (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center text-sm text-gray-400">
                    Your closet is empty. You can only make cash offers right now.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {myItems.map(item => {
                      // Safe image parsing
                      let imgUrl = "https://placehold.co/200x200/1a1a1a/333333?text=No+Img";
                      try {
                        const parsed = typeof item.mediaUrls === 'string' ? JSON.parse(item.mediaUrls) : item.mediaUrls;
                        if (parsed?.length > 0) imgUrl = parsed[0];
                      } catch(e) {}

                      const isSelected = selectedItemIds.includes(item.id);

                      return (
                        <div 
                          key={item.id} 
                          onClick={() => toggleSelection(item.id)}
                          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${isSelected ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={imgUrl} alt={item.title} className="w-full aspect-square object-cover" />
                          {isSelected && <div className="bg-primary text-black text-[10px] font-bold text-center py-1 uppercase tracking-widest">Added</div>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Cash Section */}
              <div className="space-y-3">
                <Label className="text-md font-semibold text-green-400">2. Add Cash (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0.00" 
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="pl-8 bg-background border-white/10 text-lg" 
                  />
                </div>
              </div>

              {/* Message Section */}
              <div className="space-y-3">
                <Label className="text-md font-semibold">3. Attach a Message</Label>
                <Textarea 
                  placeholder="Hey, I'd love to trade my Jordans for this. Let me know!" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-background border-white/10"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isSubmitting || (selectedItemIds.length === 0 && (!cashAmount || Number(cashAmount) <= 0))}
                className="w-full h-14 text-lg font-bold shadow-xl transition-all"
              >
                {isSubmitting ? "Sending Offer..." : "Lock in & Send Offer"}
              </Button>

            </form>
          </div>
        </div>
      )}
    </>
  );
}