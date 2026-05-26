"use client";

import { useState } from "react";
import { uploadItem } from "@/actions/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadButton } from "@uploadthing/react"; 
import { OurFileRouter } from "../api/uploadthing/core";

export default function UploadPage() {
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [listingType, setListingType] = useState<string>(""); // 🚀 NEW: Tracks if we need to ask for a price!

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background">
      <div className="w-full max-w-2xl bg-card border border-white/10 rounded-xl p-6 md:p-8 shadow-2xl">
        
        <div className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Add to Your Closet</h1>
          <p className="text-sm md:text-base text-gray-400">List an item for swap, sale, or both.</p>
        </div>

        <form 
          action={uploadItem}
          onSubmit={() => setIsSubmitting(true)}
          className="space-y-6"
        >
          <input type="hidden" name="mediaUrls" value={JSON.stringify(mediaUrls)} />

          <div className="space-y-3">
            <Label className="text-md font-semibold">
              Item Media {isUploading && <span className="text-primary animate-pulse"> (Uploading...)</span>}
            </Label>
            
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-xl bg-black/20">
              {mediaUrls.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-2">
                    {mediaUrls.map((url, i) => (
                      <img key={i} src={url} className="w-24 h-24 object-cover rounded-lg border border-primary/50" />
                    ))}
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={() => setMediaUrls([])}>
                    Remove Images
                  </Button>
                </div>
              ) : (
                <UploadButton<OurFileRouter>
                  endpoint="itemMedia"
                  onUploadBegin={() => setIsUploading(true)}
                  onClientUploadComplete={(res) => {
  // 🚀 Change file.url to file.ufsUrl
  const urls = res.map(file => (file as any).ufsUrl || file.url);
  setMediaUrls((prev) => [...prev, ...urls]);
  setIsUploading(false);
}}
                  onUploadError={(error: Error) => {
                    setIsUploading(false);
                    alert(`Upload Error: ${error.message}`);
                  }}
                  // 🚀 FIXED UPLOAD BUTTON STYLING
                  className="ut-button:bg-white ut-button:text-black ut-button:font-bold ut-button:w-full ut-allowed-content:text-gray-500"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Item Title</Label>
            <Input id="title" name="title" placeholder="e.g., Vintage Jordan 1 Chicago" required className="bg-background" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
            <div className="space-y-2">
              <Label htmlFor="baseCategory">Category</Label>
              <input type="hidden" name="baseCategory" value={category} />
              <Select onValueChange={setCategory} required>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="sneakers">Sneakers</SelectItem>
                  <SelectItem value="jewelry">Jewelry</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemCondition">Condition</Label>
              <Select name="itemCondition" required>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_with_tags">New With Tags</SelectItem>
                  <SelectItem value="like_new">Like New</SelectItem>
                  <SelectItem value="fairly_used">Fairly Used</SelectItem>
                  <SelectItem value="vintage_distressed">Vintage / Distressed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DYNAMIC ATTRIBUTES SECTION */}
          {category === "sneakers" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10 transition-all">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-primary font-bold">Brand</Label>
                <Input name="attr_brand" placeholder="Nike, Adidas..." className="bg-background h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-primary font-bold">Size (US)</Label>
                <Input name="attr_size" placeholder="10.5" className="bg-background h-8 text-sm" />
              </div>
            </div>
          )}

          {category === "jewelry" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10 transition-all">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-primary font-bold">Material</Label>
                <Input name="attr_material" placeholder="14k Gold, Silver..." className="bg-background h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-primary font-bold">Gemstone</Label>
                <Input name="attr_gemstone" placeholder="Diamond, None" className="bg-background h-8 text-sm" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Tell us about the fit, history, and flaws..." required className="bg-background min-h-[120px]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionType">Listing Type</Label>
            <input type="hidden" name="transactionType" value={listingType} />
            <Select onValueChange={setListingType} required>
              <SelectTrigger className="bg-background border-primary/50">
                <SelectValue placeholder="How do you want to list this?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="swap_only">Swap Only (No cash)</SelectItem>
                <SelectItem value="sale_only">Sale Only (Makers/Boutique)</SelectItem>
                <SelectItem value="both">Open to Swap or Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 🚀 NEW: DYNAMIC PRICE FIELD! Only shows if selling is allowed */}
          {(listingType === "sale_only" || listingType === "both") && (
            <div className="space-y-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Label htmlFor="salePrice" className="text-green-500 font-bold">Asking Price (USD)</Label>
              <Input 
                type="number" 
                id="salePrice" 
                name="salePrice" 
                placeholder="e.g., 150.00" 
                min="0" 
                step="0.01" 
                required 
                className="bg-background border-green-500/30 focus-visible:ring-green-500" 
              />
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting || isUploading} 
            className="w-full h-14 text-lg font-black mt-6 bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {isSubmitting ? "Syncing to TiDB..." : "List Item"}
          </Button>

        </form>
      </div>
    </main>
  );
}