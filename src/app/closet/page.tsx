import { generateShippingLabel } from "@/actions/shippo";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { items, savedItems, offers, addresses } from "@/lib/db/schema";
import { eq, desc, inArray, or, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AddressForm from "@/components/ui/AddressForm"; 
import { createCheckoutSession } from "@/actions/stripe";
import { createStripeConnectAccount } from "@/actions/connect";

export default async function ClosetPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await currentUser();
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "listings";

  // Check if the user already has a saved address
  const myAddresses = await db.select().from(addresses).where(eq(addresses.userId, userId));
  const hasAddress = myAddresses.length > 0;

  // Base items for the header stats
  const myItems = await db.select()
    .from(items)
    .where(eq(items.ownerId, userId))
    .orderBy(desc(items.createdAt));

  // --- DYNAMIC FETCHING LOGIC ---
  let displayItems: any[] = [];
  let mySentOffers: any[] = [];
  let myLedger: any[] = [];
  let allContextItems: any[] = []; 

  if (currentTab === "listings") {
    displayItems = myItems;
  } else if (currentTab === "saved") {
    const mySavedRecords = await db.select().from(savedItems).where(eq(savedItems.userId, userId));
    const savedItemIds = mySavedRecords.map(record => record.itemId);
    if (savedItemIds.length > 0) {
      displayItems = await db.select().from(items).where(inArray(items.id, savedItemIds)).orderBy(desc(items.createdAt));
    }
  } else if (currentTab === "offers") {
    mySentOffers = await db.select().from(offers).where(eq(offers.senderId, userId)).orderBy(desc(offers.createdAt));
    allContextItems = await db.select().from(items); 
  } else if (currentTab === "ledger") {
    myLedger = await db.select()
      .from(offers)
      .where(
        and(
          eq(offers.status, "accepted"),
          or(eq(offers.senderId, userId), eq(offers.receiverId, userId))
        )
      )
      .orderBy(desc(offers.createdAt));
    allContextItems = await db.select().from(items);
  }

  // Safe image parsing helper
  const getThumbnail = (item: any) => {
    try {
      const parsed = typeof item.mediaUrls === 'string' ? JSON.parse(item.mediaUrls) : item.mediaUrls;
      return parsed?.length > 0 ? parsed[0] : "https://placehold.co/400x400/1a1a1a/333333?text=No+Image";
    } catch (e) { return "https://placehold.co/400x400/1a1a1a/333333?text=No+Image"; }
  };

  // Safe array counter for images
  const getMediaCount = (item: any) => {
    try {
      const parsed = typeof item.mediaUrls === 'string' ? JSON.parse(item.mediaUrls) : item.mediaUrls;
      return parsed?.length || 1;
    } catch (e) { return 1; }
  };

  // Safe array counter for offers
  const getOfferedCount = (data: any) => {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    try {
      return JSON.parse(data).length;
    } catch (e) { return 0; }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <nav className="max-w-6xl mx-auto mb-8 border-b border-white/10 pb-4 flex justify-between items-center">
        <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">← Back to Feed</Link>
        <div className="flex gap-4">
            <Link href="/upload"><Button size="sm" className="font-bold text-xs bg-white text-black hover:bg-gray-200">+ Add Item</Button></Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        
        {/* Render the beautiful Address Form if they haven't set one yet */}
        {!hasAddress && (
          <div className="mb-12">
             <AddressForm />
          </div>
        )}

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 bg-card/30 p-6 md:p-10 rounded-3xl border border-white/5">
          <img src={user?.imageUrl} alt="Profile" className="w-24 h-24 rounded-full border-2 border-primary/50 shadow-xl" />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight">{user?.firstName ? `${user.firstName}'s Closet` : 'My Closet'}</h1>
            <p className="text-gray-400 mt-1 mb-4 text-sm">Managing your premium inventory</p>
            <div className="flex gap-6 justify-center md:justify-start">
              <div className="text-center md:text-left">
                <p className="text-2xl font-bold">{myItems.length}</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Active Listings</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 THE COMMAND CENTER (Always visible, perfectly aligned) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 bg-white/5 p-4 rounded-xl border border-white/10">
          
          {/* 1. Shippo Logistics Button */}
          <form action={async () => {
            "use server";
            const result = await generateShippingLabel();
            console.log("📦 SHIPPO RESULT:", result); 
          }}>
            <Button type="submit" className="w-full bg-primary text-black font-bold text-xs shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              Print Test Label
            </Button>
          </form>

          {/* 2. Stripe Connect Banking Button */}
          <form action={async () => {
            "use server";
            const result = await createStripeConnectAccount();
            if (result.success && result.url) {
              redirect(result.url);
            } else {
              console.error(result.error);
            }
          }}>
            <Button type="submit" className="w-full bg-transparent border border-green-500 text-green-400 font-bold text-xs hover:bg-green-500/10 transition-colors">
              Link Bank Account (To Get Paid)
            </Button>
          </form>

          {/* 3. Stripe Checkout Button */}
          <form action={async () => {
            "use server";
            const result = await createCheckoutSession("Vintage Jordan 4 Black Cat", 450.00);
            if (result.success && result.url) {
              redirect(result.url);
            } else {
              console.error(result.error);
            }
          }}>
            <Button type="submit" className="w-full bg-white text-black font-bold text-xs hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              Test Stripe Checkout
            </Button>
          </form>

        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-8 border-b border-white/10 overflow-x-auto">
          <Link href="/closet?tab=listings" className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors ${currentTab === 'listings' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}>My Inventory</Link>
          <Link href="/closet?tab=saved" className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors ${currentTab === 'saved' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}>Watchlist</Link>
          <Link href="/closet?tab=offers" className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors ${currentTab === 'offers' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}>Sent Offers</Link>
          <Link href="/closet?tab=ledger" className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors ${currentTab === 'ledger' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}>History</Link>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          
          {/* LISTINGS & SAVED TABS */}
          {(currentTab === "listings" || currentTab === "saved") && (
            <>
              {displayItems.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-card/20">
                  <p className="text-gray-400 mb-4">{currentTab === "listings" ? "Your closet is currently empty." : "You haven't saved any items yet."}</p>
                  <Link href={currentTab === "listings" ? "/upload" : "/"}><Button>{currentTab === "listings" ? "List Your First Item" : "Explore the Feed"}</Button></Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {displayItems.map((item) => (
                    <Link href={`/item/${item.id}`} key={item.id} className="group block relative rounded-xl overflow-hidden border border-white/10 bg-card hover:border-white/30 transition-all">
                      
                      {/* 🚀 Improved Gallery Wrapper */}
                      <div className="aspect-square bg-black/50 relative overflow-hidden">
                        <img 
                          src={getThumbnail(item)} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        {/* Quick Badge for Image Count */}
                        <div className="absolute top-2 right-2 bg-black/60 text-[10px] font-bold text-white px-2 py-1 rounded-full backdrop-blur-md border border-white/10">
                          {getMediaCount(item)} Photos
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase mt-1">{item.transactionType?.replace('_', ' ')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* SENT OFFERS TAB */}
          {currentTab === "offers" && (
            <div className="space-y-4">
              {mySentOffers.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-card/20">
                  <p className="text-gray-400 mb-4">You haven't sent any trade proposals yet.</p>
                </div>
              ) : (
                mySentOffers.map(offer => {
                  const targetItem = allContextItems.find(i => i.id === offer.targetItemId);
                  
                  // Status Colors
                  let statusColor = "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
                  if (offer.status === "accepted") statusColor = "text-green-500 border-green-500/30 bg-green-500/10";
                  if (offer.status === "rejected") statusColor = "text-red-500 border-red-500/30 bg-red-500/10";

                  return (
                    <div key={offer.id} className="bg-card border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/5 rounded-md overflow-hidden">
                          {targetItem && <img src={getThumbnail(targetItem)} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{targetItem?.title || "Item Unavailable"}</p>
                          <p className="text-[10px] text-gray-500 uppercase mt-1">
                            Offered: {getOfferedCount(offer.offeredItemIds)} Items + ${offer.cashAmount}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor}`}>
                        {offer.status}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* LEDGER TAB */}
          {currentTab === "ledger" && (
             <div className="space-y-4">
             {myLedger.length === 0 ? (
               <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-card/20">
                 <p className="text-gray-400 mb-4">No completed trades yet. Close some deals!</p>
               </div>
             ) : (
               myLedger.map(offer => {
                 const targetItem = allContextItems.find(i => i.id === offer.targetItemId);
                 const role = offer.senderId === userId ? "Sent" : "Received";
                 
                 return (
                   <div key={offer.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                     <div>
                       <p className="font-bold text-sm line-clamp-1">{targetItem?.title || "Unknown Item"}</p>
                       <p className="text-xs text-gray-400 mt-1">Type: {offer.offerType.replace(/_/g, ' ')}</p>
                     </div>
                     <div className="text-right">
                       <p className={`text-xs font-bold uppercase ${role === "Sent" ? "text-blue-400" : "text-purple-400"}`}>
                         {role}
                       </p>
                       <p className="text-[10px] text-gray-600 mt-1">{new Date(offer.createdAt).toLocaleDateString()}</p>
                     </div>
                   </div>
                 )
               })
             )}
           </div>
          )}

        </div>
      </div>
    </main>
  );
}