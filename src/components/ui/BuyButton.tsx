"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/actions/stripe"; // We will build this next!
import { useRouter } from "next/navigation";

interface BuyButtonProps {
  itemId: string;
  price: string;
}

export default function BuyButton({ itemId, price }: BuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // Ask the server to generate a secure Stripe URL
      const { url, error } = await createCheckoutSession(itemId);
      
      if (error) {
        alert(error);
        setIsLoading(false);
        return;
      }

      if (url) {
        // Redirect the user to the Stripe Checkout page
        router.push(url);
      }
    } catch (e) {
      alert("Something went wrong loading the checkout.");
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full h-14 bg-white text-black hover:bg-gray-200 transition-colors font-black text-lg rounded-full shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Loading Secure Checkout..." : (
        <>
          Buy Now <span className="opacity-50">•</span> ${price}
        </>
      )}
    </button>
  );
}