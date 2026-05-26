"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { offers, items } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm"; // <-- All Drizzle imports safely at the top!

// ==========================================
// ACTION 1: SUBMIT A NEW OFFER
// ==========================================
export async function submitOffer(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized: You must be logged in to make an offer." };

    const targetItemId = formData.get("targetItemId") as string;
    const receiverId = formData.get("receiverId") as string;
    const offerType = formData.get("offerType") as string;
    const cashAmount = formData.get("cashAmount") as string;
    const message = formData.get("message") as string;

    if (userId === receiverId) {
      return { error: "You cannot make an offer on an item you already own." };
    }

    const offeredItemIdsString = formData.get("offeredItemIds") as string;
    let offeredItemIds: string[] = [];
    try {
      if (offeredItemIdsString) offeredItemIds = JSON.parse(offeredItemIdsString);
    } catch (error) {
      offeredItemIds = [];
    }

    await db.insert(offers).values({
      id: randomUUID(),
      targetItemId,
      receiverId,
      senderId: userId,
      offerType,
      offeredItemIds,
      cashAmount: cashAmount || "0",
      message,
      status: "pending",
    });

    return { success: true };

  } catch (e: any) {
    console.error("Database Error:", e);
    return { error: "Failed to save offer to the database." };
  }
}

// ==========================================
// ACTION 2: RESPOND TO AN OFFER (THE SMART CONTRACT)
// ==========================================
export async function respondToOffer(offerId: string, response: "accepted" | "rejected") {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    // 1. Fetch the specific offer
    const [offer] = await db.select().from(offers).where(eq(offers.id, offerId));
    
    if (!offer) return { error: "Offer not found." };
    if (offer.receiverId !== userId) return { error: "You do not have permission to modify this offer." };
    if (offer.status !== "pending") return { error: "This offer has already been processed." };

    // 2. Update the offer ledger to Accepted or Rejected
    await db.update(offers)
      .set({ status: response })
      .where(eq(offers.id, offerId));

    // 3. THE SMART CONTRACT: If accepted, officially transfer the items!
    if (response === "accepted") {
      
      // Transfer the Target Item (Giving your item to the Sender)
      await db.update(items)
        .set({ ownerId: offer.senderId })
        .where(eq(items.id, offer.targetItemId));

      // Transfer the Offered Items (Taking their items into your Closet)
      let offeredIds: string[] = [];
      try {
        if (typeof offer.offeredItemIds === 'string') {
          offeredIds = JSON.parse(offer.offeredItemIds);
        } else if (Array.isArray(offer.offeredItemIds)) {
          offeredIds = offer.offeredItemIds;
        }
      } catch (e) {
        console.error("Failed to parse offered items for transfer");
      }

      if (offeredIds.length > 0) {
        await db.update(items)
          .set({ ownerId: userId }) // You are the receiver, so you get these items
          .where(inArray(items.id, offeredIds));
      }
    }

    return { success: true };
  } catch (e: any) {
    console.error("Action Error:", e);
    return { error: "Failed to process the offer." };
  }
}