"use client";

import { useState } from "react";
import { saveAddress } from "@/actions/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function AddressForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await saveAddress(formData);
    
    if (result?.error) {
      alert(result.error);
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      setIsLoading(false);
    }
    setTimeout(() => {
        router.refresh();
      }, 2500);
  };

  if (isSuccess) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-green-500/20 blur-[50px] pointer-events-none" />
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
          <span className="text-green-500 text-3xl font-black">✓</span>
        </div>
        <h3 className="text-xl font-black text-white mb-2">Address Secured</h3>
        <p className="text-green-400/80 text-sm">Your physical location is locked in. You are ready to generate shipping labels.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white tracking-tight">Logistics Details</h2>
        <p className="text-gray-400 text-sm mt-1">Where should we send your acquired inventory?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        
        {/* Row 1: Full Name & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Full Legal Name</Label>
            <Input name="fullName" required placeholder="John Doe" className="h-12 bg-white/5 border-white/10 focus:border-white/30 transition-colors text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Phone Number</Label>
            <Input name="phone" required placeholder="(555) 123-4567" className="h-12 bg-white/5 border-white/10 focus:border-white/30 transition-colors text-white" />
          </div>
        </div>

        {/* Row 2: Street Address */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Street Address</Label>
          <Input name="street1" required placeholder="123 Luxury Ave" className="h-12 bg-white/5 border-white/10 focus:border-white/30 transition-colors text-white" />
        </div>

        {/* Row 3: Apt/Suite (Optional) */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Apt, Suite, Unit (Optional)</Label>
          <Input name="street2" placeholder="Suite 400" className="h-12 bg-white/5 border-white/10 focus:border-white/30 transition-colors text-white" />
        </div>

        {/* Row 4: City, State, Zip (3-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-500">City</Label>
            <Input name="city" required placeholder="Los Angeles" className="h-12 bg-white/5 border-white/10 focus:border-white/30 transition-colors text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-500">State / Region</Label>
            <Input name="state" required placeholder="CA" className="h-12 bg-white/5 border-white/10 focus:border-white/30 transition-colors text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Postal Code</Label>
            <Input name="zipCode" required placeholder="90210" className="h-12 bg-white/5 border-white/10 focus:border-white/30 transition-colors text-white" />
          </div>
        </div>

        <input type="hidden" name="country" value="US" /> {/* Default to US for now */}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-14 mt-4 text-lg font-black bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          {isLoading ? "Encrypting Logicstics..." : "Save Secure Address"}
        </Button>

      </form>
    </div>
  );
}