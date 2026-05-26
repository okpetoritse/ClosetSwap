import { db } from "@/lib/db";
import { items, savedItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm"; 
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";
import OfferModal from "@/components/ui/OfferModal";
import SaveButton from "@/components/ui/SaveButton";
import BuyButton from "@/components/ui/BuyButton";
import ImageGallery from "@/components/ui/ImageGallery";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Fetch the target item
  const [item] = await db.select().from(items).where(eq(items.id, id));
  if (!item) notFound();

  // 2. Fetch the current user's closet (if logged in)
  const { userId } = await auth();
  let myItems: any[] = [];
  let isSavedByMe = false; 

  if (userId) {
    myItems = await db.select().from(items).where(eq(items.ownerId, userId));

    const savedRecord = await db.select()
      .from(savedItems)
      .where(and(eq(savedItems.userId, userId), eq(savedItems.itemId, item.id)));
    isSavedByMe = savedRecord.length > 0;
  }

  // Get total save count (Social Proof!)
  const totalSaves = await db.select().from(savedItems).where(eq(savedItems.itemId, item.id));
  const saveCount = totalSaves.length;

  // 3. Fetch the SELLER'S profile from Clerk
  let seller;
  try {
    const client = await clerkClient();
    seller = await client.users.getUser(item.ownerId);
  } catch (e) {
    console.error("Could not fetch seller");
  }

  // Safe attributes parsing
  let parsedAttributes: Record<string, any> = {};
  try {
    if (typeof item.attributes === 'string') parsedAttributes = JSON.parse(item.attributes);
    else if (typeof item.attributes === 'object' && item.attributes !== null) parsedAttributes = item.attributes;
  } catch (e) {}

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <nav className="max-w-6xl mx-auto mb-8 border-b border-white/10 pb-4">
        <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          ← Back to Feed
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* 📸 LEFT COLUMN: MULTI-IMAGE GALLERY */}
        <div className="relative w-full">
          
          {/* Floating Category Badge */}
          <div className="absolute top-4 left-4 z-10 bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md border border-white/20">
            {item.baseCategory}
          </div>
          
          {/* The Interactive Image Gallery Engine */}
          <ImageGallery mediaUrls={item.mediaUrls} />
          
        </div>

        {/* 📝 RIGHT COLUMN: ITEM DETAILS */}
        <div className="flex flex-col pt-2">
          
          <div className="flex justify-between items-center mb-4">
            <SaveButton 
              itemId={item.id} 
              initialIsSaved={isSavedByMe} 
              saveCount={saveCount} 
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
            {item.title}
          </h1>

          {/* SELLER BADGE */}
          {seller && (
            <Link href={`/user/${seller.id}`} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl mb-8 hover:bg-white/10 transition-colors group">
              <img src={seller.imageUrl} alt={seller.firstName || "Seller"} className="w-12 h-12 rounded-full object-cover border border-white/20" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Owned By</p>
                <p className="text-base font-bold text-white group-hover:text-primary transition-colors">
                  {seller.firstName} {seller.lastName}
                </p>
              </div>
              <div className="ml-auto text-gray-500 group-hover:text-white transition-colors">
                →
              </div>
            </Link>
          )}

          {/* ITEM SPECS */}
          <div className="space-y-8 mb-8 flex-1">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Condition</h3>
              <p className="text-lg font-bold">{item.itemCondition?.replace(/_/g, ' ')}</p>
            </div>

            {/* Dynamic Specifications Grid */}
            {(() => {
              const validAttributes = Object.entries(parsedAttributes).filter(
                ([key, value]) => value && String(value).trim() !== ""
              );

              if (validAttributes.length === 0) return null;

              return (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {validAttributes.map(([key, value]) => (
                      <div key={key} className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm">
                        <p className="text-[10px] uppercase text-primary font-bold mb-1 tracking-widest">
                          {key.replace('attr_', '')}
                        </p>
                        <p className="text-base font-semibold capitalize">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          </div>

          {/* 💰 DYNAMIC TRANSACTION BUTTONS */}
          <div className="flex flex-col gap-4 pt-8 border-t border-white/10 mt-auto">
            
            {/* BUY NOW: Stripe Checkout */}
            {(item.transactionType === 'sale_only' || item.transactionType === 'both') && (
              <BuyButton itemId={item.id} price={item.salePrice || "0"} />
            )}

            {/* TRADE BUTTON: Offer Modal */}
            {(item.transactionType === 'swap_only' || item.transactionType === 'both') && (
              <div className="w-full">
                <OfferModal 
                  targetItemId={item.id} 
                  receiverId={item.ownerId} 
                  myItems={myItems} 
                />
              </div>
            )}

            {/* MESSAGE SELLER */}
            <Link href={`/inbox?user=${item.ownerId}&item=${item.id}`} className="w-full">
              <button className="w-full h-12 mt-2 border-2 border-white/10 text-gray-400 hover:text-white hover:border-white/30 text-sm font-bold uppercase tracking-widest transition-all rounded-full">
                Message Seller
              </button>
            </Link>

          </div>
          
        </div>
      </div>
    </main>
  );
}