import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { desc, like, or, eq, and } from "drizzle-orm";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server"; // <-- Import server auth

// Next.js 15 way to handle URL parameters for our Search & Filter
export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string, cat?: string }> }) {
  // 🚀 1. Check if the user is logged in directly on the server
  const { userId } = await auth();

  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.q || "";
  const categoryFilter = resolvedParams.cat || "";

  // 2. Build the Database Search Logic Dynamically
  let conditions = [];
  
  if (searchQuery) {
    conditions.push(
      or(
        like(items.title, `%${searchQuery}%`),
        like(items.description, `%${searchQuery}%`)
      )
    );
  }

  if (categoryFilter && categoryFilter !== "All") {
     // 🚀 THE FIX: We cast the string to match the exact database Enum
     conditions.push(
       eq(items.baseCategory, categoryFilter as "clothing" | "sneakers" | "jewelry" | "accessories")
     );
   }

  // 3. Fetch the items (Applying filters if the user searched for something)
  const baseQuery = db.select().from(items).orderBy(desc(items.createdAt));
  const fetchedItems = conditions.length > 0 
    ? await db.select().from(items).where(and(...conditions)).orderBy(desc(items.createdAt))
    : await baseQuery;

  // Hardcoded categories for your navigation bar
  const categories = ["All", "Sneakers", "Apparel", "Watches", "Handbags", "Accessories", "Collectibles"];

  // Helper to safely parse images
  const getThumbnail = (item: any) => {
    try {
      const parsed = typeof item.mediaUrls === 'string' ? JSON.parse(item.mediaUrls) : item.mediaUrls;
      return parsed?.length > 0 ? parsed[0] : "https://placehold.co/400x400/f4f4f5/a1a1aa?text=No+Image";
    } catch (e) { return "https://placehold.co/400x400/f4f4f5/a1a1aa?text=No+Image"; }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-primary selection:text-black">
      
      {/* ========================================== */}
      {/* 1. THE STOCKX-STYLE PREMIUM HEADER           */}
      {/* ========================================== */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4 md:gap-8">
          
          <Link href="/" className="text-3xl font-black tracking-tighter text-white hover:text-gray-300 transition-colors">
            Closet<span className="text-green-500">Swap</span>
          </Link>

          {/* Native HTML Search Bar (Updates the URL without React State) */}
          <form action="/" method="GET" className="flex-1 max-w-2xl relative hidden md:block group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors">🔍</span>
            <input 
              type="text" 
              name="q"
              defaultValue={searchQuery}
              placeholder="Search for brand, color, etc." 
              className="w-full bg-[#1A1A1A] border border-white/10 hover:border-white/20 rounded-full py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-white transition-all text-white placeholder:text-gray-500 font-medium"
            />
            {/* Hidden input to keep category active while searching */}
            {categoryFilter && <input type="hidden" name="cat" value={categoryFilter} />}
          </form>

          {/* 🚀 4. Server-Side Conditional Navigation */}
          <div className="flex items-center gap-6 text-sm font-bold">
            {userId ? (
              <>
                <Link href="/inbox" className="hidden md:block hover:text-white text-gray-400 transition-colors">Inbox</Link>
                <Link href="/closet" className="hidden md:block hover:text-white text-gray-400 transition-colors">My Closet</Link>
                <Link href="/upload" className="bg-white text-black px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">Sell</Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link href="/sign-in" className="hover:text-white text-gray-400 transition-colors">Login</Link>
                <Link href="/sign-up" className="bg-white text-black px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors">Sign Up</Link>
              </>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. HORIZONTAL CATEGORY NAVIGATION            */}
        {/* ========================================== */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-8 overflow-x-auto custom-scrollbar py-4 text-[13px] font-bold uppercase tracking-wider">
          {categories.map(cat => {
            const isActive = categoryFilter === cat || (!categoryFilter && cat === "All");
            return (
              <Link 
                key={cat} 
                href={`/?${searchQuery ? `q=${searchQuery}&` : ''}cat=${cat === "All" ? "" : cat}`}
                className={`whitespace-nowrap transition-colors relative ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {cat}
                {isActive && <span className="absolute -bottom-4 left-0 w-full h-[2px] bg-white rounded-t-md"></span>}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 py-4 border-b border-white/10 bg-[#0A0A0A]">
        <form action="/" method="GET" className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input type="text" name="q" defaultValue={searchQuery} placeholder="Search..." className="w-full bg-[#1A1A1A] border border-white/10 rounded-full py-3 pl-10 pr-4 text-sm text-white focus:outline-none" />
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        
        {/* Dynamic Title Area */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              {searchQuery ? `Results for "${searchQuery}"` : categoryFilter && categoryFilter !== "All" ? `${categoryFilter} Collection` : "Top Deals & Discoveries"}
            </h1>
            <p className="text-gray-400 text-sm md:text-base font-medium">The best premium inventory available on the market.</p>
          </div>
          <span className="hidden md:block text-sm text-gray-500 font-medium">{fetchedItems.length} items found</span>
        </div>

        {/* ========================================== */}
        {/* 3. THE LUXURY PRODUCT GRID                   */}
        {/* ========================================== */}
        {fetchedItems.length === 0 ? (
          <div className="text-center py-32 bg-[#111] rounded-3xl border border-white/5">
            <p className="text-xl text-gray-400 font-bold mb-2">No items found.</p>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your search or category filter.</p>
            <Link href="/" className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors">Clear All Filters</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {fetchedItems.map(item => (
              <Link href={`/item/${item.id}`} key={item.id} className="group flex flex-col bg-white rounded-[24px] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] border border-white/5">
  
  {/* 1. The Image Box (Added p-6 to create the frame, overflow-hidden keeps it clean) */}
  <div className="aspect-square bg-[#F4F4F5] relative p-6 flex items-center justify-center overflow-hidden">
    
    {/* 2. The Floating Pill Badge (Moved down and right, made it a sleek white pill) */}
    <div className="absolute top-4 left-4 z-10">
      <span className="bg-white/95 backdrop-blur text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-black/5">
        {item.transactionType?.replace('_', ' ')}
      </span>
    </div>

    {/* 3. The Image (Added rounded-lg so if the photo has a background, it looks like a clean inner card) */}
    <img 
      src={getThumbnail(item)} 
      alt={item.title} 
      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-500 ease-out"
    />
  </div>

  {/* 4. The Info Box (Cleaned up the spacing and text hierarchy) */}
  <div className="p-5 flex-1 flex flex-col justify-between bg-white">
    <div>
      <h3 className="text-black font-extrabold text-[16px] leading-tight line-clamp-1 group-hover:text-gray-600 transition-colors">
        {item.title}
      </h3>
      <p className="text-gray-400 text-[11px] uppercase font-bold tracking-widest mt-1">{item.baseCategory}</p>
    </div>
    
    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
      <div className="flex flex-col">
  <span className="text-gray-400 text-[9px] uppercase font-bold">Current Value</span>
  <span className="text-black font-black text-xl">
    {/* 🚀 THE FIX: Dynamically read the price from the database! */}
    {item.transactionType === 'swap_only' 
      ? 'Trade' 
      : item.salePrice 
        ? `$${item.salePrice}` 
        : '$--'}
  </span>
</div>
      <div className="bg-[#111] text-white w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-black group-hover:scale-110 transition-all shadow-md">
        <span className="text-sm font-bold">→</span>
      </div>
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