import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function UserStorefrontPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch the User's Profile from Clerk
  let seller;
  try {
    const client = await clerkClient();
    seller = await client.users.getUser(id);
  } catch (error) {
    // If the user doesn't exist, Next.js automatically shows a 404 page
    notFound(); 
  }

  // 2. Fetch the User's Public Inventory from TiDB
  const userItems = await db.select()
    .from(items)
    .where(eq(items.ownerId, id))
    .orderBy(desc(items.createdAt));

  // Helper to safely parse images
  const getThumbnail = (item: any) => {
    try {
      const parsed = typeof item.mediaUrls === 'string' ? JSON.parse(item.mediaUrls) : item.mediaUrls;
      return parsed?.length > 0 ? parsed[0] : "https://placehold.co/400x400/f4f4f5/a1a1aa?text=No+Image";
    } catch (e) { return "https://placehold.co/400x400/f4f4f5/a1a1aa?text=No+Image"; }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      
      {/* 1. Header Navigation */}
      <nav className="border-b border-white/10 bg-[#0A0A0A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
            ← Back to Feed
          </Link>
          <span className="text-xl font-black tracking-tight">Closet<span className="text-green-500">Swap</span></span>
        </div>
      </nav>

      {/* 2. The Seller Profile Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 border-b border-white/10">
        <div className="flex items-center gap-6">
          <img 
            src={seller.imageUrl} 
            alt={seller.firstName || "User"} 
            className="w-24 h-24 rounded-full border-4 border-[#1A1A1A] shadow-xl object-cover"
          />
          <div>
            <h1 className="text-3xl font-black mb-1">
              {seller.firstName} {seller.lastName}
            </h1>
            <p className="text-gray-400 font-medium">
              Joined {new Date(seller.createdAt).toLocaleDateString()} • {userItems.length} active listings
            </p>
          </div>
        </div>
      </div>

      {/* 3. The Inventory Grid (StockX Style) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h2 className="text-xl font-extrabold mb-8 uppercase tracking-wider text-gray-300">Public Inventory</h2>
        
        {userItems.length === 0 ? (
          <div className="text-center py-20 bg-[#111] rounded-2xl border border-white/5">
            <p className="text-gray-400">This closet is currently empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {userItems.map(item => (
              <Link href={`/item/${item.id}`} key={item.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.15)]">
                
                <div className="aspect-square bg-[#F6F6F6] relative p-6 flex items-center justify-center">
                   <div className="absolute top-3 left-3 bg-black/80 backdrop-blur text-white text-[9px] font-black px-2.5 py-1.5 rounded uppercase tracking-widest shadow-sm">
                    {item.transactionType?.replace('_', ' ')}
                  </div>
                  <img 
                    src={getThumbnail(item)} 
                    alt={item.title} 
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="text-black font-extrabold text-[15px] leading-tight line-clamp-2 mb-1 group-hover:text-gray-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-[11px] uppercase font-bold tracking-wider">{item.baseCategory}</p>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-black font-black text-xl">
                       {item.transactionType === 'sale_only' ? '$--' : 'Trade'}
                    </span>
                    <span className="bg-[#111] text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-wider hover:bg-black transition-colors">
                      View
                    </span>
                  </div>
                </div>

              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}