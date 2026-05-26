import Stripe from "stripe";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

// Safely initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia",
});

export default async function CheckoutSuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ session_id?: string }> 
}) {
  // 1. Catch the session ID from the URL
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/"); // If no session ID, kick them back to the homepage
  }

  try {
    // 2. Ask Stripe if this session is legitimate and paid
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      throw new Error("Payment has not been completed.");
    }

    // 3. Extract the hidden metadata we sent earlier
    const itemId = session.metadata?.itemId;
    const buyerId = session.metadata?.buyerId;

    if (!itemId || !buyerId) {
      throw new Error("Missing transaction metadata.");
    }

    // 4. THE SMART CONTRACT: Transfer Ownership in TiDB
    // We update the ownerId to the buyer, and change transactionType so it's no longer for sale
    await db.update(items)
      .set({ 
        ownerId: buyerId,
        transactionType: "swap_only" // Defaults to swap only for the new owner so they don't accidentally re-sell it immediately
      })
      .where(eq(items.id, itemId));

    // 5. Render the Success UI
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          
          {/* Background Glow Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-green-500/20 blur-[50px] pointer-events-none" />

          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
            <span className="text-green-500 text-4xl font-black">✓</span>
          </div>
          
          <h1 className="text-3xl font-black tracking-tight mb-2 text-white">Payment Secured</h1>
          <p className="text-gray-400 mb-8">
            Your transaction was successful. The item has been officially transferred to your closet ledger.
          </p>

          <div className="bg-black/50 p-4 rounded-xl border border-white/5 mb-8 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-bold uppercase tracking-widest">Amount Paid</span>
              <span className="text-white font-bold">${(session.amount_total! / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-bold uppercase tracking-widest">Transaction ID</span>
              <span className="text-white font-mono truncate max-w-[150px]">{session.payment_intent as string}</span>
            </div>
          </div>

          <Link href={`/user/${buyerId}`}>
            <button className="w-full h-14 bg-white text-black hover:bg-gray-200 transition-colors font-black text-lg rounded-full shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              View in My Closet
            </button>
          </Link>
          
        </div>
      </main>
    );

  } catch (error) {
    console.error("Checkout Verification Error:", error);
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Verification Failed</h1>
          <p className="text-gray-400">We could not verify this transaction.</p>
          <Link href="/" className="text-primary mt-4 block hover:underline">Return Home</Link>
        </div>
      </main>
    );
  }
}