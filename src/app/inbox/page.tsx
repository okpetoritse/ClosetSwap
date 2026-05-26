import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { offers, items, messages } from "@/lib/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import OfferActions from "@/components/ui/OfferActions";
import OfferChat from "@/components/ui/OfferChat";

// 🚀 Next.js 15 way to handle URL parameters safely
export default async function InboxPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "received"; // Defaults to "received"

  // 1. Fetch offers dynamically based on the active tab
  let allMyOffers = [];
  if (currentTab === "sent") {
    allMyOffers = await db.select().from(offers).where(eq(offers.senderId, userId));
  } else {
    allMyOffers = await db.select().from(offers).where(eq(offers.receiverId, userId));
  }

  const activeOffers = allMyOffers.filter(o => o.status === "pending");
  const pastOffers = allMyOffers.filter(o => o.status === "accepted" || o.status === "rejected");

  // 2. Extract Items and Fetch Them
  const allItemIds = new Set<string>();
  activeOffers.forEach(offer => {
    allItemIds.add(offer.targetItemId);
    let parsedOffered: string[] = [];
    try {
      if (typeof offer.offeredItemIds === 'string') parsedOffered = JSON.parse(offer.offeredItemIds);
      else if (Array.isArray(offer.offeredItemIds)) parsedOffered = offer.offeredItemIds;
    } catch (e) {}
    parsedOffered.forEach(id => allItemIds.add(id));
  });

  let relatedItems: Record<string, any> = {};
  if (allItemIds.size > 0) {
    const itemsData = await db.select().from(items).where(inArray(items.id, Array.from(allItemIds)));
    itemsData.forEach(item => { relatedItems[item.id] = item; });
  }

  // 3. Fetch Messages
  let activeMessages: any[] = [];
  const activeOfferIds = activeOffers.map(o => o.id);
  if (activeOfferIds.length > 0) {
    activeMessages = await db.select()
      .from(messages)
      .where(inArray(messages.offerId, activeOfferIds))
      .orderBy(asc(messages.createdAt));
  }

  const getThumbnail = (item: any) => {
    if (!item) return "https://placehold.co/200x200/1a1a1a/333333?text=Deleted";
    try {
      const parsed = typeof item.mediaUrls === 'string' ? JSON.parse(item.mediaUrls) : item.mediaUrls;
      return parsed?.length > 0 ? parsed[0] : "https://placehold.co/200x200/1a1a1a/333333?text=No+Img";
    } catch (e) { return "https://placehold.co/200x200/1a1a1a/333333?text=No+Img"; }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <nav className="max-w-4xl mx-auto mb-8 border-b border-white/10 pb-4 flex justify-between items-center">
        <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          ← Back to Feed
        </Link>
        <span className="text-xs text-gray-500 font-mono">Past Trades: {pastOffers.length}</span>
      </nav>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-6">Trade Inbox</h1>
        
        {/* 🚀 NEW: The Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <Link 
            href="/inbox?tab=received" 
            className={`pb-3 text-sm font-bold transition-colors ${currentTab === 'received' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Received Offers
          </Link>
          <Link 
            href="/inbox?tab=sent" 
            className={`pb-3 text-sm font-bold transition-colors ${currentTab === 'sent' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Sent Offers
          </Link>
        </div>

        {activeOffers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-card/20">
            <p className="text-gray-400">No active offers in this folder.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeOffers.map(offer => {
              const targetItem = relatedItems[offer.targetItemId];
              let offeredIds: string[] = [];
              try { offeredIds = typeof offer.offeredItemIds === 'string' ? JSON.parse(offer.offeredItemIds) : offer.offeredItemIds || []; } catch(e){}
              const offeredItems = offeredIds.map(id => relatedItems[id]).filter(Boolean);
              const threadMessages = activeMessages.filter(m => m.offerId === offer.id);

              // Determine visual text based on tab context
              const isSentTab = currentTab === "sent";

              return (
                <div key={offer.id} className="bg-card/40 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                  
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-6 pb-6 border-b border-white/5">
                    <div className="flex-1">
                      <p className="text-[10px] uppercase text-primary font-bold tracking-widest mb-2">
                        {isSentTab ? "You Want Their:" : "They Want Your:"}
                      </p>
                      <Link href={`/item/${targetItem?.id}`} className="flex items-center gap-3 group">
                        <img src={getThumbnail(targetItem)} className="w-12 h-12 rounded-md object-cover border border-white/10 group-hover:border-primary transition-colors" />
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors">{targetItem?.title || "Item Unavailable"}</span>
                      </Link>
                    </div>

                    <div className="hidden md:block text-2xl text-gray-600">⇌</div>

                    <div className="flex-1 md:text-right">
                      <p className="text-[10px] uppercase text-green-400 font-bold tracking-widest mb-2">
                        {isSentTab ? "You Offered:" : "They Offered:"}
                      </p>
                      <div className="flex items-center md:justify-end gap-3 flex-wrap">
                        {offeredItems.length > 0 && offeredItems.map(item => (
                          <Link href={`/item/${item.id}`} key={item.id} className="group relative">
                            <img src={getThumbnail(item)} className="w-12 h-12 rounded-md object-cover border border-white/10 group-hover:border-green-400 transition-colors" title={item.title} />
                          </Link>
                        ))}
                        {Number(offer.cashAmount) > 0 && (
                          <div className="h-12 px-4 rounded-md border border-green-500/30 bg-green-500/10 flex items-center justify-center font-black text-green-400">
                            ${offer.cashAmount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-300">Initial Note: <span className="italic font-normal text-gray-400">"{offer.message}"</span></p>
                    </div>
                    {/* ONLY SHOW ACCEPT/DECLINE IF YOU ARE THE RECEIVER */}
                    {!isSentTab && <OfferActions offerId={offer.id} />}
                    {isSentTab && <div className="text-sm font-bold text-yellow-500/80 bg-yellow-500/10 px-4 py-2 rounded-lg">Awaiting Reply...</div>}
                  </div>

                  {/* The Chat Box - Works both ways! */}
                  <OfferChat 
                    offerId={offer.id}
                    currentUserId={userId}
                    otherUserId={isSentTab ? offer.receiverId : offer.senderId}
                    initialMessages={threadMessages}
                  />

                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}